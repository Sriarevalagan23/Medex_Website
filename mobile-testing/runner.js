const path = require('path');

console.log('==================================================');
console.log('   MEDEX APPIUM MOBILE E2E TEST RUNNER           ');
console.log('==================================================\n');

try {
  require('./specs/mobile_appium.spec.js');
  console.log('✅ Appium Mobile E2E Suite Executed Successfully!\n');
} catch (err) {
  console.error('❌ Appium Mobile E2E Suite Failed:', err.message);
  process.exit(1);
}
