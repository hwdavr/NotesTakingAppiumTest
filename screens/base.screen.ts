import { $ } from '@wdio/globals';

export class BaseScreen {
  protected element(selector: string) {
    return $(selector);
  }
  async waitVisible(selector: string): Promise<void> {
    await this.element(selector).waitForDisplayed();
  }
  async tap(selector: string): Promise<void> {
    const element = this.element(selector);
    await element.waitForDisplayed();
    await element.click();
  }
}
