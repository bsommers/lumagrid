// The package is "type": "module", but dist/cjs holds CommonJS emitted as .js. A nested package.json
// marks that subtree as CommonJS so require('lumagrid') loads it correctly. Run after tsc -p tsconfig.cjs.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cjs');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'package.json'), '{\n  "type": "commonjs"\n}\n');
