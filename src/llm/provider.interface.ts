export interface LLMAnswerOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  
  /**
   * Generates a text answer given a prompt and system context.
   */
  generateAnswer(prompt: string, options?: LLMAnswerOptions): Promise<string>;

  /**
   * Generates structured JSON output adhering to a given schema or expectation.
   */
  generateStructuredOutput<T>(prompt: string, systemPrompt?: string): Promise<T>;
}
