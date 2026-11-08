// Documentation consistency checker (npm run docs:check).
//
// Checks (select with --only a,b):
//   names       the former product and repository names appear only in the historical allowlist
//   historical  the nine historical files carry the historical note in their first three lines
//   links       relative links, images and html src/href targets exist and stay inside the repo
//   images      docs images are never remote
//   snippets    markdown code blocks match docs/guide/snippets regions verbatim
//
// Usage: node scripts/check-docs.mjs [--only names,links] [--root dir]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CHECKS = ['names', 'historical', 'links', 'images', 'snippets'];

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Matched case-insensitively against text files outside NAME_ALLOWLIST.
const STALE_NAME = /vizbox|uitoolbox/i;

const TEXT_EXTENSIONS = new Set([
  '.md', '.json', '.ts', '.tsx', '.js', '.cjs', '.mjs', '.html', '.css', '.svg',
  '.yml', '.yaml', '.sh', '.txt',
]);
const TEXT_BASENAMES = new Set(['NOTICE']);

// Paths (prefix when ending in "/", exact otherwise) where the former names may remain.
const NAME_ALLOWLIST = [
  '.planning/',
  '.claude/',
  'plans/',
  'REBUILD.md',
  '.security-reports/',
  'docs/superpowers/',
  '.ontology/',
  'CHANGELOG.md',
  'graphify-out/',
  'scripts/check-docs.mjs',
  'scripts/__tests__/check-docs.test.ts',
];

export const HISTORICAL_FILES = [
  'plans/vizbox.md',
  'plans/refactor-plugin-architecture.md',
  'REBUILD.md',
  '.security-reports/scan-2026-04-05.md',
  'docs/superpowers/plans/2026-08-06-nivo-adapter.md',
  'docs/superpowers/specs/2026-08-06-nivo-adapter-design.md',
  '.ontology/README.md',
  '.ontology/domain_schema.ttl',
  '.ontology/bfo_binding.cql',
];
const HISTORICAL_NOTE = 'Historical document';

