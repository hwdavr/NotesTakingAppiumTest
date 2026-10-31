import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectPath } from '../config/environment.js';

export interface CaptureDriver {
  saveScreenshot(path: string): Promise<unknown>;
  getPageSource(): Promise<string>;
}
export function runDirectory(runId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error('Invalid RUN_ID.');
  return projectPath(`artifacts/${runId}`);
}
export async function captureFailure(
  driver: CaptureDriver,
  directory: string,
  testName: string,
  captureSource: boolean,
): Promise<{ screenshot?: string; errors: string[] }> {
  projectPath(directory);
  await mkdir(directory, { recursive: true });
  const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  const errors: string[] = [];
  const screenshot = resolve(directory, `${safeName}.png`);
  let saved = false;
  try {
    await driver.saveScreenshot(screenshot);
    saved = true;
  } catch {
    errors.push('Screenshot capture failed.');
  }
  if (captureSource) {
    try {
      await writeFile(resolve(directory, `${safeName}.xml`), await driver.getPageSource());
    } catch {
      errors.push('Opt-in hierarchy capture failed.');
    }
  }
  await writeFile(
    resolve(directory, `${safeName}.failure.json`),
    JSON.stringify({ test: testName, errors }, null, 2),
  );
  return { ...(saved ? { screenshot } : {}), errors };
}
