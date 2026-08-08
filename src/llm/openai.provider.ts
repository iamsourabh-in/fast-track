import OpenAI from 'openai';
import { LLMProvider, LLMAnswerOptions } from './provider.interface.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.model = model;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generateAnswer(prompt: string, options?: LLMAnswerOptions): Promise<string> {
    if (!this.client) {
      console.warn('[OpenAIProvider] No API key configured. Using heuristic fallback.');
      return this.fallbackAnswer(prompt);
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.2,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      console.warn(`[OpenAIProvider] API call failed: ${error.message}. Using fallback.`);
      return this.fallbackAnswer(prompt);
    }
  }

  async generateStructuredOutput<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nReturn JSON object response matching requested specification.`;
    const text = await this.generateAnswer(jsonPrompt, { systemPrompt });
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch {
      throw new Error(`Failed to parse OpenAI JSON output: ${text}`);
    }
  }

  private fallbackAnswer(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('experience')) return '5 years';
    if (lower.includes('visa')) return 'No';
    if (lower.includes('authorized')) return 'Yes';
    return 'Yes';
  }
}
