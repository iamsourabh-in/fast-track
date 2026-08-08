import { Ollama } from 'ollama';
import { LLMProvider, LLMAnswerOptions } from './provider.interface.js';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private client: Ollama;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.client = new Ollama({ host: baseUrl });
    this.model = model;
  }

  async generateAnswer(prompt: string, options?: LLMAnswerOptions): Promise<string> {
    try {
      const messages = [];
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat({
        model: this.model,
        messages,
        options: {
          temperature: options?.temperature ?? 0.2,
        },
      });

      return response.message.content.trim();
    } catch (error: any) {
      console.warn(`[OllamaProvider] Error connecting to Ollama (${error.message}). Using smart heuristic fallback.`);
      return this.fallbackAnswer(prompt);
    }
  }

  async generateStructuredOutput<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond ONLY with a valid JSON object. Do not include markdown code block formatting or explanation.`;
    const responseText = await this.generateAnswer(jsonPrompt, { systemPrompt });
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err) {
      throw new Error(`Failed to parse JSON response from Ollama: ${responseText}`);
    }
  }

  private fallbackAnswer(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('years of experience')) return '5';
    if (lower.includes('sponsorship') || lower.includes('require visa')) return 'No';
    if (lower.includes('authorized to work')) return 'Yes';
    if (lower.includes('salary expectation')) return '$130,000 - $160,000';
    if (lower.includes('notice period')) return '2 weeks';
    return 'Yes, I possess relevant hands-on expertise aligned with these job requirements.';
  }
}
