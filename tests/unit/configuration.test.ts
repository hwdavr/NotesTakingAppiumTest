import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { androidCapabilities } from '../../config/capabilities.js';
import {
  APPIUM_HOME,
  loadEnvironment,
  localServiceOptions,
  PROJECT_ROOT,
  projectPath,
} from '../../config/environment.js';

test('CFG-01: defaults preserve data and expose bare Compose IDs', () => {
  const env = loadEnvironment({});
  const capabilities = androidCapabilities(env, 'emulator-5554');
  assert.equal(env.appPackage, 'com.example.notesapp');
  assert.equal(env.appActivity, 'com.example.notesapp.MainActivity');
  assert.equal(env.waitTimeout, 15000);
  assert.equal(capabilities['appium:noReset'], true);
  assert.equal(capabilities['appium:fullReset'], false);
  assert.equal(capabilities['appium:autoGrantPermissions'], false);
  assert.equal(capabilities['appium:settings[disableIdLocatorAutocompletion]'], true);
  assert.equal(capabilities['appium:udid'], 'emulator-5554');
  assert.equal('appium:app' in capabilities, false);
});

test('CFG-02: malformed settings fail at configuration time', () => {
  const cases: NodeJS.ProcessEnv[] = [
    { APPIUM_PORT: '0' },
    { APPIUM_PORT: '65536' },
    { APPIUM_PORT: '4.5' },
    { WAIT_TIMEOUT_MS: '-1' },
    { CONNECTION_TIMEOUT_MS: 'abc' },
    { CAPTURE_PAGE_SOURCE: 'yes' },
    { TEST_NETWORK_ISOLATED: '1' },
    { APP_PACKAGE: 'bad package' },
    { APP_ACTIVITY: 'Activity;exit' },
    { ANDROID_UDID: ' ' },
    { TEST_SUITE: 'missing' },
    { APP_PATH: 'missing.apk' },
    { APP_PATH: '' },
    { APPIUM_SERVER_URL: 'not a URL' },
    { APPIUM_SERVER_URL: 'file:///tmp/server' },
  ];
  for (const env of cases) assert.throws(() => loadEnvironment(env), Error);
});

test('CFG-02: APK path resolves from the project and rejects non-APK archives', () => {
  const parent = projectPath('artifacts/unit-fixtures');
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(resolve(parent, 'apk-'));
  try {
    const path = resolve(directory, 'debug.apk');
    writeFileSync(path, 'not a ZIP');
    assert.throws(() => loadEnvironment({ APP_PATH: path }), /APK\/ZIP/);
    writeFileSync(path, Buffer.from([0x50, 0x4b, 3, 4]));
    assert.equal(loadEnvironment({ APP_PATH: path }).appPath, path);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('SEC-01: local service is loopback-only and driver home is project-local', () => {
  const service = localServiceOptions();
  assert.deepEqual(service.args, { address: '127.0.0.1' });
  assert.ok(service.command.startsWith(PROJECT_ROOT));
  assert.equal(APPIUM_HOME, resolve(PROJECT_ROOT, '.appium'));
  assert.equal(loadEnvironment({}).externalServer, false);
  assert.equal(
    loadEnvironment({ APPIUM_SERVER_URL: 'http://localhost:4725/' }).externalServer,
    true,
  );
});

test('SEC-02: credential-bearing or insecure remote endpoints are rejected without echoing credentials', () => {
  for (const url of [
    'http://user:secret@localhost:4723/',
    'http://remote.example:4723/',
    'https://example.test/?token=secret',
  ]) {
    assert.throws(
      () => loadEnvironment({ APPIUM_SERVER_URL: url }),
      (error: unknown) => error instanceof Error && !error.message.includes('secret'),
    );
  }
  assert.equal(
    loadEnvironment({ APPIUM_SERVER_URL: 'https://grid.example.test/wd/hub' }).serverUrl,
    'https://grid.example.test/wd/hub',
  );
});

test('SEC-02: artifact path rejects traversal and escaping symlinks', () => {
  assert.throws(() => projectPath('../outside'), /inside/);
  const directory = mkdtempSync(projectPath('artifacts/path-'));
  try {
    symlinkSync('/', resolve(directory, 'escape'));
    assert.throws(
      () => projectPath(resolve(directory, 'escape', 'private', 'capture.png')),
      /symlink/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
