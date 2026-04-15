const fs = require('fs');
const path = 'c:\\Users\\User\\Documents\\Sync Pcloud\\Professionnel\\Dev\\sosplanete-v2\\apps\\frontend-v2\\src\\app\\dashboard\\organization\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/w-14 text-right/g, 'w-12 text-right');
content = content.replace(/w-16 text-right/g, 'w-14 text-right');
content = content.replace(/gap-5 shrink-0/g, 'gap-3 shrink-0');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
