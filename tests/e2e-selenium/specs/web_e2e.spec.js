const assert = require('assert');
const config = require('../config/selenium.config');
const MedexPOM = require('../pages/MedexPOM');

console.log('--- Running Selenium Web E2E Test Suite ---');
console.log(`Target Base URL: ${config.baseUrl}`);
console.log(`Browser Engine: ${config.browser} (Headless: ${config.headless})`);

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
  }
}

const pom = new MedexPOM(config.baseUrl);

// Selenium E2E Test Specs
runTest('SEL001: Selenium WebDriver Page Object Model URL generation', () => {
  assert.strictEqual(pom.getRouteUrl('/home'), `${config.baseUrl}/home`);
  assert.strictEqual(pom.getRouteUrl('predict'), `${config.baseUrl}/predict`);
});

runTest('SEL002: Selenium Auth Page DOM Selectors validation', () => {
  assert.strictEqual(!!pom.selectors.emailInput, true);
  assert.strictEqual(!!pom.selectors.passwordInput, true);
});

runTest('SEL003: Selenium Navigation Links map validation', () => {
  assert.strictEqual(pom.selectors.navDocuments, 'a[href="/documents"]');
  assert.strictEqual(pom.selectors.navReminders, 'a[href="/reminders"]');
  assert.strictEqual(pom.selectors.navAIAssistant, 'a[href="/ai-assistant"]');
});

runTest('SEL004: Selenium Viewports desktop configuration validation', () => {
  assert.strictEqual(config.viewports.desktop.width, 1920);
  assert.strictEqual(config.viewports.desktop.height, 1080);
});

runTest('SEL005: Selenium Viewports mobile configuration validation', () => {
  assert.strictEqual(config.viewports.mobile.width, 375);
  assert.strictEqual(config.viewports.mobile.height, 812);
});

console.log(`\nSelenium Web E2E Tests Summary: ${passedTests}/${totalTests} Passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
