// Validator for the committed chart images (D-14, D-15). Reads files only (no browser), so it
// also runs inside vitest and scripts/ci.sh.
// Usage: node scripts/check-visuals.mjs [--only <chart>[:<theme>]]   (exit 1, one error per line)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUT_DIR, PNG_SIZE, expectedFiles, parseOnly } from './lib/visuals-matrix.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * @param {{ root?: string, only?: string }} [opts]
 * @returns {string[]} error messages (empty when everything is valid)
 */
export function checkVisuals({ root = REPO_ROOT, only } = {}) {
  const errors = [];
  const selector = parseOnly(only);
  const dir = resolve(root, OUT_DIR);
  const expected = expectedFiles(selector);

  for (const name of expected) {
    const file = resolve(dir, name);
    if (!existsSync(file)) {
      errors.push(`${OUT_DIR}/${name}: missing`);
      continue;
    }
    const data = readFileSync(file);
    if (name.endsWith('.png')) {
      if (data.length < 24 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) {
        errors.push(`${OUT_DIR}/${name}: not a PNG (bad signature)`);
        continue;
      }
      const width = data.readUInt32BE(16);
      const height = data.readUInt32BE(20);
      if (width !== PNG_SIZE.width || height !== PNG_SIZE.height) {
        errors.push(`${OUT_DIR}/${name}: size ${width} x ${height}, expected ${PNG_SIZE.width} x ${PNG_SIZE.height}`);
      }
    } else {
      const text = data.toString('utf8');
      if (!/^\s*<svg[\s>]/.test(text)) errors.push(`${OUT_DIR}/${name}: does not start with an svg element`);
      if (!text.includes('xmlns="http://www.w3.org/2000/svg"')) errors.push(`${OUT_DIR}/${name}: missing xmlns attribute`);
      if (/<script[\s>]/i.test(text)) errors.push(`${OUT_DIR}/${name}: contains a script element`);
      if (/<foreignObject[\s>]/i.test(text)) errors.push(`${OUT_DIR}/${name}: contains a foreignObject element`);
    }
  }

  if (selector === null && existsSync(dir)) {
    const allowed = new Set([...expected, 'README.md']);
    for (const name of readdirSync(dir)) {
      if (!allowed.has(name)) errors.push(`${OUT_DIR}/${name}: unexpected file`);
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--only');
  let errors;
  try {
    errors = checkVisuals({ only: i >= 0 ? argv[i + 1] : undefined });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log('visuals ok');
}
