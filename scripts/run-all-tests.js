const { execSync } = require('child_process');
const path = require('path');

console.log('========================================================================');
console.log('   MEDEX MASTER TEST SUITE & EXCEL REPORT GENERATOR ORCHESTRATOR        ');
console.log('========================================================================\n');

const steps = [
  { name: '1. Build 300+ Test Cases Catalog JSON', cmd: 'node scripts/build-catalog.js' },
  { name: '2. Run Unit Test Suite (Lib Modules)', cmd: 'node tests/unit/lib_modules.test.js' },
  { name: '3. Run Functional Test Suite (User Flows)', cmd: 'node tests/functional/user_flows.test.js' },
  { name: '4. Run UI/UX & Accessibility Test Suite', cmd: 'node tests/ui-ux/design_accessibility.test.js' },
  { name: '5. Run Security & Input Validation Suite', cmd: 'node tests/security-validation/security_bounds.test.js' },
  { name: '6. Run Selenium Web E2E Test Suite', cmd: 'node tests/e2e-selenium/specs/web_e2e.spec.js' },
  { name: '7. Run Appium Mobile E2E Test Suite (Separate Folder)', cmd: 'node mobile-testing/runner.js' },
  { name: '8. Run Baseline Load Testing (100 Virtual Users / 1 Minute)', cmd: 'node scripts/run-load-test.js' },
  { name: '9. Verify Deployable Environment & Build Readiness', cmd: 'node scripts/verify-deployable.js' },
  { name: '10. Generate Excel Analysis Report (.xlsx)', cmd: 'node scripts/generate-excel-report.js' }
];

let failed = false;

for (const step of steps) {
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`▶ ${step.name}`);
  console.log(`------------------------------------------------------------------------`);
  try {
    const env = { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin` };
    execSync(step.cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..'), env });
  } catch (err) {
    console.error(`❌ Failed at step: ${step.name}`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error('\n❌ Master Test Execution Failed!');
  process.exit(1);
} else {
  console.log('\n========================================================================');
  console.log('🎉 ALL 325+ TEST CASES EXECUTED WITH 100% PASS RATE!');
  console.log('📊 EXCEL ANALYSIS REPORT CREATED: excel-analysis/medex_e2e_test_report.xlsx');
  console.log('🚀 DEPLOYABLE STATUS: PRODUCTION READY');
  console.log('========================================================================\n');
}
