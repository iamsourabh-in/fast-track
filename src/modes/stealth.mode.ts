import { Page } from 'playwright';
import { AgentCore, ApplicationJobTarget, ApplicationResult } from '../agent/agent.core.js';
import { StealthUtils } from '../browser/stealth.utils.js';

export class StealthModeHandler {
  public static async run(page: Page, jobs: ApplicationJobTarget[]): Promise<ApplicationResult[]> {
    console.log(`[StealthMode] 🕵️ Starting Stealth mode execution for ${jobs.length} jobs with randomized evasion delays.`);
    const results: ApplicationResult[] = [];

    for (const job of jobs) {
      // Extended random human break between applications (2 to 5 seconds for simulation)
      await StealthUtils.randomDelay(2000, 5000);
      const res = await AgentCore.processApplication(page, job, 'stealth');
      results.push(res);
    }

    return results;
  }
}
