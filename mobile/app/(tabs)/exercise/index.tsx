// app/(tabs)/exercise/index.tsx
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import ResetButton from '../../../components/ResetButton';
import ReadPage from '../../../components/ReadPage';
import ResultPage from '../../../components/ResultPage';
import RecordsPage from '../../../components/RecordsPage';
import { useExercise } from '../../../hooks/useExercise';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';

const API_URL = 'https://tournagetech-1.onrender.com'; // Or import from your env config

export default function Exercise() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [currentSubPage, setCurrentSubPage] = useState<'read' | 'result' | 'records'>('read');
  useExercise(); // Initialize the hook

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      checkProfile();
      fetchProfileImage();
    }
  }, [isLoaded, isSignedIn]);

  const checkProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileExists(res.status === 200);
    } catch (error) {
      setProfileExists(false);
    }
  };

  const fetchProfileImage = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 && res.data.profile_image_url) {
        setProfileImageUrl(res.data.profile_image_url);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      // Fallback to default if error
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/(auth)/sign-in');
    } // Removed redirection to registration for profileExists false, to allow sign-in without it
  }, [isLoaded, isSignedIn, profileExists, router]);

  if (!isLoaded || profileExists === null) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }

  const getTextStyle = (page: 'read' | 'result' | 'records') => ({
    color: currentSubPage === page ? '#090b47' : '#a6a6a6',
    fontSize: 24,
    marginHorizontal: 30,
    fontWeight: currentSubPage === page ? 'bold' : 'normal' as 'bold' | 'normal',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity onPress={() => router.push('/user-profile')}>
            <Image source={profileImageUrl ? { uri: profileImageUrl } : require('../../../assets/images/user-icon.png')} style={styles.userIcon} />
          </TouchableOpacity>{/* */}
          <Image source={require('../../../assets/images/exercise-text.png')} style={styles.exerciseImage} />
        </View>{/* */}
        <ResetButton />
      </View>
      <View style={styles.subTabs}>
        <Text style={getTextStyle('read')} onPress={() => setCurrentSubPage('read')}>
          Read
        </Text>{/* */}
        <Text style={getTextStyle('result')} onPress={() => setCurrentSubPage('result')}>
          Result
        </Text>{/* */}
        <Text style={getTextStyle('records')} onPress={() => setCurrentSubPage('records')}>
          Records
        </Text>
      </View>
      {currentSubPage === 'read' && <ReadPage />}
      {currentSubPage === 'result' && <ResultPage />}
      {currentSubPage === 'records' && <RecordsPage />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 20
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -15,
  },
  userIcon: {
    width: 55,
    height: 50, // Adjust as needed
    marginRight: 10,
    borderRadius: 25, // Make circular like in user-profile
  },
  exerciseImage: {
    width: 150, // Adjust width based on the image dimensions
    height: 40, // Adjust height to maintain aspect ratio
    resizeMode: 'contain',
    marginLeft: 7,
  },
  exerciseText: {
    color: '#090b47',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 7
  },
  subTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    marginTop: -5,
  },
});