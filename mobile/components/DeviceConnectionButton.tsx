// components/DeviceConnectionButton.tsx (updated)
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWatchConnection } from '../hooks/useWatchConnection';

export default function DeviceConnectionButton() {
  const { connected } = useWatchConnection();
  const router = useRouter();

  const handlePress = () => {
    router.push('/exercise/connecting-device');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <Text style={styles.text}>Device connection</Text>
      <View style={[styles.status, { backgroundColor: connected ? 'green' : 'red' }]}>
        <Text style={styles.statusText}>{connected ? 'Connected' : 'Settings…'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 18,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#090b47',
    marginRight: 85,
  },
  status: {
    padding: 5,
    borderRadius: 2,
    minWidth: 80,
    alignItems: 'center',
    marginRight: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});