import React from 'react';
import { Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-2 flex items-center justify-between text-xs shadow-sm">
      <div className="flex items-center space-x-2 max-w-5xl">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Scientific Limitation Disclaimer:</strong> Standard optical RGB cameras screen for visible flame and smoke hazards; they cannot detect physical colorless chemical vapors inside closed storage cabinets. This software generates AI visual simulations & attention heatmaps for safety training and risk estimation.
        </span>
      </div>
      <span className="bg-amber-900/60 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-700/50 uppercase tracking-wider shrink-0 ml-4">
        MobileNetV2 Visual AI
      </span>
    </div>
  );
};