const SNIPPET_DIR = 'docs/guide/snippets';
const SNIPPET_MARKER = /^\s*<!--\s*snippet:\s*([^\s#]+)#([^\s]+?)\s*-->\s*$/;
const CODE_LANGS = new Set(['ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isAllowlisted(rel) {
  return NAME_ALLOWLIST.some((entry) => (entry.endsWith('/') ? rel.startsWith(entry) : rel === entry));
}

function isTextFile(rel) {
  return TEXT_EXTENSIONS.has(path.extname(rel).toLowerCase()) || TEXT_BASENAMES.has(path.basename(rel));
}

/** Markdown files whose links, images and snippets are checked. */
function isDocMarkdown(rel) {
  if (!rel.endsWith('.md')) return false;
  if (rel === 'README.md' || rel === 'CONTRIBUTING.md') return true;
  return rel.startsWith('docs/') && !rel.startsWith('docs/superpowers/');
}

function readLines(root, rel) {
  return readFileSync(path.join(root, rel), 'utf8').split(/\r?\n/);
}

/** Default file list: tracked plus untracked-but-not-ignored files, via git with an argument array. */
export function listRepoFiles(root) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\n').filter(Boolean);
}

function checkNames(root, files, errors) {
  for (const rel of files) {
    if (isAllowlisted(rel) || !isTextFile(rel)) continue;
    readLines(root, rel).forEach((line, i) => {
      if (STALE_NAME.test(line)) errors.push(`[names] ${rel}:${i + 1}: former product or repository name`);
    });
  }
}

function checkHistorical(root, files, errors) {
  const present = new Set(files);
  for (const rel of HISTORICAL_FILES) {
    if (!present.has(rel)) continue;
    const head = readLines(root, rel).slice(0, 3).join('\n');
    if (!head.includes(HISTORICAL_NOTE)) {
      errors.push(`[historical] ${rel}: missing "${HISTORICAL_NOTE}" note within the first three lines`);
    }
  }
}

/** Blank out fenced code blocks and inline code spans, keeping line numbers stable. */
function stripCode(lines) {
  let fence = null;
  return lines.map((line) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      return '';
    }
    if (m) {
      fence = m[1];
      return '';
    }
    return line.replace(/`[^`\n]*`/g, (s) => ' '.repeat(s.length));
  });
}

/** Extract link-like targets from prose lines. Returns { target, line, image }. */
function extractTargets(lines) {
  const prose = stripCode(lines);
  const found = [];
  prose.forEach((line, i) => {
    const lineNo = i + 1;
    for (const m of line.matchAll(/\]\(\s*<?([^)\s>]+)/g)) {
      found.push({ target: m[1], line: lineNo, image: false });
    }
    for (const m of line.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)/g)) {
      found.push({ target: m[1], line: lineNo, image: true });
    }
    const def = /^\s*\[[^\]]+\]:\s*<?(\S+?)>?\s*$/.exec(line);
    if (def) found.push({ target: def[1], line: lineNo, image: false });
    for (const m of line.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      found.push({ target: m[1], line: lineNo, image: true });
    }
    for (const m of line.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"']+)["']/gi)) {
      found.push({ target: m[1], line: lineNo, image: false });
    }
  });
  return found;
}

function isRemote(target) {
  return /^(https?:)?\/\//i.test(target);
}

function isExternalScheme(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#');
}

function checkLinksAndImages(root, files, errors, run) {
  const resolvedRoot = path.resolve(root);
  for (const rel of files) {
    if (!isDocMarkdown(rel)) continue;
    const dir = path.dirname(path.join(resolvedRoot, rel));
    for (const { target, line, image } of extractTargets(readLines(root, rel))) {
      const where = `${rel}:${line}`;
      if (image && isRemote(target)) {
        if (run.images) errors.push(`[images] ${where}: remote image "${target}"`);
        continue;
      }
      if (!run.links) continue;
      if (isRemote(target) || isExternalScheme(target)) continue;
      if (target.startsWith('/')) {
        errors.push(`[links] ${where}: root-relative link "${target}"`);
        continue;
      }
      let bare = target.split('#')[0].split('?')[0];
      if (bare === '') continue;
      try {
        bare = decodeURIComponent(bare);
      } catch {
        errors.push(`[links] ${where}: undecodable link "${target}"`);
        continue;
      }
      const resolved = path.resolve(dir, bare);
      const relToRoot = path.relative(resolvedRoot, resolved);
      if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
        errors.push(`[links] ${where}: link "${target}" escapes the repository root`);
        continue;
      }
      if (!existsSync(resolved)) {
        errors.push(`[links] ${where}: missing target "${target}"`);
      }
    }
  }
}

function trimBlock(lines) {
  const out = lines.map((l) => l.replace(/\s+$/, ''));
  while (out.length > 0 && out[0] === '') out.shift();
  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  return out;
}

/** Text between `// #region name` and `// #endregion`, or null when absent. */
function readRegion(root, file, region) {
  for (const ext of ['.tsx', '.ts']) {
    const rel = `${SNIPPET_DIR}/${file}${ext}`;
    if (!existsSync(path.join(root, rel))) continue;
    const lines = readLines(root, rel);
    const start = lines.findIndex((l) => l.trim() === `// #region ${region}`);
    if (start === -1) return { rel, body: null };
    const end = lines.findIndex((l, i) => i > start && l.trim() === '// #endregion');
    if (end === -1) return { rel, body: null };
    return { rel, body: trimBlock(lines.slice(start + 1, end)) };
  }
  return null;
}

function checkSnippets(root, files, errors) {
  for (const rel of files) {
    if (!isDocMarkdown(rel)) continue;
    const lines = readLines(root, rel);
    const inGuide = rel.startsWith('docs/guide/') && !rel.startsWith(`${SNIPPET_DIR}/`);
    let pendingMarker = null; // { file, region, line }
    let fence = null;
    let fenceLang = '';
    let fenceStart = 0;
    let body = [];
    let marker = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;
      if (fence) {
        const close = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
        if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
          if (marker) {
            const found = readRegion(root, marker.file, marker.region);
            if (!found) {
              errors.push(`[snippets] ${rel}:${marker.line}: snippet file ${SNIPPET_DIR}/${marker.file}.tsx not found`);
            } else if (found.body === null) {
              errors.push(`[snippets] ${rel}:${marker.line}: region "${marker.region}" not found in ${found.rel}`);
            } else if (found.body.join('\n') !== trimBlock(body).join('\n')) {
              errors.push(`[snippets] ${rel}:${fenceStart}: code block differs from ${found.rel}#${marker.region}`);
            }
          } else if (inGuide && CODE_LANGS.has(fenceLang)) {
            errors.push(`[snippets] ${rel}:${fenceStart}: ${fenceLang} code block has no snippet marker`);
          }
          fence = null;
          marker = null;
          body = [];
        } else {
          body.push(line);
        }
        continue;
      }
      const open = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)/.exec(line);
      if (open) {
        fence = open[1];
        fenceLang = open[2].toLowerCase();
        fenceStart = lineNo;
        marker = pendingMarker;
        pendingMarker = null;
        body = [];
        continue;
      }
      const m = SNIPPET_MARKER.exec(line);
      if (m) {
        if (pendingMarker) {
          errors.push(`[snippets] ${rel}:${pendingMarker.line}: snippet marker is not followed by a code block`);
        }
        pendingMarker = { file: m[1], region: m[2], line: lineNo };
        continue;
      }
      if (line.trim() !== '' && pendingMarker) {
        errors.push(`[snippets] ${rel}:${pendingMarker.line}: snippet marker is not followed by a code block`);
        pendingMarker = null;
      }
    }
    if (pendingMarker) {
      errors.push(`[snippets] ${rel}:${pendingMarker.line}: snippet marker is not followed by a code block`);
    }
    if (fence) errors.push(`[snippets] ${rel}:${fenceStart}: unterminated code fence`);
  }
}

