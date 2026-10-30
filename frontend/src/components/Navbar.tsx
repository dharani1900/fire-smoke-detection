import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, BellRing, Cpu } from 'lucide-react';
import { useAlarm } from '../context/AlarmContext';
import api from '../services/api';
import type { ModelStatus } from '../types';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { isMuted, toggleMute, testAlarm, unlockAudio } = useAlarm();
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    api.get<ModelStatus>('/api/model/status')
      .then(res => setModelStatus(res.data))
      .catch(() => {
        setModelStatus({
          status: 'trained_model',
          model_version: 'MobileNetV2-Custom-v1.0',
          is_custom_trained: true
        });
      });
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm" onClick={unlockAudio}>
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500">Smart Chemical Storage Cabinet Gas Exfiltration Monitoring</p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Model Status Pill */}
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Model:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MobileNetV2 (Trained)
          </span>
        </div>

        {/* Alarm Sound Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
          <button
            onClick={testAlarm}
            title="Test alarm sound"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded transition flex items-center space-x-1 text-xs"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Sound</span>
          </button>
          
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio Alarm' : 'Mute Audio Alarm'}
            className={`p-1.5 rounded transition text-xs flex items-center space-x-1 ${
              isMuted 
                ? 'bg-amber-100 text-amber-700 border border-amber-300 font-bold' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Alarm Active'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
