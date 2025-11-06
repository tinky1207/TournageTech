// app/(tabs)/exercise/initialization-setting.tsx (updated)
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, TextStyle, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useWatchConnection } from '../../../hooks/useWatchConnection';
import { useSensors } from '../../../hooks/useSensors';

export default function InitializationSetting() {
  const router = useRouter();
  const { watchSide, setWatchSide, initialSensors, setInitialSensors, resetInitial, initialized } = useWatchConnection();
  const { latestSensors } = useSensors();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(watchSide);

  const handleSelectSide = (side: 'left' | 'right') => {
    setSelectedSide(side === selectedSide ? null : side);
  };

  const handleConfirm = () => {
    if (selectedSide) {
      setWatchSide(selectedSide);
      setInitialSensors(latestSensors);
    } else {
      Alert.alert('Please select a side first.');
    }
  };

  const handleReset = () => {
    resetInitial();
    setSelectedSide(null);
  };

  const handleFinish = () => {
    if (initialized) {
      router.replace('/(tabs)/exercise');
    } else {
      Alert.alert('Please complete the initialization by confirming.');
    }
  };

  const getButtonStyle = (side: 'left' | 'right'): ViewStyle => ({
    backgroundColor: selectedSide === side ? '#090b47' : 'white',
    borderRadius: 20,
    padding: 10,
    margin: 10,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center', 
    marginHorizontal: 65,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#090b47',
  });

  const getButtonTextStyle = (side: 'left' | 'right'): TextStyle => ({
    color: selectedSide === side ? 'white' : '#090b47',
    fontWeight: 'bold',
    fontSize: 20,
  });

  const imageSource = selectedSide === 'left'
    ? require('../../../assets/images/Left-hand.png')
    : selectedSide === 'right'
    ? require('../../../assets/images/Right-hand.png')
    : null; // Or default image if needed

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={30} color="red" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Initialization setting</Text>
      <Text style={styles.description}>
        Please choose the side on which you wear the watch, and stand in the middle of the Baseline, and place your arm like the position shown in the picture below, and hold for 10 seconds.
      </Text>
      {imageSource && <Image source={imageSource} style={styles.image} />}
      <View style={styles.sideButtons}>
        <TouchableOpacity style={getButtonStyle('left')} onPress={() => handleSelectSide('left')}>
          <Text style={getButtonTextStyle('left')}>Left</Text>
        </TouchableOpacity>
        <TouchableOpacity style={getButtonStyle('right')} onPress={() => handleSelectSide('right')}>
          <Text style={getButtonTextStyle('right')}>Right</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={45} color="black" />
          <Text style={styles.textReset}>Reset</Text>
        </TouchableOpacity>
        {initialized && (
          <Ionicons name="checkmark" size={80} color="green" style={styles.tick} />
        )}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={45} color="black" />
          <Text style={styles.textConfirm}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finishText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 300, // Adjust as needed
    resizeMode: 'contain',
    marginBottom: 5,
    marginTop: -8,
  },
  sideButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  resetButton: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  confirmButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  tick: {
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textReset: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  textConfirm: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
});