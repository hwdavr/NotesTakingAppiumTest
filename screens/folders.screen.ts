import { expect } from '@wdio/globals';
import { BaseScreen } from './base.screen.js';

export class FoldersScreen extends BaseScreen {
  async assertVisible(): Promise<void> {
    await expect(this.element('id=folders_screen')).toBeDisplayed();
  }
}
export const folders = new FoldersScreen();
