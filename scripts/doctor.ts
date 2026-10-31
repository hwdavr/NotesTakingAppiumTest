import { config } from 'dotenv';
import { resolve } from 'node:path';
import { loadEnvironment, PROJECT_ROOT } from '../config/environment.js';
import { preflight } from '../support/device.js';

config({ path: resolve(PROJECT_ROOT, '.env'), quiet: true });
try {
  console.log(JSON.stringify(preflight(loadEnvironment()), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Preflight failed.');
  process.exitCode = 1;
}
