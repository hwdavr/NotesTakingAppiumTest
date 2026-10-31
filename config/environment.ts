import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const DRIVER_VERSION = '8.7.3';
export const APPIUM_HOME = resolve(PROJECT_ROOT, '.appium');
export type Suite = 'smoke' | 'authenticated';
export interface Environment {
  udid?: string;
  appPath?: string;
  appPackage: string;
  appActivity: string;
  serverUrl: string;
  externalServer: boolean;
  waitTimeout: number;
  connectionTimeout: number;
  capturePageSource: boolean;
  isolatedNetwork: boolean;
  suite: Suite;
}

function integer(env: NodeJS.ProcessEnv, name: string, fallback: number, max: number): number {
  const raw = env[name] ?? String(fallback);
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > max) {
    throw new Error(`${name} must be an integer from 1 to ${max}.`);
  }
  return Number(raw);
}

function boolean(env: NodeJS.ProcessEnv, name: string): boolean {
  const value = env[name] ?? 'false';
  if (value !== 'true' && value !== 'false') throw new Error(`${name} must be true or false.`);
  return value === 'true';
}

export function projectPath(path: string): string {
  const result = resolve(PROJECT_ROOT, path);
  const offset = relative(PROJECT_ROOT, result);
  if (offset.startsWith(`..${sep}`) || offset === '..' || isAbsolute(offset)) {
    throw new Error('Artifact path must stay inside AppiumTest.');
  }
  let ancestor = result;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const actual = relative(realpathSync(PROJECT_ROOT), realpathSync(ancestor));
  if (actual === '..' || actual.startsWith(`..${sep}`) || isAbsolute(actual)) {
    throw new Error('Artifact path must not escape AppiumTest through a symlink.');
  }
  return result;
}

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const port = integer(env, 'APPIUM_PORT', 4723, 65535);
  let url: URL;
  try {
    url = new URL(env.APPIUM_SERVER_URL ?? `http://127.0.0.1:${port}/`);
  } catch {
    throw new Error('APPIUM_SERVER_URL must be a valid HTTP(S) URL.');
  }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (!['http:', 'https:'].includes(url.protocol) || (!loopback && url.protocol !== 'https:')) {
    throw new Error('APPIUM_SERVER_URL requires HTTPS unless it uses loopback.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('APPIUM_SERVER_URL must not include credentials, a query, or a fragment.');
  }
  const appPackage = env.APP_PACKAGE ?? 'com.example.notesapp';
  const appActivity = env.APP_ACTIVITY ?? 'com.example.notesapp.MainActivity';
  if (!/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/.test(appPackage)) {
    throw new Error('APP_PACKAGE must be an Android package name.');
  }
  if (!/^\.?[a-zA-Z][\w.]*(?:\$[\w]+)?$/.test(appActivity)) {
    throw new Error('APP_ACTIVITY must be an Android activity name.');
  }
  const udid = env.ANDROID_UDID;
  if (udid !== undefined && (!udid.trim() || /\s/.test(udid))) {
    throw new Error('ANDROID_UDID must be a nonempty device serial without whitespace.');
  }
  let appPath: string | undefined;
  if (env.APP_PATH !== undefined) {
    appPath = resolve(PROJECT_ROOT, env.APP_PATH);
    if (
      !env.APP_PATH.trim() ||
      extname(appPath).toLowerCase() !== '.apk' ||
      !existsSync(appPath) ||
      !statSync(appPath).isFile()
    ) {
      throw new Error('APP_PATH must name an existing .apk file.');
    }
    if (
      !readFileSync(appPath)
        .subarray(0, 4)
        .equals(Buffer.from([0x50, 0x4b, 3, 4]))
    ) {
      throw new Error('APP_PATH is not an APK/ZIP archive.');
    }
  }
  const suite = env.TEST_SUITE ?? 'smoke';
  if (suite !== 'smoke' && suite !== 'authenticated') throw new Error('Unknown TEST_SUITE.');
  return {
    udid,
    appPath,
    appPackage,
    appActivity,
    serverUrl: url.href,
    externalServer: env.APPIUM_SERVER_URL !== undefined,
    waitTimeout: integer(env, 'WAIT_TIMEOUT_MS', 15000, 120000),
    connectionTimeout: integer(env, 'CONNECTION_TIMEOUT_MS', 120000, 600000),
    capturePageSource: boolean(env, 'CAPTURE_PAGE_SOURCE'),
    isolatedNetwork: boolean(env, 'TEST_NETWORK_ISOLATED'),
    suite,
  };
}

export function localServiceOptions() {
  return {
    command: resolve(PROJECT_ROOT, 'node_modules/.bin/appium'),
    args: { address: '127.0.0.1' },
  };
}
