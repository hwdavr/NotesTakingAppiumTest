import { $, expect } from '@wdio/globals';
import { before, describe, it } from 'mocha';
import { editor } from '../../../screens/editor.screen.js';
import { home } from '../../../screens/home.screen.js';
import { requireAuthenticatedHome } from '../../../support/app-state.js';
import { withCleanup } from '../../../support/cleanup.js';
import { createNoteFixture } from '../../../support/note-fixture.js';

describe('Create a 4×4 table', () => {
  before(requireAuthenticatedHome);

  it('UI-05 expands a new note table to four rows and four columns', async function () {
    this.timeout(180000);
    const note = createNoteFixture();
    let ownsEditor = false;

    await withCleanup(
      async () => {
        // Arrange: ownership comes from this Home → new editor transition.
        await home.openCreationSheet();
        await home.chooseTextNote();
        await $(editor.title).waitForExist();
        ownsEditor = true;
        await editor.setTitle(note.title);
        await editor.dismissKeyboard();

        // Act: preserve both insertions of each kind and every menu-close wait.
        await editor.revealAddTable();
        await expect($(editor.addTable)).toBeDisplayed();
        await editor.insertTable();
        await editor.focusNameCell();
        for (let count = 0; count < 2; count++) {
          await editor.insertFromCellOptions('Insert column right');
        }
        for (let count = 0; count < 2; count++) {
          await editor.insertFromCellOptions('Insert row below');
        }
        await editor.revealAgeColumn();

        // Assert: recorded presence, then the stronger oracle derived from the goal.
        await $(editor.grid).waitForExist();
        await editor.assertDimensions(4, 4);
        await expect($(editor.title)).toHaveText(note.title);
      },
      async () => {
        if (ownsEditor) {
          await editor.saveCreatedNoteAndLeave(note.title);
          await home.openNoteByTitle(note.title);
          await editor.archiveCreatedNote(note.title);
          await home.assertVisible();
        } else if (await $(home.textNote).isDisplayed()) {
          await home.dismissCreationSheet();
        }
      },
    );
  });
});
