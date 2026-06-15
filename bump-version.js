#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Cartographie de toutes les applications du monorepo
const ALL_PACKAGES = {
  root: { name: 'Root Monorepo', path: path.join(__dirname, 'package.json') },
  v1: { name: 'SOS Planète v1', path: path.join(__dirname, 'apps/sosplanete-v1/package.json') },
  backend: { name: 'Backend v2', path: path.join(__dirname, 'apps/backend-v2/package.json') },
  admin: { name: 'Admin SOS Planète v2', path: path.join(__dirname, 'apps/admin-sosplanete-v2/package.json') },
  evoe: { name: 'Evoe Frontend', path: path.join(__dirname, 'apps/evoe-frontend/package.json') }
};

// Analyse des arguments en ligne de commande
const args = process.argv.slice(2);
let bumpType = 'patch';
let forceVersion = null;
let targetAppKeys = Object.keys(ALL_PACKAGES);
const hasAppsFlag = args.some(arg => arg.startsWith('--apps='));

args.forEach(arg => {
  if (arg.startsWith('--apps=')) {
    const appsStr = arg.split('=')[1];
    targetAppKeys = appsStr.split(',').map(a => a.trim().toLowerCase());
  } else if (arg === 'major' || arg === 'minor' || arg === 'patch') {
    bumpType = arg;
  } else if (/^\d+\.\d+\.\d+/.test(arg)) {
    forceVersion = arg;
  }
});

// Helper de calcul de version
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

// 1. Comportement Synchronisé (Comportement historique si aucun flag --apps= n'est passé)
if (!hasAppsFlag) {
  let rootVersion = '2.0.0';
  try {
    if (fs.existsSync(ALL_PACKAGES.root.path)) {
      const rootPkg = JSON.parse(fs.readFileSync(ALL_PACKAGES.root.path, 'utf8'));
      rootVersion = rootPkg.version || '2.0.0';
    }
  } catch (e) {
    console.error('Erreur lors de la lecture de la version racine :', e.message);
  }

  let finalVersion = '';
  if (forceVersion) {
    finalVersion = forceVersion;
  } else {
    try {
      finalVersion = getNewVersion(rootVersion, bumpType);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }

  console.log(`🚀 Versioning synchronisé : Passage de la version globale à ${finalVersion}`);

  Object.values(ALL_PACKAGES).forEach(pkgConfig => {
    if (fs.existsSync(pkgConfig.path)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgConfig.path, 'utf8'));
        const oldVersion = pkg.version || 'unknown';
        pkg.version = finalVersion;
        fs.writeFileSync(pkgConfig.path, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
        console.log(`✅ ${pkgConfig.name} : ${oldVersion} ➡️ ${finalVersion}`);
      } catch (e) {
        console.error(`❌ Erreur sur ${pkgConfig.name} (${pkgConfig.path}) :`, e.message);
      }
    }
  });

// 2. Comportement Ciblé (Si --apps= est utilisé)
} else {
  console.log(`🚀 Versioning ciblé (${bumpType}) pour les applications : ${targetAppKeys.join(', ')}`);

  targetAppKeys.forEach(key => {
    const pkgConfig = ALL_PACKAGES[key];
    if (!pkgConfig) {
      console.error(`❌ Application inconnue: "${key}". Applications disponibles : ${Object.keys(ALL_PACKAGES).join(', ')}`);
      return;
    }

    if (fs.existsSync(pkgConfig.path)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgConfig.path, 'utf8'));
        const oldVersion = pkg.version || '2.0.0';

        let appNewVersion = '';
        if (forceVersion) {
          appNewVersion = forceVersion;
        } else {
          appNewVersion = getNewVersion(oldVersion, bumpType);
        }

        pkg.version = appNewVersion;
        fs.writeFileSync(pkgConfig.path, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
        console.log(`✅ ${pkgConfig.name} : ${oldVersion} ➡️ ${appNewVersion}`);
      } catch (e) {
        console.error(`❌ Erreur sur ${pkgConfig.name} (${pkgConfig.path}) :`, e.message);
      }
    } else {
      console.warn(`⚠️ Fichier introuvable pour ${pkgConfig.name} à l'emplacement ${pkgConfig.path}`);
    }
  });
}

console.log('✨ Opération terminée !');
