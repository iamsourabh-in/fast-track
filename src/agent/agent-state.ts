export interface AgentState {
  status: 'idle' | 'scraping' | 'navigating' | 'scanning' | 'filling' | 'submitting' | 'completed' | 'failed';
  activeStep: number; // 1 to 5
  stepName: string;
  currentJobTitle?: string;
  currentCompany?: string;
  currentUrl?: string;
  progressPercent: number;
  fieldsFilledCount: number;
  totalFieldsCount: number;
  activeProvider: string;
  activeMode: string;
  lastUpdated: string;
}

export class AgentStateTracker {
  private static state: AgentState = {
    status: 'idle',
    activeStep: 0,
    stepName: 'Ready for Task',
    progressPercent: 0,
    fieldsFilledCount: 0,
    totalFieldsCount: 0,
    activeProvider: 'gemini',
    activeMode: 'autonomous',
    lastUpdated: new Date().toISOString(),
  };

  public static updateState(partial: Partial<AgentState>): AgentState {
    this.state = {
      ...this.state,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };
    return this.state;
  }

  public static getState(): AgentState {
    return this.state;
  }
}
