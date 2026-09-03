const fs = require('fs');
const path = require('path');

function getMissionsDir() {
  const candidates = [
    process.env.UPLOADS_DIR ? path.join(process.env.UPLOADS_DIR, 'missions') : null,
    path.resolve(process.cwd(), 'uploads', 'missions'),
    path.resolve(process.cwd(), '..', 'uploads', 'missions'),
    path.resolve(process.cwd(), '..', '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', '..', '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', '..', '..', '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', 'uploads', 'missions'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'uploads', 'missions'),
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.readdirSync(c).length > 10) {
      return c;
    }
  }
  return null;
}

const dir = getMissionsDir();
console.log('Found missions dir:', dir);
if (dir) {
  const files = fs.readdirSync(dir);
  console.log(`Total files: ${files.length}`);
  console.log('Sample files:', files.slice(0, 5));
}
