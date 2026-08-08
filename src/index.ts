import { initDatabase } from './memory/db.js';
import { startDashboardServer } from './web/server.js';
import { LLMFactory } from './llm/llm.factory.js';
import { config, LLMProviderType, ApplyModeType } from './config/env.js';
import { AutonomousModeHandler } from './modes/autonomous.mode.js';
import { StealthModeHandler } from './modes/stealth.mode.js';
import { CopilotModeHandler } from './modes/copilot.mode.js';
import { BrowserFactory } from './browser/browser.factory.js';

// Parse command line flags
const args = process.argv.slice(2);
args.forEach((arg) => {
  if (arg.startsWith('--mode=')) {
    config.mode = arg.split('=')[1] as ApplyModeType;
  }
  if (arg.startsWith('--provider=')) {
    config.provider = arg.split('=')[1] as LLMProviderType;
  }
  if (arg.startsWith('--port=')) {
    config.port = parseInt(arg.split('=')[1], 10);
  }
});

async function bootstrap() {
  console.log(`
  =============================================================
  🚀 FastApply - Autonomous AI Job Application Agent
  =============================================================
  • Selected LLM Provider: [${config.provider.toUpperCase()}]
  • Selected Operating Mode: [${config.mode.toUpperCase()}]
  • Daily Cap Target: [${config.maxDailyApplications} jobs/day]
  • Database Location: [${config.dbPath}]
  =============================================================
  `);

  // 1. Initialize SQLite Database Schema & Seed Data
  initDatabase();

  // 2. Initialize LLM Provider Factory
  const llm = LLMFactory.getProvider(config.provider);
  console.log(`[Main] Active LLM Provider adapter loaded: ${llm.name}`);

  // 3. Launch FastApply Web Dashboard & REST APIs
  startDashboardServer(config.port);

  // 4. Sample test job targets for demonstration / immediate testing
  const sampleJobs = [
    {
      company: 'Acme AI Systems',
      title: 'Senior AI Automation Engineer',
      location: 'San Francisco, CA',
      url: 'https://example.com/careers/acme-ai-engineer',
    },
    {
      company: 'CloudTech Corp',
      title: 'Staff TypeScript Developer',
      location: 'Remote',
      url: 'https://example.com/careers/cloudtech-ts-dev',
    },
  ];

  console.log(`\n[Main] FastApply Agent active! Dashboard available at http://localhost:${config.port}`);
  console.log(`[Main] To process applications live, swipe on the Web UI or run batch scripts.\n`);
}

bootstrap().catch((err) => {
  console.error('[Fatal Error] Failed to start FastApply:', err);
  process.exit(1);
});
