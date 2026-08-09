import { connectDatabase } from './memory/mongo.js';
import { startDashboardServer } from './web/server.js';
import { LLMFactory } from './llm/llm.factory.js';
import { config, LLMProviderType, ApplyModeType } from './config/env.js';

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
  🚀 FastApply Pro — Autonomous AI Job Application Agent
  =============================================================
  • Selected LLM Provider: [${config.provider.toUpperCase()}]
  • Selected Operating Mode: [${config.mode.toUpperCase()}]
  • Daily Cap Target: [${config.maxDailyApplications} jobs/day]
  • Database: [MongoDB @ ${config.mongoUri}]
  =============================================================
  `);

  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Initialize LLM Provider Factory
  const llm = LLMFactory.getProvider(config.provider);
  console.log(`[Main] Active LLM Provider adapter loaded: ${llm.name}`);

  // 3. Launch FastApply Web Dashboard & REST APIs
  startDashboardServer(config.port);

  console.log(`\n[Main] FastApply Agent active! Dashboard available at http://localhost:${config.port}`);
  console.log(`[Main] To process applications live, swipe on the Web UI or run batch scripts.\n`);
}

bootstrap().catch((err) => {
  console.error('[Fatal Error] Failed to start FastApply:', err);
  process.exit(1);
});
