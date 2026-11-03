import { $, $$, browser, expect } from '@wdio/globals';
import { assertTableLayout } from '../support/table-layout.js';
import { BaseScreen } from './base.screen.js';

function textView(text: string): string {
  return `android=new UiSelector().className("android.widget.TextView").text(${JSON.stringify(text)})`;
}

export class EditorScreen extends BaseScreen {
  readonly title = 'id=editor_title_input';
  readonly toolbar = 'id=editor_default_bottom_bar';
  readonly addTable = 'id=editor_add_table';
  readonly grid = 'id=editor_table_grid';
  readonly tableScroll = 'id=editor_table_scroll';
  readonly cellOptions = 'id=editor_cell_options_action';
  readonly more = 'id=editor_top_more';

  private async unique(selector: string) {
    await browser.waitUntil(async () => (await $$(selector)).length === 1, {
      timeoutMsg: `Expected one native target for ${selector}.`,
    });
    const matches = await $$(selector);
    if (matches.length !== 1) throw new Error(`Ambiguous native target: ${selector}.`);
    await matches[0].waitForDisplayed();
    return matches[0];
  }

  async setTitle(title: string): Promise<void> {
    const input = await this.unique(this.title);
    await input.setValue(title);
    await expect($(this.title)).toHaveText(title);
  }

  async dismissKeyboard(): Promise<void> {
    if (await browser.isKeyboardShown()) await browser.hideKeyboard();
    await browser.waitUntil(async () => !(await browser.isKeyboardShown()), {
      timeoutMsg: 'The native keyboard did not dismiss.',
    });
  }

  async revealAddTable(): Promise<void> {
    // Preserve the recorded left swipe, then continue only until the action is exposed.
    for (let attempt = 0; attempt < 6; attempt++) {
      const container = await this.unique(this.toolbar);
      await browser.execute('mobile: swipeGesture', {
        elementId: container.elementId,
        direction: 'left',
        percent: 0.65,
      });
      if (await $(this.addTable).isDisplayed()) return;
    }
    throw new Error(`Could not reveal ${this.addTable} within ${this.toolbar} after 6 swipes.`);
  }

  async insertTable(): Promise<void> {
    await (await this.unique(this.addTable)).click();
    await $(this.grid).waitForExist();
    await this.unique(this.grid);
    await this.assertDimensions(2, 2);
  }

  private async namedCell(text: string) {
    const grid = await this.unique(this.grid);
    const selector = `android=new UiSelector().className("android.widget.EditText").text(${JSON.stringify(text)})`;
    const matches = await grid.$$(selector);
    if (matches.length !== 1) throw new Error(`Expected one ${text} EditText in the created grid.`);
    return matches[0];
  }

  async focusNameCell(): Promise<void> {
    const cell = await this.namedCell('Name');
    await cell.waitForDisplayed();
    await cell.click();
    await $(this.cellOptions).waitForExist();
    await this.unique(this.cellOptions);
  }

  async insertFromCellOptions(action: 'Insert column right' | 'Insert row below'): Promise<void> {
    await (await this.unique(this.cellOptions)).click();
    const selector = textView(action);
    await $(selector).waitForExist();
    await (await this.unique(selector)).click();
    // Absence is stronger than hidden: retain the recording's menu-closed boundary.
    await $(selector).waitForExist({ reverse: true });
    await this.unique(this.cellOptions);
  }

  async revealAgeColumn(): Promise<void> {
    await this.dismissKeyboard();
    // The terminal swipe reveals the existing rightmost Age column; no cell is selected.
    for (let attempt = 0; attempt < 6; attempt++) {
      const container = await this.unique(this.tableScroll);
      await browser.execute('mobile: swipeGesture', {
        elementId: container.elementId,
        direction: 'left',
        percent: 0.65,
      });
      const grid = await this.unique(this.grid);
      const ageCells = await grid.$$(
        'android=new UiSelector().className("android.widget.EditText").text("Age")',
      );
      if (ageCells.length > 1) throw new Error('Ambiguous Age column in the created table.');
      if (ageCells.length === 1 && (await ageCells[0].isDisplayed())) {
        const viewport = await browser.getElementRect(container.elementId);
        const age = await browser.getElementRect(ageCells[0].elementId);
        if (age.x >= viewport.x && age.x + age.width <= viewport.x + viewport.width + 2) return;
      }
    }
    throw new Error(`Could not reveal the Age column within ${this.tableScroll} after 6 swipes.`);
  }

