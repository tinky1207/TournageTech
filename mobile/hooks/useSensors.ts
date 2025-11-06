// hooks/useSensors.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { sendMessage as appleSendMessage, watchEvents as appleWatchEvents } from 'react-native-watch-connectivity'; // For iOS
import { sendMessage, watchEvents } from 'react-native-wear-connectivity'; // For Android
import { BleManager, Device } from 'react-native-ble-plx'; // For BLE exploration

const manager = new BleManager(); // BLE manager instance for exploration

const SENSOR_FETCH_TASK = 'sensor-fetch';

TaskManager.defineTask(SENSOR_FETCH_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
  // Placeholder for background sensor update; actual updates are event-driven via watch connectivity.
  // This task can be used to periodically ping the watch if needed.
  console.log('Background sensor fetch triggered');
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

type SensorType = 'accel' | 'gyro' | 'heart' | 'calorie' | 'gps' | 'steps';
type SensorData = Record<SensorType, any>;

// Type guards for validation (made more robust with isFinite checks)
const isValidAccelOrGyro = (data: any): boolean => {
  return typeof data === 'object' && data !== null &&
         typeof data.x === 'number' && Number.isFinite(data.x) &&
         typeof data.y === 'number' && Number.isFinite(data.y) &&
         typeof data.z === 'number' && Number.isFinite(data.z);
};

const isValidHeart = (data: any): boolean => {
  return typeof data === 'number' && Number.isFinite(data) && data > 0 && data < 250;
};

const isValidCalorie = (data: any): boolean => {
  return typeof data === 'number' && Number.isFinite(data) && data >= 0;
};

const isValidGps = (data: any): boolean => {
  return typeof data === 'object' && data !== null &&
         typeof data.latitude === 'number' && Number.isFinite(data.latitude) &&
         data.latitude >= -90 && data.latitude <= 90 &&
         typeof data.longitude === 'number' && Number.isFinite(data.longitude) &&
         data.longitude >= -180 && data.longitude <= 180;
};

const isValidSteps = (data: any): boolean => {
  return typeof data === 'number' && Number.isFinite(data) && data >= 0;
};

const validators: Record<SensorType, (data: any) => boolean> = {
  accel: isValidAccelOrGyro,
  gyro: isValidAccelOrGyro,
  heart: isValidHeart,
  calorie: isValidCalorie,
  gps: isValidGps,
  steps: isValidSteps,
};

export function useSensors() {
  const [latestSensors, setLatestSensors] = useState<SensorData>({
    accel: null,
    gyro: null,
    heart: null,
    calorie: null,
    gps: null,
    steps: null,
  });
  const [history, setHistory] = useState<{ timestamp: string; sensors: Partial<SensorData> }[]>([]);
  const [sensorErrors, setSensorErrors] = useState<string[]>([]);
  const [fusedOrientation, setFusedOrientation] = useState<{ roll: number; pitch: number; yaw: number } | null>(null);

  // Load persisted data on mount (concise with try-catch)
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [storedLatest, storedHistory] = await Promise.all([
          AsyncStorage.getItem('latestSensors'),
          AsyncStorage.getItem('sensorHistory'),
        ]);

        if (storedLatest) {
          const parsedData: SensorData = JSON.parse(storedLatest);
          const validatedData: Partial<SensorData> = {};
          (Object.keys(parsedData) as SensorType[]).forEach((key) => {
            const value = parsedData[key];
            if (value !== null && validators[key](value)) {
              validatedData[key] = value;
            } else if (value !== null) {
              console.warn(`Invalid persisted data for ${key}:`, value);
            }
          });
          setLatestSensors((prev) => ({ ...prev, ...validatedData }));
        }

        if (storedHistory) {
          const parsedHistory: { timestamp: string; sensors: Partial<SensorData> }[] = JSON.parse(storedHistory);
          const validatedHistory = parsedHistory.filter((entry) => {
            return typeof entry.timestamp === 'string' && entry.sensors &&
                   Object.keys(entry.sensors).every((k) => validators[k as SensorType](entry.sensors[k as SensorType]));
          });
          setHistory(validatedHistory);
        }
      } catch (error) {
        console.error('Failed to load persisted sensor data:', error);
        setSensorErrors((prev) => [...prev, 'Failed to load persisted data']);
      }
    };

    loadPersistedData();

    // Setup background fetch for connectivity maintenance
    const initBackgroundFetch = async () => {
      try {
        const status = await BackgroundFetch.getStatusAsync();
        if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
          await BackgroundFetch.registerTaskAsync(SENSOR_FETCH_TASK, {
            minimumInterval: 60, // 1 minute
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log('Background fetch registered');
        }
      } catch (error) {
        console.error('Failed to setup background fetch:', error);
        setSensorErrors((prev) => [...prev, 'Failed to setup background fetch']);
      }
    };
    initBackgroundFetch();

    return () => {
      BackgroundFetch.unregisterTaskAsync(SENSOR_FETCH_TASK).catch(console.error);
    };
  }, []);

  // Persist data when it changes (concise combined effect)
  useEffect(() => {
    const persistData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('latestSensors', JSON.stringify(latestSensors)),
          AsyncStorage.setItem('sensorHistory', JSON.stringify(history)),
        ]);
      } catch (error) {
        console.error('Failed to persist sensor data:', error);
        setSensorErrors((prev) => [...prev, 'Failed to persist data']);
      }
    };

    persistData();
  }, [latestSensors, history]);

  const handleSensorData = (message: any) => {
    console.log('Received sensor data:', message); // For Bluetooth debugging

    const updatedData: Partial<SensorData> = {};
    const newErrors: string[] = [];
    (Object.keys(latestSensors) as SensorType[]).forEach((key) => {
      const rawData = message[key];
      if (rawData !== undefined) {
        if (validators[key](rawData)) {
          updatedData[key] = rawData;
        } else {
          const errorMsg = `Invalid data received for ${key}: ${JSON.stringify(rawData)}`;
          console.warn(errorMsg);
          newErrors.push(errorMsg);
        }
      }
    });

    if (Object.keys(updatedData).length > 0) {
      setLatestSensors((prev) => ({ ...prev, ...updatedData }));
      setHistory((prev) => {
        let newPrev = prev;
        if (prev.length > 1000) {
          newPrev = prev.slice(-1000);
        }
        return [...newPrev, { timestamp: new Date().toISOString(), sensors: updatedData }];
      });
      // Simple complementary filter for sensor fusion (accel + gyro)
      if (updatedData.accel && updatedData.gyro) {
        const alpha = 0.98;
        const dt = 0.02; // Assume 50Hz update rate
        const accel = updatedData.accel;
        const gyro = updatedData.gyro;
        const roll = Math.atan2(accel.y, accel.z);
        const pitch = Math.atan2(-accel.x, Math.sqrt(accel.y * accel.y + accel.z * accel.z));
        const fusedRoll = alpha * (fusedOrientation?.roll || 0 + gyro.x * dt) + (1 - alpha) * roll;
        const fusedPitch = alpha * (fusedOrientation?.pitch || 0 + gyro.y * dt) + (1 - alpha) * pitch;
        const fusedYaw = (fusedOrientation?.yaw || 0) + gyro.z * dt; // Simple integration for yaw
        setFusedOrientation({ roll: fusedRoll, pitch: fusedPitch, yaw: fusedYaw });
      }
    }

    if (newErrors.length > 0) {
      setSensorErrors((prev) => [...prev, ...newErrors]);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (Platform.OS === 'ios') {
      unsubscribe = appleWatchEvents.on('message', handleSensorData) as () => void;
    } else {
      unsubscribe = watchEvents.on('message', handleSensorData) as () => void;
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const startSensors = () => {
    try {
      const msg = { command: 'startSensors' };
      const sendFn = Platform.OS === 'ios' ? appleSendMessage : sendMessage;
      sendFn(msg, (reply) => console.log('Reply from watch:', reply), (error) => {
        if (error) throw new Error(`Failed to start sensors on ${Platform.OS}: ${error}`);
      });
    } catch (error) {
      console.error(error);
      setSensorErrors((prev) => [...prev, (error as Error).message]);
    }
  };

  const stopSensors = () => {
    try {
      const msg = { command: 'stopSensors' };
      const sendFn = Platform.OS === 'ios' ? appleSendMessage : sendMessage;
      sendFn(msg, (reply) => console.log('Reply from watch:', reply), (error) => {
        if (error) throw new Error(`Failed to stop sensors on ${Platform.OS}: ${error}`);
      });
    } catch (error) {
      console.error(error);
      setSensorErrors((prev) => [...prev, (error as Error).message]);
    }
  };

  const csvEscape = (str: string) => str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;

  const exportData = async (): Promise<string | null> => {
    try {
      const csvHeaders = ['Timestamp', 'Sensor', 'X/Value/Latitude', 'Y/Longitude', 'Z'];
      const csvRows: string[][] = [];

      history.forEach((entry) => {
        (Object.keys(entry.sensors) as SensorType[]).forEach((key) => {
          const value = entry.sensors[key];
          let row: string[] = [entry.timestamp, key];
          if (['accel', 'gyro'].includes(key) && typeof value === 'object') {
            row = row.concat([value.x?.toString() || '', value.y?.toString() || '', value.z?.toString() || '']);
          } else if (key === 'gps' && typeof value === 'object') {
            row = row.concat([value.latitude?.toString() || '', value.longitude?.toString() || '', '']);
          } else if (['heart', 'calorie', 'steps'].includes(key) && typeof value === 'number') {
            row = row.concat([value.toString(), '', '']);
          } else {
            row = row.concat([JSON.stringify(value), '', '']);
          }
          csvRows.push(row);
        });
      });

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map(csvEscape).join(',')).join('\n');

      const fileUri = `${FileSystem.documentDirectory}sensor_data.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Sensor Data as CSV' });
      return fileUri;
    } catch (error) {
      console.error('Failed to export data:', error);
      setSensorErrors((prev) => [...prev, 'Failed to export data']);
      return null;
    }
  };

  // BLE exploration example
  const exploreBLE = () => {
    manager.startDeviceScan(null, null, (error: Error | null, device: Device | null) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log('Discovered device:', device?.name);
      // Stop scanning after finding devices or as needed
    });
  };

  return { latestSensors, history, sensorErrors, startSensors, stopSensors, exportData, exploreBLE, fusedOrientation };

  // Real-time sensor visualization example (integrate in a component):
  // Import: import { LineChart } from 'react-native-chart-kit';
  // Usage: <LineChart data={{ labels: history.slice(-10).map(h => h.timestamp.slice(11,19)), datasets: [{ data: history.slice(-10).map(h => h.sensors.heart || 0) }] }} width={300} height={200} chartConfig={{...}} />
  // This provides real-time streaming visualization of sensor data like heart rate over time.
}