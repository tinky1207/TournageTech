// hooks/useExercise.ts (updated) - Remove old listener, use useSensors
import { useEffect, useRef, useState } from 'react';
import { useSensors } from './useSensors';

export function useExercise() {
  const { latestSensors, startSensors, stopSensors } = useSensors();
  const [time, setTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<any[]>([]); // To store time-series data
  const timerRef = useRef<number | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    startSensors();
    // Start timer
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopSensors();
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Save data to records (placeholder - implement later)
    console.log('Saving data:', recordedData);
    // Clear for next session? Or keep until reset
  };

  const resetExercise = () => {
    setTime(0);
    setIsRecording(false);
    setRecordedData([]);
    // Stop sensors if running
    if (isRecording) {
      stopRecording();
    }
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordedData((prev) => [...prev, { timestamp: Date.now(), ...latestSensors }]);
      }, 1000); // Record snapshot every second, adjust as needed
      return () => clearInterval(interval);
    }
  }, [isRecording, latestSensors]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { time, isRecording, latestSensors, recordedData, startRecording, stopRecording, resetExercise };
}