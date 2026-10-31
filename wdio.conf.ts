import allure from '@wdio/allure-reporter';
import { browser } from '@wdio/globals';
import { config as dotenv } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { androidCapabilities } from './config/capabilities.js';
import {
  APPIUM_HOME,
  loadEnvironment,
  localServiceOptions,
  PROJECT_ROOT,
} from './config/environment.js';
import { captureFailure, runDirectory } from './support/artifacts.js';
import { preflight } from './support/device.js';

dotenv({ path: resolve(PROJECT_ROOT, '.env'), quiet: true });
process.env.APPIUM_HOME = APPIUM_HOME;
process.env.RUN_ID ??=
  new Date().toISOString().replace(/[^0-9TZ]/g, '') + '_' + randomUUID().slice(0, 8);
const settings = loadEnvironment();
const endpoint = new URL(settings.serverUrl);
const directory = runDirectory(process.env.RUN_ID);
const smoke = ['./tests/specs/smoke/**/*.spec.ts'];
const authenticated = ['./tests/specs/authenticated/**/*.spec.ts'];

export const config: WebdriverIO.Config = {
  runner: 'local',
  hostname: endpoint.hostname,
  port: Number(endpoint.port || (endpoint.protocol === 'https:' ? 443 : 80)),
  protocol: endpoint.protocol === 'https:' ? 'https' : 'http',
  path: endpoint.pathname,
  specs: smoke,
  suites: { smoke, authenticated },
  maxInstances: 1,
  capabilities: [androidCapabilities(settings, settings.udid ?? 'device-selected-in-onPrepare')],
  logLevel: 'warn',
  outputDir: resolve(directory, 'wdio'),
  bail: 0,
  waitforTimeout: settings.waitTimeout,
  waitforInterval: 250,
  connectionRetryTimeout: settings.connectionTimeout,
  connectionRetryCount: 0,
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 90000, retries: 0 },
  specFileRetries: 0,
  services: settings.externalServer
    ? []
    : [
        [
          'appium',
          {
            ...localServiceOptions(),
            logPath: resolve(directory, 'appium'),
            args: {
              address: '127.0.0.1',
              port: Number(endpoint.port),
              basePath: endpoint.pathname,
            },
          },
        ],
      ],
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: resolve(directory, 'junit'),
        outputFileFormat: (options) => `results-${options.cid}.xml`,
      },
    ],
    [
      'allure',
      {
        outputDir: resolve(directory, 'allure-results'),
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
      },
    ],
  ],
  onPrepare(_config, capabilities) {
    const runtime = preflight(settings);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      resolve(directory, 'runtime.json'),
      JSON.stringify({ ...runtime, suite: settings.suite }, null, 2),
    );
    for (const capability of capabilities as ReturnType<typeof androidCapabilities>[]) {
      capability['appium:udid'] = runtime.udid;
      capability['appium:deviceName'] = runtime.udid;
    }
  },
  async before() {
    await browser.setTimeout({ implicit: 0 });
  },
  async afterTest(test, _context, result) {
    if (result.passed) return;
    try {
      const capture = await captureFailure(
        browser,
        resolve(directory, 'failures'),
        `${test.parent}_${test.title}`,
        settings.capturePageSource,
      );
      if (capture.screenshot)
        allure.addAttachment('Failure screenshot', readFileSync(capture.screenshot), 'image/png');
      for (const error of capture.errors) console.error(error);
    } catch {
      console.error('Failure artifact collection failed; original test failure is retained.');
    }
  },
};
