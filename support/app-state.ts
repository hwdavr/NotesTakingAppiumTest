import { $, browser } from '@wdio/globals';
import { loadEnvironment } from '../config/environment.js';
import { home } from '../screens/home.screen.js';
import { onboarding } from '../screens/onboarding.screen.js';

export async function assertEntryState(): Promise<'home' | 'onboarding'> {
  const settings = loadEnvironment();
  await browser.waitUntil(async () => (await browser.getCurrentPackage()) === settings.appPackage, {
    timeoutMsg: 'NotesTakingApp did not become the foreground app.',
  });
  await browser.waitUntil(
    async () => (await $(home.add).isDisplayed()) || (await $(onboarding.signup).isDisplayed()),
    {
      timeoutMsg:
        'Neither Home nor Onboarding debug IDs appeared. Check the app build and current screen.',
    },
  );
  if (await $(home.add).isDisplayed()) {
    await home.assertVisible();
    return 'home';
  }
  await onboarding.assertVisible();
  return 'onboarding';
}
export async function requireAuthenticatedHome(): Promise<void> {
  const state = await assertEntryState();
  if (state !== 'home')
    throw new Error(
      'Authenticated suite requires an existing login on this test device. Log in manually before running it; no credentials are injected.',
    );
}
