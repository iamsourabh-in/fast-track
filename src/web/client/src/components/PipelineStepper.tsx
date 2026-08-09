import React from 'react';

interface PipelineStepperProps {
  agentState: {
    activeStep: number;
    stepName: string;
    progressPercent: number;
    currentJobTitle: string;
    currentCompany: string;
    currentUrl: string;
  };
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ agentState }) => {
  const steps = [
    'Discovery & Scrape',
    'DOM Field Scan',
    'LLM & Q&A Memory',
    'Stealth Auto Fill',
    'Submit & Verify',
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(15, 20, 32, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1rem 1.5rem',
      gap: '0.5rem',
      overflowX: 'auto'
    }}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = agentState.activeStep === stepNum;
        const isCompleted = agentState.activeStep > stepNum;

        let stepColor = '#9ca3af';
        let opacity = 0.5;
        if (isCompleted) {
          stepColor = '#10b981';
          opacity = 0.9;
        } else if (isActive) {
          stepColor = '#60a5fa';
          opacity = 1.0;
        }

        return (
          <React.Fragment key={step}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: stepColor,
              opacity,
              transform: isActive ? 'scale(1.05)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isActive ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'white',
                boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
              }}>
                {stepNum}
              </div>
              <span>{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>➔</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
