import { Page } from 'playwright';
import { AgentCore, ApplicationJobTarget, ApplicationResult } from '../agent/agent.core.js';
import { FormFieldDescriptor } from '../browser/form-parser.js';

export class CopilotModeHandler {
  public static async run(page: Page, jobs: ApplicationJobTarget[]): Promise<ApplicationResult[]> {
    console.log(`[CopilotMode] Starting Copilot mode for ${jobs.length} jobs.`);
    const results: ApplicationResult[] = [];

    for (const job of jobs) {
      const res = await AgentCore.processApplication(
        page,
        job,
        'copilot',
        async (targetJob: ApplicationJobTarget, fields: FormFieldDescriptor[]) => {
          console.log(`[CopilotMode] 🤝 Pre-filled ${fields.length} form inputs for ${targetJob.company}. Auto-confirming submit for user.`);
          return true;
        }
      );
      results.push(res);
    }

    return results;
  }
}
