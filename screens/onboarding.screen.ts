import { expect } from '@wdio/globals';
import { BaseScreen } from './base.screen.js';

export class OnboardingScreen extends BaseScreen {
  readonly signup = 'id=onboarding_signup_button';
  readonly login = 'id=onboarding_login_text';
  async assertVisible(): Promise<void> {
    await expect(this.element(this.signup)).toBeDisplayed();
    await expect(this.element(this.login)).toBeDisplayed();
  }
}
export const onboarding = new OnboardingScreen();
