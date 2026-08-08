import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export type LLMProviderType = 'ollama' | 'openai' | 'gemini';
export type ApplyModeType = 'copilot' | 'autonomous' | 'stealth' | 'swipe';

export interface AppConfig {
  provider: LLMProviderType;
  mode: ApplyModeType;
  geminiApiKey: string;
  openaiApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  maxDailyApplications: number;
  headless: boolean;
  port: number;
  dbPath: string;
}

export const config: AppConfig = {
  provider: (process.env.LLM_PROVIDER as LLMProviderType) || 'ollama',
  mode: (process.env.APPLY_MODE as ApplyModeType) || 'autonomous',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  maxDailyApplications: parseInt(process.env.MAX_DAILY_APPLICATIONS || '250', 10),
  headless: process.env.HEADLESS === 'true' || process.env.HEADLESS === '1',
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: path.resolve(process.cwd(), 'data', 'fastapply.db'),
};
