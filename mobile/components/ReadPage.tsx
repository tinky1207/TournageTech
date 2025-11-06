// components/ReadPage.tsx
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeviceConnectionButton from './DeviceConnectionButton';
import { useExercise } from '../hooks/useExercise';

export default function ReadPage() {
  const { isRecording, startRecording, stopRecording, time } = useExercise();

  const handleFinish = () => {
    Alert.alert(
      'Complete the exercise',
      'Are you sure to stop the exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: stopRecording },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DeviceConnectionButton />
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(time)}</Text>
        <TouchableOpacity onPress={isRecording ? handleFinish : startRecording}>
          <Image
            source={isRecording ? require('../assets/images/Finish.png') : require('../assets/images/Start.png')}
            style={styles.buttonImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  timer: {
    fontSize: 48,
    marginBottom: 5,
  },
  buttonImage: {
    width: 100,
    height: 100,
    marginBottom: -45
  },
});