/**
 * Run the selected checks.
 * @param {{ root?: string, files?: string[], only?: string[] }} [options]
 * @returns {string[]} error messages (empty when everything passes)
 */
export function checkDocs({ root = REPO_ROOT, files, only } = {}) {
  const selected = new Set(only && only.length > 0 ? only : CHECKS);
  for (const name of selected) {
    if (!CHECKS.includes(name)) throw new Error(`unknown check "${name}" (known: ${CHECKS.join(', ')})`);
  }
  const list = (files ?? listRepoFiles(root))
    .map(toPosix)
    .filter((rel) => existsSync(path.join(root, rel)));
  const errors = [];
  if (selected.has('names')) checkNames(root, list, errors);
  if (selected.has('historical')) checkHistorical(root, list, errors);
  if (selected.has('links') || selected.has('images')) {
    checkLinksAndImages(root, list, errors, { links: selected.has('links'), images: selected.has('images') });
  }
  if (selected.has('snippets')) checkSnippets(root, list, errors);
  return errors;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--only') opts.only = (argv[++i] ?? '').split(',').filter(Boolean);
    else if (arg === '--root') opts.root = path.resolve(argv[++i] ?? '.');
    else throw new Error(`unknown argument "${arg}"`);
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`docs:check: ${err.message}`);
    process.exit(2);
  }
  const root = opts.root ?? REPO_ROOT;
  process.chdir(root);
  let errors;
  try {
    errors = checkDocs({ root, ...(opts.only ? { only: opts.only } : {}) });
  } catch (err) {
    console.error(`docs:check: ${err.message}`);
    process.exit(2);
  }
  if (errors.length === 0) {
    console.log('docs:check OK');
    return;
  }
  for (const e of errors) console.error(e);
  console.error(`docs:check FAILED: ${errors.length} problem(s)`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
