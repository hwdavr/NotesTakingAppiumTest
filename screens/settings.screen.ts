import { expect } from '@wdio/globals';
import { BaseScreen } from './base.screen.js';

export class SettingsScreen extends BaseScreen {
  async assertVisible(): Promise<void> {
    await expect(this.element('id=settings_screen')).toBeDisplayed();
  }
}
export const settings = new SettingsScreen();
