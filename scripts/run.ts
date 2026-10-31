import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { APPIUM_HOME, loadEnvironment, PROJECT_ROOT } from '../config/environment.js';
import { runDirectory } from '../support/artifacts.js';
import { preflight } from '../support/device.js';

config({ path: resolve(PROJECT_ROOT, '.env'), quiet: true });
const suite = process.argv[2] ?? 'smoke';
process.env.TEST_SUITE = suite;
const runId = new Date().toISOString().replace(/[^0-9TZ]/g, '') + '_' + randomUUID().slice(0, 8);
process.env.RUN_ID = runId;
process.env.APPIUM_HOME = APPIUM_HOME;
const directory = runDirectory(runId);
mkdirSync(directory, { recursive: true });
try {
  const runtime = preflight(loadEnvironment());
  process.env.ANDROID_UDID = runtime.udid;
  writeFileSync(resolve(directory, 'runtime.json'), JSON.stringify({ ...runtime, suite }, null, 2));
  const cli = resolve(PROJECT_ROOT, 'node_modules/@wdio/cli/bin/wdio.js');
  const forwarded = process.argv.slice(3);
  const selection = forwarded.some((arg) => arg === '--spec' || arg.startsWith('--spec='))
    ? []
    : ['--suite', suite];
  const result = spawnSync(
    process.execPath,
    [cli, 'run', 'wdio.conf.ts', ...selection, ...forwarded],
    { cwd: PROJECT_ROOT, env: process.env, stdio: 'inherit' },
  );
  if (result.error) throw new Error('Unable to start WebdriverIO. Run npm ci and check Node.');
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else {
    const junit = resolve(directory, 'junit');
    const count = readdirSync(junit)
      .filter((name) => name.endsWith('.xml'))
      .reduce((total, name) => {
        const xml = readFileSync(resolve(junit, name), 'utf8');
        const header = /<testsuites?\b([^>]*)>/.exec(xml)?.[1] ?? '';
        const field = (name: string) =>
          Number(new RegExp(`\\b${name}="(\\d+)"`).exec(header)?.[1] ?? 0);
        if (field('failures') || field('errors'))
          throw new Error('JUnit contains failed or errored cases.');
        return total + field('tests') - field('skipped');
      }, 0);
    if (!count) throw new Error('No JUnit test execution evidence; refusing an empty passing run.');
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Test execution failed.';
  writeFileSync(resolve(directory, 'setup-error.txt'), message + '\n');
  console.error(message);
  process.exitCode = 1;
}
console.log(`Run artifacts: ${directory}`);
