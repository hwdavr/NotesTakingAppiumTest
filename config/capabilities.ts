import type { Environment } from './environment.js';

export function androidCapabilities(env: Environment, udid: string) {
  return {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:udid': udid,
    'appium:deviceName': udid,
    'appium:appPackage': env.appPackage,
    'appium:appActivity': env.appActivity,
    ...(env.appPath ? { 'appium:app': env.appPath } : {}),
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:autoGrantPermissions': false,
    'appium:forceAppLaunch': true,
    'appium:shouldTerminateApp': true,
    'appium:newCommandTimeout': 120,
    'appium:settings[disableIdLocatorAutocompletion]': true,
  };
}
