import { Page } from 'playwright';

export class StealthUtils {
  /**
   * Generates random delay between min and max ms.
   */
  public static async randomDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Simulates realistic human typing with variable inter-keystroke timing.
   */
  public static async typeLikeHuman(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    for (const char of text) {
      await page.keyboard.press(char);
      const delay = Math.floor(Math.random() * 80) + 40; // 40-120ms per character
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  /**
   * Simulates smooth human mouse scrolling.
   */
  public static async smoothScroll(page: Page, pixels: number = 400): Promise<void> {
    await page.evaluate((px) => {
      window.scrollBy({ top: px, behavior: 'smooth' });
    }, pixels);
    await this.randomDelay(300, 700);
  }
}
