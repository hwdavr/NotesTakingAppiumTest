import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseDevices,
  selectDevice,
  validateRuntime,
  validateInstrumentation,
} from '../../support/device.js';

test('PRE-01: inventory selection rejects absent, unauthorized, and ambiguous devices', () => {
  assert.throws(() => selectDevice([]), /No online/);
  const inventory = parseDevices(
    'List of devices attached\nemulator-1 device product:test\nphone unauthorized\nemulator-2 offline\n',
  );
  assert.equal(selectDevice(inventory).udid, 'emulator-1');
  assert.throws(() => selectDevice(inventory, 'phone'), /unauthorized/);
  assert.throws(() => selectDevice(inventory, 'missing'), /absent/);
  const multiple = [...inventory, { udid: 'emulator-3', state: 'device' }];
  assert.throws(() => selectDevice(multiple), /Multiple/);
  assert.equal(selectDevice(multiple, 'emulator-3').udid, 'emulator-3');
});

test('PRE-02: runtime rejects unsupported APIs, release builds, and unsupported authenticated locales', () => {
  assert.throws(() => validateRuntime(25, true, 'en-US', 'smoke'), /API 26/);
  assert.throws(() => validateRuntime(NaN, true, 'en-US', 'smoke'), /API 26/);
  assert.throws(() => validateRuntime(33, false, 'en-US', 'smoke'), /debuggable/);
  assert.throws(() => validateRuntime(33, true, 'fr-FR', 'authenticated'), /English/);
  assert.doesNotThrow(() => validateRuntime(33, true, 'en-US', 'authenticated'));
  assert.doesNotThrow(() => validateRuntime(33, true, 'fr-FR', 'smoke'));
});

test('PRE-03: competing instrumentation fails before Appium and is never stopped automatically', () => {
  assert.throws(
    () => validateInstrumentation('ActiveInstrumentation{123 {com.example.helper/Runner} 1 procs}'),
    /another instrumentation/,
  );
  assert.doesNotThrow(() => validateInstrumentation('Active instrumentation: none'));
});
