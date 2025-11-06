// app/registration.tsx
import * as React from 'react';
import { Text, TextInput, View, TouchableOpacity, Image, Alert, StyleSheet, Platform, ScrollView, Keyboard, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useEffect, useState } from 'react';

const API_URL = 'https://tournagetech-1.onrender.com';

export default function RegistrationScreen() {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();

  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [base64, setBase64] = React.useState<string | null>(null);
  const [mimeType, setMimeType] = React.useState<string | null>(null);
  const [dob, setDob] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [level, setLevel] = React.useState('');
  const [years, setYears] = React.useState('');
  const [purposes, setPurposes] = React.useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const purposesOptions = [
    "Cardiovascular fitness and Prevention of diseases",
    "Weight loss and calorie burning",
    "Therapy and brain unloading",
    "Stress relief and mental vacation",
    "Building relationships and community",
    "Sportsmanship and social skills",
    "Personal improvement and challenge",
    "Professional or financial motivations"
  ];

  useEffect(() => {
    if (isSignedIn && !user) {
      router.replace('/(tabs)/exercise'); // Redirect if signed in but no user data (shouldn't happen post-signup)
    }
  }, [isSignedIn, user, router]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please grant access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress to reduce size
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhotoUri(result.assets[0].uri);
      setBase64(result.assets[0].base64);
      setMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const onSubmit = async () => {
    if (!user?.id || !base64 || !mimeType || !dob || !level || !years || purposes.length === 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/api/users/profile`, {
        username: user.username || `user_${user.id.substring(5, 10)}`,
        dob: dob.toISOString().split('T')[0],
        level,
        years: parseInt(years, 10),
        purposes,
        base64Image: base64,
        mimeType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        Alert.alert('Success', 'Registration completed');
        router.replace('/(tabs)/exercise');
      } else {
        throw new Error('Unexpected response status: ' + res.status);
      }
    } catch (error: any) {
      console.error('Registration error:', error.message, error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  if (isSignedIn && user?.id) {
    return <Redirect href="/(tabs)/exercise" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <ImageBackground source={require('../assets/images/background-1.png')} style={styles.background}>
          <View style={styles.content}>
            <Text style={styles.User}>User</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              <Image source={photoUri ? { uri: photoUri } : require('../assets/images/user-icon.png')} style={styles.image} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <Text style={styles.textBirth}>Date of Birth</Text>
            <View style={styles.dateInput}>
              <TextInput
                style={styles.inputText}
                value={dob.toISOString().split('T')[0]}
                editable={false}
              />
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDob(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}
            <Text style={styles.questionAre}>Are you a?</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={level}
                style={styles.picker}
                onValueChange={(itemValue) => setLevel(itemValue)}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select Level" value="" />
                <Picker.Item label="Beginner" value="Beginner" />
                <Picker.Item label="Intermediate" value="Intermediate" />
                <Picker.Item label="Advanced" value="Advanced" />
              </Picker>
            </View>
            <Text style={styles.questionHow}>How many years?</Text>
            <View style={styles.dateInput}>
              <TextInput
                style={styles.inputText}
                value={years}
                onChangeText={setYears}
                keyboardType="numeric"
                placeholder="Enter years"
              />
            </View>
            <Text style={styles.questionPurpose}>Purpose of Playing?</Text>
            <View style={styles.multiSelectContainer}>
              {purposesOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.multiSelectOption}
                  onPress={() => {
                    if (purposes.includes(option)) {
                      setPurposes(purposes.filter(p => p !== option));
                    } else if (purposes.length < 3) {
                      setPurposes([...purposes, option]);
                    } else {
                      Alert.alert('Limit Reached', 'You can select up to 3 purposes');
                    }
                  }}
                >
                  <View style={styles.checkbox}>
                    {purposes.includes(option) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  User: { 
    color: 'white',
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: -240
  },
  imageContainer: { 
    alignItems: 'center',
    marginBottom: 20,
  },
  image: { 
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  editText: { 
    color: '#070b47',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -10,
  },
  dateInput: { 
    flexDirection: 'row',
    backgroundColor: 'white',
    width: '100%',
    padding: 10,
    marginBottom: 25,
    borderRadius: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { 
    color: '#070b47',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionAre: { 
    color: 'white',
    marginBottom: 20,
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: -240
  },
  questionHow: { 
    color: 'white',
    marginBottom: 20,
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 40,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 20,
    height: Platform.OS === 'ios' ? 200 : 'auto', // Explicit height for iOS to show options
  },
  picker: { 
    width: '100%',
  },
  pickerItem: {
    color: 'black',
    fontSize: 16,
  },
  submitButton: { 
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 40,
    width: '100%',
    marginTop: 10,
  },
  submitText: { 
    color: '#070b47',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18
  },
  textBirth: { 
    color: '#070b47',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  multiSelectContainer: {
    width: '100%',
    marginBottom: 20,
  },
  multiSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#070b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmark: {
    color: '#070b47',
    fontSize: 14,
  },
  optionText: {
    color: '#070b47',
    fontSize: 16,
  },
  questionPurpose: { 
    color: 'white',
    marginBottom: 20,
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: -27
  },
});