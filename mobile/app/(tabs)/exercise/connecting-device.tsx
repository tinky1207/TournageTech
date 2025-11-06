// app/(tabs)/exercise/connecting-device.tsx
import { useRouter } from 'expo-router';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Dimensions, Modal, ScrollView, Animated } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useWatchConnection } from '../../../hooks/useWatchConnection';
import { useSensors } from '../../../hooks/useSensors';
import WatchConnectivity from 'react-native-watch-connectivity'; // For iOS
import { sendMessage, watchEvents } from 'react-native-wear-connectivity'; // For Android
import { VictoryLine, VictoryChart, VictoryTheme, VictoryZoomContainer, VictoryVoronoiContainer, VictoryTooltip, VictoryScatter, VictoryAxis, VictoryLegend, VictoryCursorContainer, VictoryZoomVoronoiContainer } from 'victory-native';
import { PinchGestureHandler, State, PanGestureHandler } from 'react-native-gesture-handler';

export default function ConnectingDevice() {
  const router = useRouter();
  const { setPlatform, setConnected, setWatchName } = useWatchConnection();
  const { startSensors, latestSensors, history, exportData, exploreBLE, fusedOrientation } = useSensors();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [localWatchName, setLocalWatchName] = useState('');
  const platform = Platform.OS === 'ios' ? 'apple' : 'android';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<{ timestamp: string; sensors: any } | null>(null);
  const [heartDomain, setHeartDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [stepsDomain, setStepsDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [calorieDomain, setCalorieDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [latDomain, setLatDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [longDomain, setLongDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [accelDomain, setAccelDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [gyroDomain, setGyroDomain] = useState<{ x: [number, number]; y: [number, number] } | undefined>(undefined);
  const [heartScale, setHeartScale] = useState(1);
  const [heartLastScale, setHeartLastScale] = useState(1);
  const [stepsScale, setStepsScale] = useState(1);
  const [stepsLastScale, setStepsLastScale] = useState(1);
  const [calorieScale, setCalorieScale] = useState(1);
  const [calorieLastScale, setCalorieLastScale] = useState(1);
  const [latScale, setLatScale] = useState(1);
  const [latLastScale, setLatLastScale] = useState(1);
  const [longScale, setLongScale] = useState(1);
  const [longLastScale, setLongLastScale] = useState(1);
  const [accelScale, setAccelScale] = useState(1);
  const [accelLastScale, setAccelLastScale] = useState(1);
  const [gyroScale, setGyroScale] = useState(1);
  const [gyroLastScale, setGyroLastScale] = useState(1);

  const startConnect = async () => {
    setStatus('loading');
    try {
      let name: string;
      if (platform === 'apple') {
        name = await connectApple();
      } else {
        name = await connectAndroid();
      }
      setLocalWatchName(name);
      setStatus('success');
    } catch (error) {
      console.error('Connection failed:', error); // Enhanced debugging
      setStatus('fail');
      setTimeout(startConnect, 5000);
    }
  };

  const connectApple = async (): Promise<string> => {
    const isPaired = await WatchConnectivity.getIsPaired();
    if (!isPaired) {
      throw new Error('No paired Apple Watch');
    }
    const isInstalled = await WatchConnectivity.getIsWatchAppInstalled();
    if (!isInstalled) {
      throw new Error('Watch app not installed');
    }
    await new Promise((resolve, reject) => {
      WatchConnectivity.sendMessage({ command: 'connect' }, (reply) => {
        console.log('Watch reply:', reply); // Debugging
        resolve(reply);
      }, (error) => {
        reject(error);
      });
    });
    return 'Apple Watch';
  };

  const connectAndroid = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      sendMessage({ command: 'connect' }, (reply) => {
        console.log('Watch reply:', reply); // Debugging
        resolve('Wear OS Watch');
      }, (error) => {
        reject(error);
      });
    });
  };

  useEffect(() => {
    startConnect();
    exploreBLE(); // Explore BLE devices
  }, []);

  const handleConfirm = () => {
    if (status !== 'success') {
      Alert.alert('Connection Required', 'You must connect to the device first.');
      return;
    }
    setPlatform(platform);
    setWatchName(localWatchName);
    setConnected(true);
    startSensors();
    router.push('/exercise/initialization-setting');
  };

  const handleBack = () => {
    router.back();
  };

  const handleExport = async () => {
    const uri = await exportData();
    if (uri) {
      Alert.alert('Export Successful', `Data exported to ${uri}`);
    }
  };

  const handleDataPointClick = (chartType: string) => (data: { index: number; value: number; dataset: any; x: number; y: number; getColor: (opacity: number) => string }) => {
    const recentHistory = history.slice(-10);
    const entry = recentHistory[data.index];
    if (entry) {
      setSelectedEntry(entry);
      setIsModalVisible(true);
    } else {
      Alert.alert('Data Point', `Value: ${data.value}\nIndex: ${data.index}`);
    }
  };

  const onPinchGestureEvent = (setScale: (scale: number) => void, lastScale: number) => (event: any) => {
    setScale(lastScale * event.nativeEvent.scale);
  };

  const onPinchHandlerStateChange = (setLastScale: (scale: number) => void, scale: number) => (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastScale(scale);
    }
  };

  const onPanGestureEvent = (setDomain: (domain: { x: [number, number]; y: [number, number] }) => void) => (event: any) => {
    // Implement pan logic to adjust domain
  };

  const recentHistory = history.slice(-10).map((h: any, index: number) => ({ x: index, yHeart: h.sensors.heart || latestSensors.heart || 0, ySteps: h.sensors.steps || latestSensors.steps || 0, yCalorie: h.sensors.calorie || latestSensors.calorie || 0, yLat: h.sensors.gps?.latitude || latestSensors.gps?.latitude || 0, yLong: h.sensors.gps?.longitude || latestSensors.gps?.longitude || 0, yAccelX: h.sensors.accel?.x || latestSensors.accel?.x || 0, yAccelY: h.sensors.accel?.y || latestSensors.accel?.y || 0, yAccelZ: h.sensors.accel?.z || latestSensors.accel?.z || 0, yGyroX: h.sensors.gyro?.x || latestSensors.gyro?.x || 0, yGyroY: h.sensors.gyro?.y || latestSensors.gyro?.y || 0, yGyroZ: h.sensors.gyro?.z || latestSensors.gyro?.z || 0, timestamp: h.timestamp }));

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>Connecting device</Text>
      <Text style={styles.subtitle}>Please make sure you have connected your watch to your phone via Bluetooth</Text>

      {status === 'success' ? (
        <>
          <Image source={require('../../../assets/images/watch.png')} style={styles.watchImage} />
          <Text style={styles.successText}>Connection successful</Text>
          {history.length > 0 ? (
            <>
              <TouchableOpacity onPress={handleExport}>
                <Text>Export Data</Text>
              </TouchableOpacity>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setHeartScale, heartLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setHeartLastScale, heartScale)}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={heartDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `y: ${datum.yHeart}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[{ name: 'Heart Rate', symbol: { fill: "tomato" } }]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yHeart" />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="BPM"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setStepsScale, stepsLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setStepsLastScale, stepsScale)}
              >
                <Animated.View style={{ transform: [{ scale: stepsScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={stepsDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `y: ${datum.ySteps}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[{ name: 'Steps', symbol: { fill: "gold" } }]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="ySteps" />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Steps"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setCalorieScale, calorieLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setCalorieLastScale, calorieScale)}
              >
                <Animated.View style={{ transform: [{ scale: calorieScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={calorieDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `y: ${datum.yCalorie}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[{ name: 'Calories', symbol: { fill: "green" } }]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yCalorie" />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Kcal"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setLatScale, latLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setLatLastScale, latScale)}
              >
                <Animated.View style={{ transform: [{ scale: latScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={latDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `y: ${datum.yLat}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[{ name: 'Latitude', symbol: { fill: "blue" } }]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yLat" />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Latitude"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setLongScale, longLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setLongLastScale, longScale)}
              >
                <Animated.View style={{ transform: [{ scale: longScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={longDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `y: ${datum.yLong}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[{ name: 'Longitude', symbol: { fill: "purple" } }]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yLong" />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Longitude"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setAccelScale, accelLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setAccelLastScale, accelScale)}
              >
                <Animated.View style={{ transform: [{ scale: accelScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={accelDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `X: ${datum.yAccelX}, Y: ${datum.yAccelY}, Z: ${datum.yAccelZ}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[
                        { name: 'Accel X', symbol: { fill: 'red' } },
                        { name: 'Accel Y', symbol: { fill: 'green' } },
                        { name: 'Accel Z', symbol: { fill: 'blue' } }
                      ]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yAccelX" style={{ data: { stroke: 'red' } }} />
                    <VictoryLine data={recentHistory} x="x" y="yAccelY" style={{ data: { stroke: 'green' } }} />
                    <VictoryLine data={recentHistory} x="x" y="yAccelZ" style={{ data: { stroke: 'blue' } }} />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Acceleration"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent(setGyroScale, gyroLastScale)}
                onHandlerStateChange={onPinchHandlerStateChange(setGyroLastScale, gyroScale)}
              >
                <Animated.View style={{ transform: [{ scale: gyroScale }], width: Dimensions.get('window').width * 0.8 }}>
                  <VictoryChart theme={VictoryTheme.material} domain={gyroDomain} containerComponent={
                    <VictoryZoomVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: { datum: any }) => `X: ${datum.yGyroX}, Y: ${datum.yGyroY}, Z: ${datum.yGyroZ}`}
                      labelComponent={<VictoryTooltip />}
                    />
                  }>
                    <VictoryLegend x={125} y={10}
                      orientation="horizontal"
                      gutter={20}
                      data={[
                        { name: 'Gyro X', symbol: { fill: 'orange' } },
                        { name: 'Gyro Y', symbol: { fill: 'purple' } },
                        { name: 'Gyro Z', symbol: { fill: 'brown' } }
                      ]}
                    />
                    <VictoryLine data={recentHistory} x="x" y="yGyroX" style={{ data: { stroke: 'orange' } }} />
                    <VictoryLine data={recentHistory} x="x" y="yGyroY" style={{ data: { stroke: 'purple' } }} />
                    <VictoryLine data={recentHistory} x="x" y="yGyroZ" style={{ data: { stroke: 'brown' } }} />
                    <VictoryAxis crossAxis
                      label="Time"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                    <VictoryAxis dependentAxis crossAxis
                      label="Gyro"
                      style={{ axisLabel: { padding: 35 } }}
                    />
                  </VictoryChart>
                </Animated.View>
              </PinchGestureHandler>
            </>
          ) : null}
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          {status === 'fail' && <Text style={styles.tryText}>Try connecting</Text>}
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>&lt; Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Next &gt;</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sensor Data Details</Text>
            {selectedEntry ? (
              <>
                <Text>Timestamp: {selectedEntry.timestamp}</Text>
                {Object.entries(selectedEntry.sensors).map(([key, value]) => (
                  <Text key={key}>
                    {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                  </Text>
                ))}
              </>
            ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  progressContainer: { width: '80%', height: 10, backgroundColor: '#ddd', borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  progressFill: { width: '33%', height: '100%', backgroundColor: '#090b47' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#090b47', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  loader: { marginBottom: 20 },
  tryText: { fontSize: 18, marginBottom: 20 },
  watchImage: { width: 150, height: 150, marginBottom: 20 },
  successText: { fontSize: 18, color: 'green', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '80%' },
  button: { borderWidth: 1, borderColor: '#090b47', borderRadius: 30, padding: 10, width: '45%' },
  nextButton: { backgroundColor: '#090b47' },
  buttonText: { textAlign: 'center', color: '#090b47' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#090b47',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
  },
});