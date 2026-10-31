import { $, browser, expect } from '@wdio/globals';
import { BaseScreen } from './base.screen.js';

export class HomeScreen extends BaseScreen {
  readonly add = 'id=home_add_fab';
  readonly textNote = '~New text note';
  readonly voiceNote = '~New voice recording';
  async assertVisible(): Promise<void> {
    await expect(this.element(this.add)).toBeDisplayed();
  }
  async openCreationSheet(): Promise<void> {
    await this.tap(this.add);
    await expect(this.element(this.textNote)).toBeDisplayed();
    await expect(this.element(this.voiceNote)).toBeDisplayed();
  }
  async dismissCreationSheet(): Promise<void> {
    await browser.back();
    await expect(this.element(this.textNote)).not.toBeDisplayed();
    await this.assertVisible();
  }
  async navigate(tab: 'Home' | 'Settings' | 'Folders'): Promise<void> {
    const target = $('id=app_bottom_navigation').$(`android=new UiSelector().text("${tab}")`);
    await target.waitForDisplayed();
    await target.click();
  }
}
export const home = new HomeScreen();
