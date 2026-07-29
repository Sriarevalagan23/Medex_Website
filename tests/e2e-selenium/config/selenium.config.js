const path = require('path');

const config = {
  baseUrl: process.env.MEDEX_BASE_URL || 'http://localhost:3000',
  browser: process.env.SELENIUM_BROWSER || 'chrome',
  headless: process.env.HEADLESS !== 'false',
  timeout: 15000,
  screenshotsDir: path.join(__dirname, '../screenshots'),
  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
  }
};

module.exports = config;
