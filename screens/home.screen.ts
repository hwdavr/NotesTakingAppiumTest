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
  async chooseTextNote(): Promise<void> {
    await this.tap(this.textNote);
  }
  async openNoteByTitle(title: string): Promise<void> {
    await this.assertVisible();
    const target = `new UiSelector().className("android.widget.TextView").text(${JSON.stringify(title)})`;
    await $(
      'android=new UiScrollable(new UiSelector().resourceId("home_notes_list"))' +
        `.setMaxSearchSwipes(10).scrollIntoView(${target})`,
    ).waitForDisplayed();
    const matches = await $('id=home_notes_list').$$(`android=${target}`);
    if (matches.length !== 1)
      throw new Error('The owned note title is missing or ambiguous in Home.');
    await matches[0].click();
  }
  async navigate(tab: 'Home' | 'Settings' | 'Folders'): Promise<void> {
    const target = $('id=app_bottom_navigation').$(`android=new UiSelector().text("${tab}")`);
    await target.waitForDisplayed();
    await target.click();
  }
}
export const home = new HomeScreen();
