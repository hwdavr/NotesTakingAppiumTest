import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { projectPath } from '../../config/environment.js';
import { captureFailure, runDirectory } from '../../support/artifacts.js';
import { withCleanup } from '../../support/cleanup.js';

async function temporaryDirectory() {
  const parent = projectPath('artifacts/unit-fixtures');
  await mkdir(parent, { recursive: true });
  return mkdtemp(resolve(parent, 'capture-'));
}

test('ART-01: failure artifacts omit hierarchy unless explicitly enabled', async () => {
  const directory = await temporaryDirectory();
  let hierarchyCalls = 0;
  const driver = {
    async saveScreenshot(path: string) {
      await writeFile(path, 'unit boundary fixture');
    },
    async getPageSource() {
      hierarchyCalls++;
      return '<hierarchy />';
    },
  };
  try {
    const capture = await captureFailure(driver, directory, 'example failure', false);
    assert.ok(capture.screenshot);
    assert.deepEqual(capture.errors, []);
    assert.equal(hierarchyCalls, 0);
    assert.equal(
      (await readdir(directory)).some((name) => name.endsWith('.xml')),
      false,
    );
    await captureFailure(driver, directory, 'opt in', true);
    assert.equal(hierarchyCalls, 1);
    assert.equal(await readFile(resolve(directory, 'opt_in.xml'), 'utf8'), '<hierarchy />');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('ART-02: screenshot failure remains an explicit diagnostic', async () => {
  const directory = await temporaryDirectory();
  try {
    const result = await captureFailure(
      {
        async saveScreenshot() {
          throw new Error('device lost');
        },
        async getPageSource() {
          throw new Error('device lost');
        },
      },
      directory,
      'failed test',
      true,
    );
    assert.equal(result.screenshot, undefined);
    assert.deepEqual(result.errors, [
      'Screenshot capture failed.',
      'Opt-in hierarchy capture failed.',
    ]);
    assert.deepEqual(
      JSON.parse(await readFile(resolve(directory, 'failed_test.failure.json'), 'utf8')).errors,
      result.errors,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('ART-02: cleanup runs without replacing the original test failure', async () => {
  const original = new Error('original assertion');
  let cleaned = false;
  await assert.rejects(
    withCleanup(
      async () => {
        throw original;
      },
      async () => {
        cleaned = true;
        throw new Error('cleanup failed');
      },
    ),
    (error) => error === original,
  );
  assert.equal(cleaned, true);
  await assert.rejects(
    withCleanup(
      async () => {
        cleaned = false;
      },
      async () => {
        throw new Error('cleanup alone failed');
      },
    ),
    /cleanup alone failed/,
  );
});

test('SEC-02: run identities cannot escape the artifacts directory', () => {
  assert.throws(() => runDirectory('../escape'), /RUN_ID/);
  assert.ok(runDirectory('run_123').endsWith('artifacts/run_123'));
});
