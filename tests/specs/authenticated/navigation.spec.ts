import { beforeEach, describe, it } from 'mocha';
import { folders } from '../../../screens/folders.screen.js';
import { home } from '../../../screens/home.screen.js';
import { settings } from '../../../screens/settings.screen.js';
import { withCleanup } from '../../../support/cleanup.js';
import { requireAuthenticatedHome } from '../../../support/app-state.js';

describe('Bottom navigation', () => {
  beforeEach(requireAuthenticatedHome);
  it('UI-03 opens Settings and returns to Home', async () => {
    await home.navigate('Settings');
    await withCleanup(
      () => settings.assertVisible(),
      () => home.navigate('Home'),
    );
    await home.assertVisible();
  });
  it('UI-04 opens Folders and returns to Home', async () => {
    await home.navigate('Folders');
    await withCleanup(
      () => folders.assertVisible(),
      () => home.navigate('Home'),
    );
    await home.assertVisible();
  });
});
