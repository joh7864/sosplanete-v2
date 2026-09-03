const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2';

const ignoreDirs = ['node_modules', '.next', 'dist', 'build', 'coverage', 'OldFiles', '.git'];
const allowedExts = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        results = results.concat(walk(filePath));
      }
    } else {
      const ext = path.extname(file);
      if (allowedExts.includes(ext)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const appsDir = path.join(rootDir, 'apps');
const allFiles = walk(appsDir);

const under300 = [];
const between300And600 = [];
const over600 = [];

const byApp = {
  'backend-v2': { files: 0, lines: 0 },
  'evoe-frontend': { files: 0, lines: 0 },
  'admin-sosplanete-v2': { files: 0, lines: 0 },
  'sosplanete-v1': { files: 0, lines: 0 }
};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const item = { path: relPath, lines };

  if (lines < 300) {
    under300.push(item);
  } else if (lines <= 600) {
    between300And600.push(item);
  } else {
    over600.push(item);
  }

  for (const app of Object.keys(byApp)) {
    if (relPath.startsWith('apps/' + app)) {
      byApp[app].files++;
      byApp[app].lines += lines;
    }
  }
}

console.log('=== APP TOTALS ===');
console.log(JSON.stringify(byApp, null, 2));

console.log('=== SUMMARY FILE SIZES ===');
console.log(`<300 lines: ${under300.length}`);
console.log(`300-600 lines: ${between300And600.length}`);
console.log(`>600 lines: ${over600.length}`);
console.log(`Total files: ${allFiles.length}`);

console.log('\n=== FILES > 600 LINES ===');
over600.sort((a, b) => b.lines - a.lines).forEach(f => {
  console.log(`${f.lines.toString().padStart(5)} lines : ${f.path}`);
});

console.log('\n=== FILES 300-600 LINES ===');
between300And600.sort((a, b) => b.lines - a.lines).forEach(f => {
  console.log(`${f.lines.toString().padStart(5)} lines : ${f.path}`);
});
