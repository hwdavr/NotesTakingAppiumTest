import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT_ROOT } from '../config/environment.js';
import { runDirectory } from '../support/artifacts.js';

const base = resolve(PROJECT_ROOT, 'artifacts');
const runId =
  process.env.RUN_ID ??
  (existsSync(base)
    ? readdirSync(base)
        .sort()
        .reverse()
        .find((name) => existsSync(resolve(base, name, 'allure-results')))
    : undefined);
if (!runId) throw new Error('No Allure results. Run a device suite first or set RUN_ID.');
const directory = runDirectory(runId);
const executable = resolve(PROJECT_ROOT, 'node_modules/.bin/allure');
const args = process.argv.includes('--open')
  ? ['open', resolve(directory, 'allure-report')]
  : [
      'generate',
      resolve(directory, 'allure-results'),
      '--clean',
      '-o',
      resolve(directory, 'allure-report'),
    ];
const result = spawnSync(executable, args, { cwd: PROJECT_ROOT, stdio: 'inherit' });
if (result.error || result.status !== 0) process.exitCode = result.status ?? 1;
