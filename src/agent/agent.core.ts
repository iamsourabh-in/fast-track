import { Page } from 'playwright';
import { LLMFactory } from '../llm/llm.factory.js';
import { QAMemoryEngine } from '../memory/qa-memory.js';
import { JobTrackerEngine } from '../memory/job-tracker.js';
import { FormParser, FormFieldDescriptor } from '../browser/form-parser.js';
import { StealthUtils } from '../browser/stealth.utils.js';
import { SYSTEM_PROMPT_JOB_QA } from './prompts.js';
import { ApplyModeType } from '../config/env.js';
import { AgentStateTracker } from './agent-state.js';

export interface ApplicationJobTarget {
  company: string;
  title: string;
  location?: string;
  url: string;
}

export interface ApplicationResult {
  job: ApplicationJobTarget;
  status: 'applied' | 'skipped' | 'failed';
  mode: ApplyModeType;
  fieldsFilledCount: number;
  memoryHitsCount: number;
  llmCallsCount: number;
  durationMs: number;
  notes?: string;
}

export class AgentCore {
  /**
   * Process a single job application end-to-end.
   */
  public static async processApplication(
    page: Page,
    job: ApplicationJobTarget,
    mode: ApplyModeType,
    onUserReviewNeeded?: (job: ApplicationJobTarget, fields: FormFieldDescriptor[]) => Promise<boolean>
  ): Promise<ApplicationResult> {
    const startTime = Date.now();
    let fieldsFilledCount = 0;
    let memoryHitsCount = 0;
    let llmCallsCount = 0;

    console.log(`[AgentCore] Starting job application: ${job.title} at ${job.company} (${mode.toUpperCase()} mode)`);

    AgentStateTracker.updateState({
      status: 'navigating',
      activeStep: 1,
      stepName: '1. Navigating to Job Page',
      currentJobTitle: job.title,
      currentCompany: job.company,
      currentUrl: job.url,
      progressPercent: 20,
      fieldsFilledCount: 0,
      totalFieldsCount: 0,
    });

    // 1. Deduplication check
    if (JobTrackerEngine.isAlreadyProcessed(job.company, job.title, job.url)) {
      console.log(`[AgentCore] ⏩ Skipping duplicate job: ${job.company} - ${job.title}`);
      AgentStateTracker.updateState({ status: 'completed', activeStep: 5, stepName: 'Completed (Skipped Duplicate)', progressPercent: 100 });
      const record = JobTrackerEngine.recordJob({
        company: job.company,
        title: job.title,
        location: job.location,
        jobUrl: job.url,
        applyMode: mode,
        status: 'skipped',
        notes: 'Duplicate detected by JobTrackerEngine',
      });
      return {
        job,
        status: 'skipped',
        mode,
        fieldsFilledCount: 0,
        memoryHitsCount: 0,
        llmCallsCount: 0,
        durationMs: Date.now() - startTime,
        notes: 'Job already processed',
      };
    }

    try {
      // 2. Navigate to job application URL
      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await StealthUtils.randomDelay(1000, 2500);

      AgentStateTracker.updateState({ status: 'scanning', activeStep: 2, stepName: '2. Scanning DOM Form Fields', progressPercent: 40 });

      // Check if page requires clicking "Apply Now" / "Easy Apply" to open modal or form
      try {
        const applyBtn = await page.$('button.jobs-apply-button, button[aria-label*="Apply"], a.postings-btn, button:has-text("Apply"), a:has-text("Apply Now")');
        if (applyBtn) {
          console.log('[AgentCore] 🎯 Clicked "Apply Now" / "Easy Apply" button to reveal application form.');
          await applyBtn.click({ timeout: 5000 }).catch(() => {});
          await StealthUtils.randomDelay(1500, 3000);
        }
      } catch (err: any) {
        console.log(`[AgentCore] No popup apply button required (${err.message}). Proceeding directly with DOM scan.`);
      }

      // 3. Scan DOM for form fields
      const fields = await FormParser.extractFormFields(page);
      console.log(`[AgentCore] Discovered ${fields.length} form input fields on ${job.company}.`);

      AgentStateTracker.updateState({
        status: 'filling',
        activeStep: 3,
        stepName: '3. Q&A Memory Lookup & Field Filling',
        totalFieldsCount: fields.length,
        progressPercent: 60,
      });

      // 4. Fill form fields
      const activeLLM = LLMFactory.getProvider();

      for (const field of fields) {
        if (field.type === 'file') {
          // File upload input (Resume)
          console.log(`[AgentCore] Processing file upload input: ${field.label}`);
          continue;
        }

        // Memory cache lookup
        const cachedQA = QAMemoryEngine.findAnswer(field.label);
        let answerText = '';

        if (cachedQA) {
          memoryHitsCount++;
          answerText = cachedQA.answer;
          console.log(`[AgentCore] 🧠 Memory Hit: "${field.label}" => "${answerText}"`);
        } else {
          // LLM call
          llmCallsCount++;
          const prompt = `Form Field Question: "${field.label}"\nField Options: ${field.options ? field.options.join(', ') : 'N/A'}\nPlaceholder: ${field.placeholder || 'N/A'}`;
          answerText = await activeLLM.generateAnswer(prompt, { systemPrompt: SYSTEM_PROMPT_JOB_QA });
          
          // Save to QA Memory Engine
          QAMemoryEngine.saveAnswer(field.label, answerText, 0.95);
          console.log(`[AgentCore] 🤖 LLM Answer Generated (${activeLLM.name}): "${field.label}" => "${answerText}"`);
        }

        // Fill form field visually with stealth delays
        try {
          if (field.type === 'select' && field.options && field.options.length > 0) {
            // Select matching option
            const matchingOpt = field.options.find(
              (opt) => opt.toLowerCase().includes(answerText.toLowerCase()) || answerText.toLowerCase().includes(opt.toLowerCase())
            ) || field.options[1] || field.options[0];
            await page.selectOption(field.selector, { label: matchingOpt }).catch(() => {});
          } else if (field.type === 'radio' || field.type === 'checkbox') {
            await page.check(field.selector).catch(() => {});
          } else {
            await StealthUtils.typeLikeHuman(page, field.selector, answerText);
          }
          fieldsFilledCount++;
        } catch (e: any) {
          console.warn(`[AgentCore] Failed to fill field ${field.label}: ${e.message}`);
        }
      }

      // 5. Handle Operating Mode specific action
      let finalStatus: 'applied' | 'skipped' = 'applied';

      if (mode === 'copilot' && onUserReviewNeeded) {
        console.log('[AgentCore] Copilot Mode: Waiting for user confirmation before submit...');
        const userApproved = await onUserReviewNeeded(job, fields);
        if (!userApproved) {
          finalStatus = 'skipped';
        }
      }

      if (finalStatus === 'applied') {
        const submitSelector = await FormParser.findSubmitButtonSelector(page);
        if (submitSelector && mode !== 'copilot') {
          console.log(`[AgentCore] Submitting application via button: ${submitSelector}`);
          await page.click(submitSelector).catch(() => {});
          await StealthUtils.randomDelay(2000, 4000);
        }
      }

      // Record in JobTrackerEngine
      JobTrackerEngine.recordJob({
        company: job.company,
        title: job.title,
        location: job.location,
        jobUrl: job.url,
        applyMode: mode,
        status: finalStatus,
        notes: `Successfully completed with ${fieldsFilledCount} fields filled (${memoryHitsCount} cache hits, ${llmCallsCount} LLM calls)`,
      });

      return {
        job,
        status: finalStatus,
        mode,
        fieldsFilledCount,
        memoryHitsCount,
        llmCallsCount,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.error(`[AgentCore] Error processing job application: ${err.message}`);
      JobTrackerEngine.recordJob({
        company: job.company,
        title: job.title,
        location: job.location,
        jobUrl: job.url,
        applyMode: mode,
        status: 'failed',
        notes: err.message,
      });

      return {
        job,
        status: 'failed',
        mode,
        fieldsFilledCount,
        memoryHitsCount,
        llmCallsCount,
        durationMs: Date.now() - startTime,
        notes: err.message,
      };
    }
  }
}
