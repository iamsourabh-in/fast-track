import { BrowserFactory } from '../browser/browser.factory.js';
import { AgentCore, ApplicationJobTarget, ApplicationResult } from '../agent/agent.core.js';
import { config } from '../config/env.js';

export class SwipeModeHandler {
  private static queue: ApplicationJobTarget[] = [];
  private static isProcessing = false;

  public static addJobToSwipeQueue(job: ApplicationJobTarget): void {
    this.queue.push(job);
    console.log(`[SwipeMode] 📱 Job queued for background swipe application: ${job.company} - ${job.title}`);
    
    // Automatically trigger background worker processing loop
    this.processQueueInBackground();
  }

  public static getQueueLength(): number {
    return this.queue.length;
  }

  private static async processQueueInBackground(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      console.log(`[SwipeMode] 🚀 Launching background Playwright browser for: ${job.company} - ${job.title}...`);

      let page;
      let context;
      try {
        const browserObj = await BrowserFactory.createPage(config.headless);
        page = browserObj.page;
        context = browserObj.context;

        const result: ApplicationResult = await AgentCore.processApplication(page, job, 'swipe', '000000000000000000000000');
        console.log(`[SwipeMode] ✅ Application finished for ${job.company}: ${result.status.toUpperCase()} (${result.fieldsFilledCount} fields filled)`);
      } catch (err: any) {
        console.error(`[SwipeMode] ❌ Background application execution failed for ${job.company}: ${err.message}`);
      } finally {
        if (context) await context.close().catch(() => {});
      }
    }

    this.isProcessing = false;
  }
}
