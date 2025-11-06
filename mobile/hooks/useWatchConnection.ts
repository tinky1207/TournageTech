// hooks/useWatchConnection.ts (updated)
import { useState } from 'react';

export function useWatchConnection() {
  const [platform, setPlatform] = useState<'apple' | 'android' | null>(null);
  const [connected, setConnected] = useState(false);
  const [watchName, setWatchName] = useState('');
  const [watchSide, setWatchSide] = useState<'left' | 'right' | null>(null);
  const [initialSensors, setInitialSensors] = useState<any>(null);

  const resetInitial = () => {
    setInitialSensors(null);
    setWatchSide(null);
  };

  const initialized = !!initialSensors;

  return {
    platform,
    setPlatform,
    connected,
    setConnected,
    watchName,
    setWatchName,
    watchSide,
    setWatchSide,
    initialSensors,
    setInitialSensors,
    resetInitial,
    initialized,
  };
}