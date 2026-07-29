const path = require('path');

const appiumConfig = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    android: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Pixel_6_API_33',
      'appium:appPackage': 'com.medex.healthapp',
      'appium:appActivity': 'com.medex.healthapp.MainActivity',
      'appium:noReset': true,
      'appium:newCommandTimeout': 300
    },
    ios: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 14 Pro',
      'appium:platformVersion': '16.4',
      'appium:bundleId': 'com.medex.healthapp',
      'appium:noReset': true,
      'appium:newCommandTimeout': 300
    },
    mobileWeb: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:browserName': 'Chrome',
      'appium:deviceName': 'Android Emulator'
    }
  }
};

module.exports = appiumConfig;
