#!/usr/bin/env node
/**
 * Garde-fou de taille des fichiers source (audit v2.3.0 — Lot 0).
 *
 * Règles :
 *  - < 300 lignes  : OK
 *  - 300 à 600     : avertissement (compté, non bloquant)
 *  - > 600         : bloquant, SAUF fichiers listés dans `.size-baseline.json`
 *                    (dette existante, "cliquet" : un fichier du baseline ne doit pas grossir).
 *
 * Usage :
 *   node scripts/check-file-size.js                  # vérifie
 *   node scripts/check-file-size.js --update-baseline # réécrit le baseline (à lancer après un split)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(ROOT, '.size-baseline.json');
const SOURCE_DIRS = [
  'apps/backend-v2/src',
  'apps/evoe-frontend/src',
  'apps/admin-sosplanete-v2/src',
];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.next', 'build', 'coverage']);
const WARN_LIMIT = 300;
const MAX_LIMIT = 600;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function countLines(file) {
  const content = fs.readFileSync(file, 'utf8');
  return content.length === 0 ? 0 : content.split(/\r?\n/).length;
}

const files = SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d))).map((f) => ({
  rel: path.relative(ROOT, f).split(path.sep).join('/'),
  lines: countLines(f),
}));

const oversized = files.filter((f) => f.lines > MAX_LIMIT);
const warnings = files.filter((f) => f.lines > WARN_LIMIT && f.lines <= MAX_LIMIT);

if (process.argv.includes('--update-baseline')) {
  const baseline = Object.fromEntries(
    oversized.sort((a, b) => b.lines - a.lines).map((f) => [f.rel, f.lines]),
  );
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Baseline mis à jour : ${oversized.length} fichier(s) > ${MAX_LIMIT} lignes.`);
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  : {};

const violations = [];
for (const f of oversized) {
  const allowed = baseline[f.rel];
  if (allowed === undefined) {
    violations.push(`NOUVEAU > ${MAX_LIMIT} : ${f.rel} (${f.lines} lignes)`);
  } else if (f.lines > allowed) {
    violations.push(`A GROSSI : ${f.rel} (${allowed} -> ${f.lines} lignes)`);
  }
}

const resolved = Object.keys(baseline).filter(
  (rel) => !oversized.some((f) => f.rel === rel),
);

console.log(`Fichiers analysés : ${files.length}`);
console.log(`> ${MAX_LIMIT} lignes : ${oversized.length} (dette tolérée : ${Object.keys(baseline).length})`);
console.log(`${WARN_LIMIT}-${MAX_LIMIT} lignes : ${warnings.length}`);
if (resolved.length > 0) {
  console.log(
    `Dette résorbée (retirer du baseline via --update-baseline) : ${resolved.join(', ')}`,
  );
}

if (violations.length > 0) {
  console.error('\nViolations :');
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}
console.log('OK : aucun nouveau dépassement.');
