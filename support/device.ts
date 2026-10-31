import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  APPIUM_HOME,
  DRIVER_VERSION,
  PROJECT_ROOT,
  type Environment,
} from '../config/environment.js';

export interface Device {
  udid: string;
  state: string;
}
export function parseDevices(output: string): Device[] {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('List of devices') && !line.startsWith('*'))
    .map((line) => {
      const [udid, state] = line.trim().split(/\s+/);
      return { udid, state };
    });
}
export function selectDevice(devices: Device[], udid?: string): Device {
  if (udid) {
    const device = devices.find((item) => item.udid === udid && item.state === 'device');
    if (!device)
      throw new Error('ANDROID_UDID is absent, offline, or unauthorized in adb devices.');
    return device;
  }
  const online = devices.filter((device) => device.state === 'device');
  if (!online.length)
    throw new Error('No online Android device. Start an emulator or authorize USB debugging.');
  if (online.length !== 1) throw new Error('Multiple online devices. Set ANDROID_UDID explicitly.');
  return online[0];
}
export function validateRuntime(api: number, debug: boolean, locale: string, suite: string): void {
  if (!Number.isInteger(api) || api < 26)
    throw new Error('UiAutomator2 8 requires Android API 26 or newer.');
  if (!debug)
    throw new Error('A debuggable APK is required; release builds do not export Compose test IDs.');
  if (suite === 'authenticated' && !/^en(?:[-_,]|$)/i.test(locale)) {
    throw new Error(
      'Authenticated examples require an English device locale for accessible labels.',
    );
  }
}
export function validateInstrumentation(output: string): void {
  if (/ActiveInstrumentation\{/.test(output)) {
    throw new Error(
      'Android UI automation is owned by another instrumentation. Close agent-device or other automation sessions on the selected device before running Appium.',
    );
  }
}

function command(file: string, args: string[]): string {
  try {
    return execFileSync(file, args, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error(
      `Prerequisite command failed: ${file}. Check SDK/JDK tools, permissions, and device connection.`,
    );
  }
}
export function adb(udid: string, ...args: string[]): string {
  return command('adb', ['-s', udid, ...args]);
}
function versionAt(path: string): string {
  if (!existsSync(path))
    throw new Error('Missing local dependency/driver. Run npm ci and npm run setup:driver.');
  return (JSON.parse(readFileSync(path, 'utf8')) as { version: string }).version;
}
function inspectApk(path: string, sdk: string): { appPackage: string; debug: boolean } {
  const buildTools = resolve(sdk, 'build-tools');
  if (!existsSync(buildTools))
    throw new Error('Install Android SDK build-tools to validate APP_PATH.');
  const aapt = readdirSync(buildTools)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map((version) =>
      resolve(buildTools, version, process.platform === 'win32' ? 'aapt.exe' : 'aapt'),
    )
    .find(existsSync);
  if (!aapt) throw new Error('Android build-tools aapt is required to validate APP_PATH.');
  const badging = command(aapt, ['dump', 'badging', path]);
  const appPackage = /package: name='([^']+)'/.exec(badging)?.[1];
  if (!appPackage) throw new Error('APP_PATH has no valid Android package manifest.');
  return { appPackage, debug: badging.includes('application-debuggable') };
}
export interface Preflight {
  udid: string;
  api: number;
  locale: string;
  appPackage: string;
  versionName: string;
  apkSha256: string;
  node: string;
  appium: string;
  webdriverio: string;
  uiautomator2: string;
}
export function preflight(env: Environment): Preflight {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!(major >= 24 || (major === 22 && minor >= 19)))
    throw new Error('Use Node 22.19+ (22.x) or Node 24+.');
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!sdk || !existsSync(resolve(sdk, 'platform-tools')))
    throw new Error('Set ANDROID_HOME to an Android SDK containing platform-tools.');
  command('java', ['-version']);
  if (
    Number(command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']).split('.')[0]) <
    10
  ) {
    throw new Error('npm 10 or newer is required.');
  }
  const driverVersion = versionAt(
    resolve(APPIUM_HOME, 'node_modules/appium-uiautomator2-driver/package.json'),
  );
  if (driverVersion !== DRIVER_VERSION)
    throw new Error('Local UiAutomator2 version mismatch. Run npm run setup:driver.');
  const device = selectDevice(parseDevices(command('adb', ['devices', '-l'])), env.udid);
  validateInstrumentation(adb(device.udid, 'shell', 'dumpsys', 'activity', 'processes'));
  const api = Number(adb(device.udid, 'shell', 'getprop', 'ro.build.version.sdk'));
  const locales = adb(device.udid, 'shell', 'settings', 'get', 'system', 'system_locales');
  const locale =
    locales && locales !== 'null'
      ? locales
      : adb(device.udid, 'shell', 'getprop', 'persist.sys.locale') ||
        adb(device.udid, 'shell', 'getprop', 'ro.product.locale');
  const details = adb(device.udid, 'shell', 'dumpsys', 'package', env.appPackage);
  const installed = /versionName=/.test(details);
  let debug = /flags=\[[^\]]*\bDEBUGGABLE\b/.test(details);
  if (env.appPath) {
    const apk = inspectApk(env.appPath, sdk);
    if (apk.appPackage !== env.appPackage)
      throw new Error('APP_PATH package differs from APP_PACKAGE.');
    debug = apk.debug;
  } else if (!installed)
    throw new Error('Debug app is not installed. Set APP_PATH to its debug APK.');
  validateRuntime(api, debug, locale, env.suite);
  if (!env.isolatedNetwork) {
    const wifi = adb(device.udid, 'shell', 'settings', 'get', 'global', 'wifi_on');
    const data = adb(device.udid, 'shell', 'settings', 'get', 'global', 'mobile_data');
    if (wifi !== '0' || data !== '0') {
      throw new Error(
        'Test device must be offline (Wi-Fi and mobile data off), or use TEST_NETWORK_ISOLATED=true for a verified isolated test network.',
      );
    }
  }
  let apkSha256: string;
  if (env.appPath) apkSha256 = createHash('sha256').update(readFileSync(env.appPath)).digest('hex');
  else {
    const apk = adb(device.udid, 'shell', 'pm', 'path', env.appPackage)
      .split(/\r?\n/)[0]
      ?.replace(/^package:/, '');
    if (!apk?.startsWith('/')) throw new Error('Cannot resolve installed APK identity.');
    apkSha256 = adb(device.udid, 'shell', 'sha256sum', apk).split(/\s/)[0];
    if (!/^[a-f0-9]{64}$/.test(apkSha256)) throw new Error('Cannot fingerprint the installed APK.');
  }
  return {
    udid: device.udid,
    api,
    locale,
    appPackage: env.appPackage,
    versionName: /versionName=([^\s]+)/.exec(details)?.[1] ?? 'APK supplied; verify after install',
    apkSha256,
    node: process.versions.node,
    appium: versionAt(resolve(PROJECT_ROOT, 'node_modules/appium/package.json')),
    webdriverio: versionAt(resolve(PROJECT_ROOT, 'node_modules/webdriverio/package.json')),
    uiautomator2: driverVersion,
  };
}
