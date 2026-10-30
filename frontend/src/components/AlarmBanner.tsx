import React from 'react';
import { AlertTriangle, Volume2, VolumeX, BellOff } from 'lucide-react';
import { useAlarm } from '../context/AlarmContext';

export const AlarmBanner: React.FC = () => {
  const { isAlarmActive, isMuted, stopAlarm, toggleMute, testAlarm } = useAlarm();

  if (!isAlarmActive) return null;

  return (
    <div className="bg-red-600 text-white px-6 py-3 border-b-2 border-red-800 shadow-xl flex flex-wrap items-center justify-between animate-pulse-danger z-50">
      <div className="flex items-center space-x-3">
        <div className="bg-white/20 p-2 rounded-full animate-ping">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-wide uppercase">HAZARD CONDITION DETECTED!</h4>
          <p className="text-xs text-red-100">
            Browser alarm active. AI model predicts active combustion fire or smoke hazard.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 mt-2 sm:mt-0">
        <button
          onClick={testAlarm}
          className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded-lg border border-red-400 font-semibold transition"
        >
          Test Tone
        </button>

        <button
          onClick={toggleMute}
          className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded-lg border border-red-400 font-semibold transition flex items-center space-x-1"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={stopAlarm}
          className="bg-white text-red-700 hover:bg-red-50 text-xs px-4 py-1.5 rounded-lg font-bold shadow-md transition flex items-center space-x-1"
        >
          <BellOff className="w-3.5 h-3.5" />
          <span>STOP ALARM</span>
        </button>
      </div>
    </div>
  );
};
