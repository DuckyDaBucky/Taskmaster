/**
 * ProcessingAnimation - Cool animated processing indicator
 * Shows animated stages: Reading → Processing → Analyzing → Creating
 */

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

interface ProcessingAnimationProps {
  isProcessing: boolean;
  onComplete?: () => void;
  className?: string;
}

interface Stage {
  label: string;
  icon: React.ReactNode;
  duration: number; // ms before moving to next stage
}

const stages: Stage[] = [
  { label: 'Reading document...', icon: <FileText className="animate-pulse" />, duration: 3000 },
  { label: 'Extracting content...', icon: <Loader2 className="animate-spin" />, duration: 4000 },
  { label: 'Analyzing with AI...', icon: <Brain className="animate-pulse" />, duration: 8000 },
  { label: 'Creating tasks...', icon: <Sparkles className="animate-bounce" />, duration: 3000 },
  { label: 'Complete!', icon: <CheckCircle />, duration: 1000 },
];

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ 
  isProcessing, 
  onComplete,
  className = '' 
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    // Progress through stages
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        const next = prev + 1;
        if (next >= stages.length) {
          clearInterval(stageInterval);
          onComplete?.();
          return prev;
        }
        return next;
      });
    }, stages[currentStage]?.duration || 3000);

    // Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const stageProgress = (currentStage / stages.length) * 100;
        const stageIncrement = (1 / stages.length) * 100 / (stages[currentStage]?.duration / 100);
        return Math.min(stageProgress + stageIncrement, 100);
      });
    }, 100);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [isProcessing, currentStage, onComplete]);

  if (!isProcessing) return null;

  const stage = stages[currentStage] || stages[0];

  return (
    <div className={`bg-card border border-border rounded-xl p-6 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          {stage.icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{stage.label}</h3>
          <p className="text-xs text-muted-foreground">Stage {currentStage + 1} of {stages.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between">
        {stages.slice(0, -1).map((s, i) => (
          <div 
            key={i}
            className={`flex flex-col items-center ${i <= currentStage ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
              i < currentStage ? 'bg-primary text-white' :
              i === currentStage ? 'bg-primary/20 text-primary border-2 border-primary' :
              'bg-secondary text-muted-foreground'
            }`}>
              {i < currentStage ? '✓' : i + 1}
            </div>
            <span className="text-xs truncate max-w-[60px] text-center hidden sm:block">
              {s.label.split('...')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingAnimation;
