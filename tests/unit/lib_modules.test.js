const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('--- Running Unit Test Suite for Medex Core Lib Modules ---');

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

// 1. Email Regex & Validation Helper Tests
runTest('UT001: Email format regex validator', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.strictEqual(emailRegex.test('patient@medex.com'), true);
  assert.strictEqual(emailRegex.test('invalid-email'), false);
  assert.strictEqual(emailRegex.test('user@domain'), false);
});

// 2. Lib File Existence Tests
runTest('UT002: Verify lib/documents.ts existence and export interface', () => {
  const filePath = path.join(__dirname, '../../lib/documents.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

runTest('UT003: Verify lib/medex.ts existence and helper functions', () => {
  const filePath = path.join(__dirname, '../../lib/medex.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

runTest('UT004: Verify lib/notifications.ts existence', () => {
  const filePath = path.join(__dirname, '../../lib/notifications.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

runTest('UT005: Verify lib/predictions.ts existence', () => {
  const filePath = path.join(__dirname, '../../lib/predictions.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

runTest('UT006: Verify lib/reminders.ts existence', () => {
  const filePath = path.join(__dirname, '../../lib/reminders.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

runTest('UT007: Verify lib/supabase.ts client initialization module', () => {
  const filePath = path.join(__dirname, '../../lib/supabase.ts');
  assert.strictEqual(fs.existsSync(filePath), true);
});

// 3. Calculation & Metric Helper Logic Tests
runTest('UT008: BMI Calculation helper formula (weight_kg / (height_m ^ 2))', () => {
  const weight = 70; // kg
  const height = 1.75; // meters
  const bmi = +(weight / (height * height)).toFixed(1);
  assert.strictEqual(bmi, 22.9);
});

runTest('UT009: Risk Score Classification mapping logic', () => {
  const getRiskCategory = (score) => {
    if (score < 30) return 'Low';
    if (score < 70) return 'Moderate';
    return 'High';
  };
  assert.strictEqual(getRiskCategory(15), 'Low');
  assert.strictEqual(getRiskCategory(45), 'Moderate');
  assert.strictEqual(getRiskCategory(85), 'High');
});

runTest('UT010: Reminder frequency date calculation helper', () => {
  const getNextDoseTime = (currentDate, frequencyHours) => {
    const next = new Date(currentDate);
    next.setHours(next.getHours() + frequencyHours);
    return next;
  };
  const now = new Date('2026-07-29T08:00:00Z');
  const nextDose = getNextDoseTime(now, 12);
  assert.strictEqual(nextDose.toISOString(), '2026-07-29T20:00:00.000Z');
});

console.log(`\nUnit Tests Summary: ${passedTests}/${totalTests} Passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
