// components/ResetButton.tsx
import { Alert, Image, TouchableOpacity } from 'react-native';
import { useExercise } from '../hooks/useExercise'; // Assuming a hook for shared state

export default function ResetButton() {
  const { resetExercise } = useExercise();

  const handleReset = () => {
    Alert.alert(
      'Reset exercise',
      'Are you sure to reset exercise? The exercise will not be saved',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: resetExercise },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleReset}>
      <Image source={require('../assets/images/Reset.png')} 
      style={{ 
        width: 38,
        height: 38,
        marginRight: 10,
        marginTop: -18, 
        }} /> 
    </TouchableOpacity>
  );
}