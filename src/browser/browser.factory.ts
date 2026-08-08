import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { config } from '../config/env.js';

export class BrowserFactory {
  private static browser: Browser | null = null;
  private static context: BrowserContext | null = null;

  public static async createPage(headlessOverride?: boolean): Promise<{ page: Page; context: BrowserContext }> {
    const isHeadless = headlessOverride !== undefined ? headlessOverride : config.headless;

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: isHeadless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-size=1280,800',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      });
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      permissions: ['geolocation'],
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
    });

    // Add init script to mask navigator.webdriver
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    const page = await this.context.newPage();
    return { page, context: this.context };
  }

  public static async closeAll(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
