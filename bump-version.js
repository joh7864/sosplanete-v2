#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cartographie de toutes les applications du monorepo
const ALL_PACKAGES = {
  evoe: { name: 'Evoe Frontend', dir: 'apps/evoe-frontend', path: path.join(__dirname, 'apps/evoe-frontend/package.json') },
  backend: { name: 'Backend v2', dir: 'apps/backend-v2', path: path.join(__dirname, 'apps/backend-v2/package.json') },
  admin: { name: 'Admin SOS Planète v2', dir: 'apps/admin-sosplanete-v2', path: path.join(__dirname, 'apps/admin-sosplanete-v2/package.json') },
  v1: { name: 'SOS Planète v1', dir: 'apps/sosplanete-v1', path: path.join(__dirname, 'apps/sosplanete-v1/package.json') },
  root: { name: 'Root Monorepo', dir: '.', path: path.join(__dirname, 'package.json') }
};

// Détection intelligente des applications modifiées via git status / diff
function detectChangedApps() {
  try {
    let output = '';
    try {
      output += execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf8' }) || '';
    } catch {}
    try {
      output += '\n' + (execSync('git diff --name-only HEAD', { cwd: __dirname, encoding: 'utf8' }) || '');
    } catch {}

    const lines = output.split('\n').map(l => l.trim().replace(/^[MADRCU?!]{1,2}\s+/, '')).filter(Boolean);
    const changed = new Set();

    lines.forEach(file => {
      const normalized = file.replace(/\\/g, '/');
      if (normalized.startsWith('apps/evoe-frontend/')) changed.add('evoe');
      else if (normalized.startsWith('apps/backend-v2/')) changed.add('backend');
      else if (normalized.startsWith('apps/admin-sosplanete-v2/')) changed.add('admin');
      else if (normalized.startsWith('apps/sosplanete-v1/')) changed.add('v1');
    });

    return Array.from(changed);
  } catch {
    return [];
  }
}

// Analyse des arguments
const args = process.argv.slice(2);
let bumpType = 'patch';
let forceVersion = null;
let explicitApps = null;
let forceAll = false;

args.forEach(arg => {
  if (arg.startsWith('--apps=')) {
    explicitApps = arg.split('=')[1].split(',').map(a => a.trim().toLowerCase());
  } else if (arg === '--all' || arg === '--sync') {
    forceAll = true;
  } else if (['major', 'minor', 'patch'].includes(arg)) {
    bumpType = arg;
  } else if (/^\d+\.\d+\.\d+/.test(arg)) {
    forceVersion = arg;
  } else if (Object.keys(ALL_PACKAGES).includes(arg.toLowerCase())) {
    // Permet la syntaxe directe: node bump-version.js evoe
    explicitApps = explicitApps ? [...explicitApps, arg.toLowerCase()] : [arg.toLowerCase()];
  }
});

// Helper de calcul de version SemVer
function getNewVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3) {
    throw new Error(`Format de version actuel invalide: ${currentVersion}`);
  }
  if (type === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return parts.join('.');
}

// Détermination des cibles
let targetAppKeys = [];
let modeDescription = '';

if (forceAll) {
  targetAppKeys = Object.keys(ALL_PACKAGES);
  modeDescription = '🌐 Versioning monorepo synchronisé (--all)';
} else if (explicitApps && explicitApps.length > 0) {
  targetAppKeys = explicitApps;
  modeDescription = `🎯 Versioning ciblé explicite pour : ${targetAppKeys.join(', ')}`;
} else {
  // Détection automatique via Git
  const detected = detectChangedApps();
  if (detected.length > 0) {
    targetAppKeys = detected;
    modeDescription = `🔍 Détection Git automatique : ${detected.map(k => ALL_PACKAGES[k]?.name || k).join(', ')}`;
  } else {
    // Si aucun fichier modifié détecté, on prévient et on cible tout le monorepo
    targetAppKeys = Object.keys(ALL_PACKAGES);
    modeDescription = `ℹ️ Aucune modification Git spécifique détectée. Versioning monorepo global (ou utilisez "node bump-version.js evoe")`;
  }
}

console.log(`\n======================================================`);
console.log(`${modeDescription}`);
console.log(`Type d'incrément : ${bumpType.toUpperCase()}`);
console.log(`======================================================\n`);

targetAppKeys.forEach(key => {
  const pkgConfig = ALL_PACKAGES[key];
  if (!pkgConfig) {
    console.error(`❌ Application inconnue: "${key}". Disponibles: ${Object.keys(ALL_PACKAGES).join(', ')}`);
    return;
  }

  if (fs.existsSync(pkgConfig.path)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgConfig.path, 'utf8'));
      const oldVersion = pkg.version || '2.0.0';
      const newVersion = forceVersion || getNewVersion(oldVersion, bumpType);

      pkg.version = newVersion;
      fs.writeFileSync(pkgConfig.path, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`✅ ${pkgConfig.name.padEnd(24)} : ${oldVersion} ➡️  ${newVersion}`);
    } catch (e) {
      console.error(`❌ Erreur sur ${pkgConfig.name} (${pkgConfig.path}) :`, e.message);
    }
  } else {
    console.warn(`⚠️ Fichier introuvable pour ${pkgConfig.name} (${pkgConfig.path})`);
  }
});

console.log('\n✨ Opération de versioning terminée avec succès !\n');
