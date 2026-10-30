import React, { useState } from 'react';
import { Settings, Volume2, BellRing, Sliders, CheckCircle2 } from 'lucide-react';
import { useAlarm } from '../context/AlarmContext';

export const SettingsPage: React.FC = () => {
  const { isMuted, toggleMute, testAlarm } = useAlarm();
  const [alarmVolume, setAlarmVolume] = useState<number>(80);
  const [autoStartAlarm, setAutoStartAlarm] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="bg-slate-900 text-white p-2.5 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Preferences & Alarm Settings</h1>
          <p className="text-xs text-slate-500">Configure Web Audio alarm alerts, volume, and simulation overlays</p>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System settings updated successfully!</span>
        </div>
      )}

      {/* Alarm Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Volume2 className="w-4 h-4 text-blue-600" />
          <span>Browser Audio Alarm Configuration</span>
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Master Alarm Mute State</p>
              <p className="text-slate-500">Silence repeating browser alert tones when hazard is predicted</p>
            </div>
            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                isMuted ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {isMuted ? 'Muted (Silent)' : 'Unmuted (Active)'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Auto-Trigger Alarm on Hazard Alert</p>
              <p className="text-slate-500">Automatically activate audio siren immediately when model outputs hazard alert</p>
            </div>
            <input
              type="checkbox"
              checked={autoStartAlarm}
              onChange={(e) => setAutoStartAlarm(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="space-y-2 py-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Alarm Synthesizer Volume Level</span>
              <span>{alarmVolume}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={alarmVolume}
              onChange={(e) => setAlarmVolume(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={testAlarm}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-lg border border-slate-300 transition flex items-center space-x-2"
            >
              <BellRing className="w-4 h-4 text-blue-600" />
              <span>Test Browser Siren Pulse Tone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Overlay Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>Visualization Overlay Preferences</span>
        </h2>

        <div className="text-xs text-slate-600 space-y-2">
          <p>
            The visualization generator uses OpenCV and Pillow to overlay semi-transparent multi-colored attention heatmaps based on Grad-CAM activation maps.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
            Disclaimer Banner Stamp: ENABLED (Always burned into artifact output)
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
