import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPIUM_HOME, DRIVER_VERSION, PROJECT_ROOT } from '../config/environment.js';

const packagePath = resolve(PROJECT_ROOT, 'node_modules/appium/package.json');
if (!existsSync(packagePath)) throw new Error('Run npm ci before setup:driver.');
const appium = JSON.parse(readFileSync(packagePath, 'utf8')) as { bin: Record<string, string> };
const cli = resolve(PROJECT_ROOT, 'node_modules/appium', appium.bin.appium);
const driverPackage = resolve(APPIUM_HOME, 'node_modules/appium-uiautomator2-driver/package.json');
function run(args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: { ...process.env, APPIUM_HOME, npm_config_cache: resolve(PROJECT_ROOT, '.npm-cache') },
  });
  if (result.error || result.status !== 0)
    throw new Error('Appium driver setup failed. Inspect its output above.');
}
if (existsSync(driverPackage)) {
  const installed = JSON.parse(readFileSync(driverPackage, 'utf8')) as { version: string };
  if (installed.version === DRIVER_VERSION)
    console.log(`UiAutomator2 ${DRIVER_VERSION} already installed locally.`);
  else {
    run(['driver', 'uninstall', 'uiautomator2']);
    run(['driver', 'install', `uiautomator2@${DRIVER_VERSION}`]);
  }
} else run(['driver', 'install', `uiautomator2@${DRIVER_VERSION}`]);
run(['driver', 'doctor', 'uiautomator2']);
