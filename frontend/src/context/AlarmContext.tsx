import React, { createContext, useContext, useState } from 'react';
import { audioAlarm } from '../utils/audioAlarm';

interface AlarmContextType {
  isAlarmActive: boolean;
  isMuted: boolean;
  triggerAlarm: () => void;
  stopAlarm: () => void;
  testAlarm: () => void;
  toggleMute: () => void;
  unlockAudio: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const triggerAlarm = () => {
    setIsAlarmActive(true);
    if (!isMuted) {
      audioAlarm.startAlarm();
    }
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    audioAlarm.stopAlarm();
  };

  const testAlarm = () => {
    audioAlarm.testAlarm();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioAlarm.setMuted(newMuted);
    if (newMuted) {
      stopAlarm();
    }
  };

  const unlockAudio = () => {
    audioAlarm.unlockAudio();
  };

  return (
    <AlarmContext.Provider value={{
      isAlarmActive,
      isMuted,
      triggerAlarm,
      stopAlarm,
      testAlarm,
      toggleMute,
      unlockAudio
    }}>
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within an AlarmProvider');
  }
  return context;
};
