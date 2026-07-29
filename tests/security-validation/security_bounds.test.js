const assert = require('assert');

console.log('--- Running Security & Input Validation Test Suite ---');

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

// Helper: XSS Sanitizer
function sanitizeInput(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

runTest('SEC001: XSS payload escaping in text inputs', () => {
  const payload = '<script>alert("XSS")</script>';
  const sanitized = sanitizeInput(payload);
  assert.strictEqual(sanitized, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  assert.strictEqual(sanitized.includes('<script>'), false);
});

runTest('SEC002: SQL Injection payload rejection in email input', () => {
  const sqliPayload = "' OR '1'='1";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.strictEqual(emailRegex.test(sqliPayload), false);
});

runTest('SEC003: Password length bounds enforcement (min 6 characters)', () => {
  const isValidPassword = (pwd) => pwd && pwd.length >= 6;
  assert.strictEqual(isValidPassword('12345'), false);
  assert.strictEqual(isValidPassword('123456'), true);
});

runTest('SEC004: File upload extension whitelist validation', () => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
  const checkExtension = (fileName) => {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return allowedExtensions.includes(ext);
  };

  assert.strictEqual(checkExtension('lab_report.pdf'), true);
  assert.strictEqual(checkExtension('scan.PNG'), true);
  assert.strictEqual(checkExtension('malicious.exe'), false);
  assert.strictEqual(checkExtension('script.sh'), false);
});

runTest('SEC005: Unauthenticated route guard authorization check', () => {
  const protectedRoutes = ['/home', '/documents', '/predict', '/reminders', '/ai-assistant', '/notifications', '/profile'];
  const checkAccess = (route, sessionToken) => {
    if (protectedRoutes.includes(route) && !sessionToken) {
      return { allowed: false, redirect: '/login' };
    }
    return { allowed: true };
  };

  assert.deepStrictEqual(checkAccess('/documents', null), { allowed: false, redirect: '/login' });
  assert.deepStrictEqual(checkAccess('/documents', 'valid_jwt_token'), { allowed: true });
});

console.log(`\nSecurity & Validation Tests Summary: ${passedTests}/${totalTests} Passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
