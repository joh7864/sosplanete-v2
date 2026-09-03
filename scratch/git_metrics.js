const { execSync } = require('child_process');

try {
  const log = execSync('git log --pretty=format:"%h|%an|%ad|%s" --date=short', { encoding: 'utf-8' });
  const lines = log.trim().split('\n').filter(Boolean);

  let featCount = 0;
  let fixCount = 0;
  let refactorCount = 0;
  let choreCount = 0;
  let otherCount = 0;
  const authors = {};
  const dates = {};

  for (const line of lines) {
    const [hash, author, date, subject] = line.split('|');
    const subjLower = (subject || '').toLowerCase();

    if (subjLower.startsWith('feat') || subjLower.includes('ajout') || subjLower.includes('implement')) {
      featCount++;
    } else if (subjLower.startsWith('fix') || subjLower.includes('correct') || subjLower.includes('bug')) {
      fixCount++;
    } else if (subjLower.startsWith('refactor') || subjLower.includes('refonte')) {
      refactorCount++;
    } else if (subjLower.startsWith('chore') || subjLower.startsWith('bump') || subjLower.includes('version')) {
      choreCount++;
    } else {
      otherCount++;
    }

    authors[author] = (authors[author] || 0) + 1;
    dates[date] = (dates[date] || 0) + 1;
  }

  console.log('=== GIT METRICS ===');
  console.log(`Total Commits: ${lines.length}`);
  console.log(`Feat: ${featCount}`);
  console.log(`Fix: ${fixCount}`);
  console.log(`Refactor: ${refactorCount}`);
  console.log(`Chore/Bump: ${choreCount}`);
  console.log(`Other: ${otherCount}`);
  console.log(`Ratio Fix/Feat: ${(fixCount / (featCount || 1)).toFixed(2)}`);
  console.log('\nTop Authors:');
  console.log(JSON.stringify(authors, null, 2));
  console.log('\nRecent Commit Dates:');
  const sortedDates = Object.keys(dates).sort().reverse().slice(0, 10);
  for (const d of sortedDates) {
    console.log(`${d}: ${dates[d]} commits`);
  }
} catch (e) {
  console.error(e);
}
