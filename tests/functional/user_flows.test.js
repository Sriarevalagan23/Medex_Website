const assert = require('assert');

console.log('--- Running Functional Test Suite for Medex User Flows ---');

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

// Simulated App State Store
class MockMedexStore {
  constructor() {
    this.user = null;
    this.documents = [];
    this.reminders = [];
    this.predictions = [];
    this.notifications = [];
  }

  login(email, password) {
    if (!email || !password) throw new Error('Missing credentials');
    this.user = { id: 'usr_123', email, name: 'Test User' };
    return this.user;
  }

  logout() {
    this.user = null;
  }

  addDocument(doc) {
    if (!doc.title || !doc.fileUrl) throw new Error('Invalid document metadata');
    const newDoc = { id: `doc_${Date.now()}`, ...doc, createdAt: new Date().toISOString() };
    this.documents.push(newDoc);
    return newDoc;
  }

  addReminder(reminder) {
    if (!reminder.medicationName) throw new Error('Medication name required');
    const item = { id: `rem_${Date.now()}`, active: true, ...reminder };
    this.reminders.push(item);
    return item;
  }

  runPrediction(metrics) {
    let score = 20;
    if (metrics.bloodPressure > 140) score += 30;
    if (metrics.bmi > 30) score += 25;
    if (metrics.smoking) score += 20;
    const result = {
      id: `pred_${Date.now()}`,
      riskScore: score,
      riskLevel: score > 60 ? 'High' : score > 35 ? 'Moderate' : 'Low',
      timestamp: new Date().toISOString()
    };
    this.predictions.push(result);
    return result;
  }
}

// 1. Auth Flow Functional Test
runTest('FT001: Auth state change login and logout lifecycle', () => {
  const store = new MockMedexStore();
  assert.strictEqual(store.user, null);
  store.login('patient@medex.com', 'SecurePass123!');
  assert.strictEqual(store.user.email, 'patient@medex.com');
  store.logout();
  assert.strictEqual(store.user, null);
});

// 2. Document Creation & List Functional Test
runTest('FT002: Add document and list update', () => {
  const store = new MockMedexStore();
  const doc = store.addDocument({ title: 'Blood Test Report', fileUrl: 'https://medex/blood.pdf', category: 'Lab' });
  assert.strictEqual(store.documents.length, 1);
  assert.strictEqual(store.documents[0].title, 'Blood Test Report');
});

// 3. Medication Reminder Creation & Toggle Functional Test
runTest('FT003: Create medication reminder schedule', () => {
  const store = new MockMedexStore();
  const rem = store.addReminder({ medicationName: 'Amoxicillin', dosage: '500mg', time: '08:00 AM' });
  assert.strictEqual(store.reminders.length, 1);
  assert.strictEqual(store.reminders[0].active, true);
});

// 4. Health Prediction Evaluation Functional Test
runTest('FT004: Calculate prediction risk score from metrics', () => {
  const store = new MockMedexStore();
  const highRisk = store.runPrediction({ bloodPressure: 150, bmi: 32, smoking: true });
  assert.strictEqual(highRisk.riskLevel, 'High');
  assert.strictEqual(highRisk.riskScore, 95);

  const lowRisk = store.runPrediction({ bloodPressure: 115, bmi: 22, smoking: false });
  assert.strictEqual(lowRisk.riskLevel, 'Low');
  assert.strictEqual(lowRisk.riskScore, 20);
});

console.log(`\nFunctional Tests Summary: ${passedTests}/${totalTests} Passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
