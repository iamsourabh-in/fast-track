import { Page } from 'playwright';
import { AgentCore, ApplicationJobTarget, ApplicationResult } from '../agent/agent.core.js';
import { JobTrackerEngine } from '../memory/job-tracker.js';
import { config } from '../config/env.js';

export class AutonomousModeHandler {
  public static async run(page: Page, jobs: ApplicationJobTarget[]): Promise<ApplicationResult[]> {
    console.log(`[AutonomousMode] ⚡ Starting Autonomous execution for ${jobs.length} jobs (Daily Cap: ${config.maxDailyApplications}).`);
    const results: ApplicationResult[] = [];

    for (const job of jobs) {
      const dailyApplied = await JobTrackerEngine.getDailyAppliedCount('000000000000000000000000');
      if (dailyApplied >= config.maxDailyApplications) {
        console.log(`[AutonomousMode] Daily limit of ${config.maxDailyApplications} applications reached. Stopping batch.`);
        break;
      }

      const res = await AgentCore.processApplication(page, job, 'autonomous', '000000000000000000000000');
      results.push(res);
    }

    return results;
  }
}
