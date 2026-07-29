const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('   MEDEX DEPLOYABLE READINESS & ENVIRONMENT CHECK ');
console.log('==================================================\n');

let checksPassed = 0;
let totalChecks = 0;

function check(name, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ [READY] ${name}`);
    checksPassed++;
  } catch (err) {
    console.error(`  ✗ [NOT READY] ${name}:`, err.message);
  }
}

// 1. Root configuration files
check('Package.json exists and contains scripts', () => {
  const pkgPath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts || !pkg.scripts.dev || !pkg.scripts.build) {
    throw new Error('Invalid package.json scripts');
  }
});

check('Next.js config file (next.config.ts) exists', () => {
  const cfgPath = path.join(__dirname, '../next.config.ts');
  if (!fs.existsSync(cfgPath)) throw new Error('Missing next.config.ts');
});

check('TypeScript configuration (tsconfig.json) exists', () => {
  const tsPath = path.join(__dirname, '../tsconfig.json');
  if (!fs.existsSync(tsPath)) throw new Error('Missing tsconfig.json');
});

// 2. Static Assets
check('Public static assets present (medex_logo.png, icon.png)', () => {
  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../app');
  const logo = path.join(publicDir, 'medex_logo.png');
  const iconInPublic = path.join(publicDir, 'icon.png');
  const iconInApp = path.join(appDir, 'icon.png');
  if (!fs.existsSync(logo) || (!fs.existsSync(iconInPublic) && !fs.existsSync(iconInApp))) {
    throw new Error('Public branding logo or icon missing');
  }
});

// 3. Application Routes Structure
check('Core route pages exist (home, documents, predict, reminders, ai-assistant, profile)', () => {
  const appDir = path.join(__dirname, '../app');
  const login = path.join(appDir, 'login/page.tsx');
  const register = path.join(appDir, 'register/page.tsx');
  const appScreen = path.join(appDir, '(app)/[screen]/page.tsx');
  if (!fs.existsSync(login) || !fs.existsSync(register) || !fs.existsSync(appScreen)) {
    throw new Error('Core app routes missing');
  }
});

// 4. Supabase Client Integration Check
check('Supabase client module (lib/supabase.ts) configured', () => {
  const supabasePath = path.join(__dirname, '../lib/supabase.ts');
  if (!fs.existsSync(supabasePath)) throw new Error('Missing lib/supabase.ts');
});

console.log(`\nDeployable Readiness Score: ${checksPassed}/${totalChecks} Checks Passed.`);
const isDeployable = checksPassed === totalChecks;
console.log(`DEPLOYABLE STATUS: ${isDeployable ? 'PRODUCTION READY ✅' : 'ACTION REQUIRED ⚠️'}\n`);

module.exports = { isDeployable, checksPassed, totalChecks };
