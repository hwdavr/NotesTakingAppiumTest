import { before, describe, it } from 'mocha';
import { home } from '../../../screens/home.screen.js';
import { withCleanup } from '../../../support/cleanup.js';
import { requireAuthenticatedHome } from '../../../support/app-state.js';

describe('Home creation options', () => {
  before(requireAuthenticatedHome);
  it('UI-02 opens and dismisses creation options without creating a note', async () => {
    await withCleanup(
      () => home.openCreationSheet(),
      () => home.dismissCreationSheet(),
    );
  });
});
