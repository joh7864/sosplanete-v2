const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Charger les variables depuis apps/backend-v2/.env.test
const envPath = path.join(__dirname, '..', 'apps', 'backend-v2', '.env.test');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-test-env.js <command> [args...]");
  process.exit(1);
}

const cmd = args[0];
const cmdArgs = args.slice(1);

const result = spawnSync(cmd, cmdArgs, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, '..', 'apps', 'backend-v2'),
});

process.exit(result.status ?? 0);
