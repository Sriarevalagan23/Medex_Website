/**
 * Page Object Model (POM) for Medex Web Application
 */
class MedexPOM {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Selectors
  selectors = {
    // Auth
    emailInput: 'input[placeholder*="Email"]',
    passwordInput: 'input[placeholder*="Password"]',
    loginSubmitBtn: 'button:contains("Sign in"), button:has-text("Sign in")',
    registerLink: 'button:contains("Register"), a[href="/register"]',
    forgotPasswordLink: 'button:contains("Forgot password?")',

    // Web Shell Header & Sidebar
    navHome: 'a[href="/home"]',
    navDocuments: 'a[href="/documents"]',
    navPredict: 'a[href="/predict"]',
    navReminders: 'a[href="/reminders"]',
    navAIAssistant: 'a[href="/ai-assistant"]',
    navNotifications: 'a[href="/notifications"]',
    navProfile: 'a[href="/profile"]',

    // Documents Screen
    uploadDocBtn: 'button:contains("Upload"), input[type="file"]',
    documentList: '.document-card, [data-testid="document-item"]',

    // Predictor Screen
    predictSubmitBtn: 'button:contains("Calculate"), button:contains("Predict")',
    riskScoreBadge: '.risk-score, [data-testid="risk-score"]',

    // Reminders Screen
    addReminderBtn: 'button:contains("Add Reminder"), button:contains("Create")',
    reminderCard: '.reminder-item, [data-testid="reminder-item"]',

    // AI Assistant Screen
    chatInput: 'textarea, input[placeholder*="Ask"]',
    chatSendBtn: 'button[aria-label="Send message"], button:contains("Send")',
    chatMessageList: '.chat-message, [data-testid="chat-message"]'
  };

  getRouteUrl(route) {
    return `${this.baseUrl}${route.startsWith('/') ? route : '/' + route}`;
  }
}

module.exports = MedexPOM;
