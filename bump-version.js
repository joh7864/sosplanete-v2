#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2] || 'patch';
const forceVersion = process.argv[3];

const packagePaths = [
  path.join(__dirname, 'package.json'),
  path.join(__dirname, 'apps/sosplanete-v1/package.json'),
  path.join(__dirname, 'apps/backend-v2/package.json'),
  path.join(__dirname, 'apps/admin-sosplanete-v2/package.json')
];

let currentVersion = '2.0.0';
try {
  if (fs.existsSync(packagePaths[0])) {
    const rootPkg = JSON.parse(fs.readFileSync(packagePaths[0], 'utf8'));
    currentVersion = rootPkg.version || '2.0.0';
  }
} catch (e) {
  console.error('Erreur lors de la lecture du package.json racine :', e.message);
}

let newVersion = '';

if (forceVersion) {
  newVersion = forceVersion;
} else {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3) {
    console.error('Format de version actuel invalide:', currentVersion);
    process.exit(1);
  }

  if (bumpType === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  newVersion = parts.join('.');
}

console.log(`🚀 Passage de la version ${currentVersion} à ${newVersion}`);

packagePaths.forEach(pkgPath => {
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`✅ Mise à jour de ${pkgPath}`);
    } catch (e) {
      console.error(`❌ Erreur sur ${pkgPath} :`, e.message);
    }
  }
});

console.log('✨ Opération terminée avec succès !');
