import { LLMProvider } from './provider.interface.js';
import { OllamaProvider } from './ollama.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { config, LLMProviderType } from '../config/env.js';

export class LLMFactory {
  private static instance: LLMProvider | null = null;
  private static currentProviderName: LLMProviderType = config.provider;

  public static getProvider(providerType?: LLMProviderType): LLMProvider {
    const target = providerType || this.currentProviderName;

    if (!this.instance || this.currentProviderName !== target) {
      this.currentProviderName = target;
      switch (target) {
        case 'gemini':
          this.instance = new GeminiProvider(config.geminiApiKey);
          break;
        case 'openai':
          this.instance = new OpenAIProvider(config.openaiApiKey);
          break;
        case 'ollama':
        default:
          this.instance = new OllamaProvider(config.ollamaBaseUrl, config.ollamaModel);
          break;
      }
      console.log(`[LLMFactory] Switched active LLM provider to: [${this.instance.name}]`);
    }

    return this.instance;
  }

  public static setProvider(providerType: LLMProviderType): LLMProvider {
    return this.getProvider(providerType);
  }

  public static getActiveProviderName(): LLMProviderType {
    return this.currentProviderName;
  }
}