  async assertDimensions(rows: number, columns: number): Promise<void> {
    await this.unique(this.grid);
    await browser.waitUntil(
      async () => {
        const cells = await $(this.grid).$$('id=editor_table_cell');
        return cells.length === rows * columns;
      },
      {
        timeoutMsg:
          `Native ${this.grid} must expose all ${rows * columns} cells for ${rows}×${columns}; ` +
          'missing/clipped/virtualized cells cannot prove the dimensions.',
      },
    );
    const cells = await $(this.grid).$$('id=editor_table_cell');
    const bounds = [];
    for (const cell of cells) {
      await expect(cell).toBeDisplayed();
      await expect(cell).toHaveAttribute('class', 'android.widget.EditText');
      bounds.push(await browser.getElementRect(cell.elementId));
    }
    assertTableLayout(bounds, rows, columns);
  }

  private async dismissTableSheets(): Promise<void> {
    await this.dismissKeyboard();
    for (const title of ['Cell Options', 'Table Options']) {
      const selector = textView(title);
      if (await $(selector).isDisplayed()) {
        await browser.back();
        await $(selector).waitForExist({ reverse: true });
      }
    }
  }

  // Saving through Back cancels pending autosave jobs. Archiving a never-saved editor
  // would otherwise return Home while a delayed save could still create the note.
  async saveCreatedNoteAndLeave(title: string): Promise<void> {
    await this.dismissTableSheets();
    await this.setTitle(title);
    await this.dismissKeyboard();
    await (await this.unique('id=editor_top_back')).click();
    await browser.waitUntil(
      async () =>
        !(await $(this.title).isExisting()) ||
        (await $(textView('Smart Categorization')).isDisplayed()) ||
        (await $(textView('No matching folder')).isDisplayed()),
      {
        timeoutMsg:
          'Saving the owned note did not reach Home or a recognized categorization dialog.',
      },
    );
    if (await $(textView('Smart Categorization')).isDisplayed()) {
      await (await this.unique(textView('Cancel'))).click();
    } else if (await $(textView('No matching folder')).isDisplayed()) {
      await (await this.unique(textView('No'))).click();
    }
    await $(this.title).waitForExist({ reverse: true });
  }

  // Caller must reopen only the UUID title created by this test after saving it.
  async archiveCreatedNote(title: string): Promise<void> {
    await this.dismissTableSheets();
    await this.unique(this.title);
    await expect($(this.title)).toHaveText(title);
    await (await this.unique(this.more)).click();
    // The note-actions sheet opens partially expanded. Drag its semantic handle
    // upward; swiping a clickable action row can activate Rename instead.
    const archive = '~Archive';
    for (let attempt = 0; attempt < 3 && !(await $(archive).isDisplayed()); attempt++) {
      const handle = await this.unique('~Drag handle');
      const [{ x, y }, { width, height }] = await Promise.all([
        handle.getLocation(),
        handle.getSize(),
      ]);
      const { height: windowHeight } = await browser.getWindowSize();
      const startX = Math.round(x + width / 2);
      const startY = Math.round(y + height / 2);
      const endY = Math.max(1, startY - Math.round(windowHeight * 0.35));
      try {
        await browser.performActions([
          {
            type: 'pointer',
            id: 'bottom-sheet-drag',
            parameters: { pointerType: 'touch' },
            actions: [
              { type: 'pointerMove', duration: 0, x: startX, y: startY },
              { type: 'pointerDown', button: 0 },
              { type: 'pause', duration: 100 },
              { type: 'pointerMove', duration: 350, x: startX, y: endY },
              { type: 'pointerUp', button: 0 },
            ],
          },
        ]);
      } finally {
        await browser.releaseActions();
      }
    }
    await browser.waitUntil(async () => await $(archive).isDisplayed(), {
      timeoutMsg:
        'The Archive action stayed below the note-actions sheet after 3 drag-handle swipes.',
    });
    await (await this.unique(archive)).click();
    await $(this.title).waitForExist({ reverse: true });
  }
}

export const editor = new EditorScreen();
