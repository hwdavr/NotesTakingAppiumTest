import { expect } from '@wdio/globals';
import { describe, it } from 'mocha';
import { assertEntryState } from '../../../support/app-state.js';

describe('Launch smoke', () => {
  it('UI-01 launches the shipped app with recognized debug entry controls', async () => {
    const state = await assertEntryState();
    expect(['home', 'onboarding']).toContain(state);
  });
});
