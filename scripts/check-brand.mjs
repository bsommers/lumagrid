// Validator for the generated brand assets (D-09). Reads brand/assets.json and the committed
// outputs only (no browser), so it also runs inside vitest and scripts/ci.sh.
// Usage: node scripts/check-brand.mjs   (exit 1 with one error per line)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ALLOWED_DIRS = ['site/public', 'docs/assets'];

/**
 * True when `out` resolves inside one of the directories generated assets may be written to.
 * @param {string} root
 * @param {string} out
 * @returns {boolean}
 */
export function isAllowedOutput(root, out) {
  const abs = resolve(root, out);
  return ALLOWED_DIRS.some((dir) => {
    const rel = relative(resolve(root, dir), abs);
    return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
  });
}

/**
 * Every output path named by the manifest.
 * @param {any} manifest
 * @returns {string[]}
 */
export function manifestOutputs(manifest) {
  const outs = [];
  for (const p of manifest.pngs ?? []) outs.push(p.out);
  if (manifest.ico) outs.push(manifest.ico.out);
  for (const c of manifest.copies ?? []) outs.push(c.out);
  if (manifest.manifest) outs.push(manifest.manifest.out);
  return outs;
}

/**
 * Read width and height from a PNG IHDR chunk, or null when the buffer is not a PNG.
 * @param {Buffer} buf
 * @returns {{ width: number, height: number } | null}
 */
export function pngSize(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Validate the brand outputs.
 * @param {{ root?: string }} [opts]
 * @returns {string[]} error strings (empty when everything is valid)
 */
export function checkBrand({ root = REPO_ROOT } = {}) {
  const errors = [];
  const manifestPath = resolve(root, 'brand/assets.json');
  if (!existsSync(manifestPath)) return ['brand/assets.json is missing'];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return [`brand/assets.json is not valid JSON: ${err instanceof Error ? err.message : err}`];
  }

  for (const out of manifestOutputs(manifest)) {
    if (!isAllowedOutput(root, out)) errors.push(`${out}: output is outside ${ALLOWED_DIRS.join(' and ')}`);
  }

  for (const p of manifest.pngs ?? []) {
    const file = resolve(root, p.out);
    if (!existsSync(file)) {
      errors.push(`${p.out}: missing`);
      continue;
    }
    const size = pngSize(readFileSync(file));
    if (!size) errors.push(`${p.out}: not a PNG (bad signature)`);
    else if (size.width !== p.width || size.height !== p.height) {
      errors.push(`${p.out}: is ${size.width}x${size.height}, manifest says ${p.width}x${p.height}`);
    }
  }

  if (manifest.ico) errors.push(...checkIco(root, manifest));

  for (const c of manifest.copies ?? []) {
    if (!existsSync(resolve(root, c.out))) errors.push(`${c.out}: missing`);
  }

  if (manifest.manifest) errors.push(...checkWebManifest(root, manifest));
  return errors;
}

function checkIco(root, manifest) {
  const errors = [];
  const { out, images } = manifest.ico;
  const file = resolve(root, out);
  if (!existsSync(file)) return [`${out}: missing`];
  const buf = readFileSync(file);
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    return [`${out}: bad ICONDIR header`];
  }
  const count = buf.readUInt16LE(4);
  if (count !== images.length) {
    return [`${out}: directory lists ${count} images, manifest says ${images.length}`];
  }
  images.forEach((imgOut, i) => {
    const spec = (manifest.pngs ?? []).find((p) => p.out === imgOut);
    if (!spec) {
      errors.push(`${out}: image ${imgOut} is not a manifest png`);
      return;
    }
    const entry = 6 + i * 16;
    if (entry + 16 > buf.length) {
      errors.push(`${out}: directory entry ${i} is truncated`);
      return;
    }
    const w = buf[entry] || 256;
    const h = buf[entry + 1] || 256;
    if (w !== spec.width || h !== spec.height) {
      errors.push(`${out}: entry ${i} is ${w}x${h}, expected ${spec.width}x${spec.height}`);
    }
    const length = buf.readUInt32LE(entry + 8);
    const offset = buf.readUInt32LE(entry + 12);
    if (offset + length > buf.length) {
      errors.push(`${out}: entry ${i} points past the end of the file`);
      return;
    }
    const embedded = buf.subarray(offset, offset + length);
    const size = pngSize(embedded);
    if (!size) errors.push(`${out}: entry ${i} does not start with the PNG signature`);
    else if (size.width !== spec.width || size.height !== spec.height) {
      errors.push(`${out}: entry ${i} embeds a ${size.width}x${size.height} PNG`);
    }
  });
  return errors;
}

function checkWebManifest(root, manifest) {
  const errors = [];
  const out = manifest.manifest.out;
  const file = resolve(root, out);
  if (!existsSync(file)) return [`${out}: missing`];
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    return [`${out}: not valid JSON: ${err instanceof Error ? err.message : err}`];
  }
  for (const key of ['start_url', 'scope']) {
    const v = parsed[key];
    if (typeof v !== 'string' || v.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(v)) {
      errors.push(`${out}: ${key} must be a relative URL, got ${JSON.stringify(v)}`);
    }
  }
  if (!Array.isArray(parsed.icons) || parsed.icons.length === 0) {
    errors.push(`${out}: icons must be a non-empty array`);
    return errors;
  }
  const dir = dirname(file);
  for (const icon of parsed.icons) {
    const target = resolve(dir, String(icon.src));
    if (!existsSync(target)) {
      errors.push(`${out}: icon ${icon.src} does not exist`);
      continue;
    }
    const size = pngSize(readFileSync(target));
    if (!size) {
      errors.push(`${out}: icon ${icon.src} is not a PNG`);
      continue;
    }
    if (icon.sizes !== `${size.width}x${size.height}`) {
      errors.push(`${out}: icon ${icon.src} declares ${icon.sizes} but is ${size.width}x${size.height}`);
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkBrand();
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log('check-brand: OK');
}
