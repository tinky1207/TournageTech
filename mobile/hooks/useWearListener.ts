// hooks/useWearListener.tsx
import { useEffect } from 'react';
import { watchEvents } from 'react-native-wear-connectivity';  // Correct import

export const useWearListener = (onDataReceived: (message: unknown) => void) => {
  useEffect(() => {
    const unsubscribe = watchEvents.on('message', (message: unknown) => {
      console.log('Received from watch:', message);
      onDataReceived(message);
    });

    return () => unsubscribe();
  }, [onDataReceived]);
};