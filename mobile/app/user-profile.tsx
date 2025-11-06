// app/user-profile.tsx (Updated)
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Platform, KeyboardAvoidingView } from 'react-native';

const API_URL = 'https://tournagetech-1.onrender.com'; // Adjust based on your backend URL

interface Comment {
  id: number;
  content: string;
  created_at: string;
  post_title: string;
}

export default function UserProfile() {
  const router = useRouter();
  const { isLoaded, signOut, getToken } = useAuth();
  const [profile, setProfile] = useState<{ username: string; profile_image_url: string | null; about: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      fetchProfile();
      fetchComments();
    }
  }, [isLoaded]);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setProfile({
          username: res.data.username,
          profile_image_url: res.data.profile_image_url,
          about: res.data.about || '',
        });
        setNewUsername(res.data.username || '');
        setNewAbout(res.data.about || '');
      } else {
        throw new Error('Unexpected response status: ' + res.status);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message, error.response?.data);
      if (error.response?.status === 500) {
        Alert.alert('Server Error', 'Unable to fetch profile. Please try again later.');
      } else {
        Alert.alert('Error', error.message || 'Failed to fetch profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      await updateProfileImage(base64Image, mimeType);
    }
  };

  const updateProfileImage = async (base64Image: string, mimeType: string) => {
    try {
      const token = await getToken();
      const res = await axios.put(`${API_URL}/api/users/profile`, { base64Image, mimeType }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(prev => prev ? { ...prev, profile_image_url: res.data.user.profile_image_url } : null);
      Alert.alert('Success', 'Profile image updated.');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image.');
    }
  };

  const startEditing = () => {
    setEditing(true);
  };

  const saveChanges = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    try {
      const token = await getToken();
      const res = await axios.put(`${API_URL}/api/users/profile`, { username: newUsername, about: newAbout }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(prev => prev ? { ...prev, username: res.data.user.username, about: res.data.user.about } : null);
      setEditing(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentMeta}>on "{item.post_title}" - {formatDistanceToNow(new Date(item.created_at))} ago</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#090b47" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loaderContainer}>
        <Text>No profile data available.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={(
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={40} color="red" />
              </TouchableOpacity>
              <TouchableOpacity onPress={editing ? saveChanges : startEditing}>
                {editing ? (
                  <Text style={styles.saveButton}>Save</Text>
                ) : (
                  <Octicons name="pencil" size={30} color="#090b47" style={styles.pencilIcon} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.profileImageContainer}>
              <Image
                source={profile.profile_image_url ? { uri: profile.profile_image_url } : require('../assets/images/user-icon.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity onPress={pickImage}>
                <Image source={require('../assets/images/Edit.png')} style={styles.editPhotoButton} />
              </TouchableOpacity>
            </View>
            <View style={styles.usernameContainer}>
              {editing ? (
                <TextInput
                  style={styles.usernameInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoFocus
                />
              ) : (
                <Text style={styles.username}>{profile.username}</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutTitle}>About you</Text>
              {editing ? (
                <TextInput
                  style={styles.aboutInput}
                  value={newAbout}
                  onChangeText={setNewAbout}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <View style={styles.aboutTextContainer}>
                  <Text style={styles.aboutText}>{profile.about}</Text>
                </View>
              )}
            </View>
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Your Comments</Text>
              {commentsLoading && <ActivityIndicator size="small" color="#090b47" />}
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
    marginTop: 30,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    marginTop: -60,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  editPhotoButton: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
    marginTop: 2,
    marginBottom: -10
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#090b47',
    textAlign: 'center',
  },
  usernameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#090b47',
    borderBottomWidth: 1,
    borderBottomColor: '#090b47',
    textAlign: 'center',
    width: 200,
  },
  pencilIcon: {
    marginRight: 10,
    marginTop: 20
  },
  saveButton: {
    color: '#3897f0',
    fontSize: 16,
    marginLeft: 10,
  },
  commentsSection: {
    flex: 1,
    alignItems: 'center',
    marginTop: -10
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginRight: 190,
  },
  signOutButton: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -15
  },
  signOutText: {
    color: 'red',
    fontSize: 18,
  },
  aboutContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  aboutInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    height: 60,
    textAlign: 'left',
    textAlignVertical: 'top',
  },
  aboutTextContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 10,
    width: '100%',
    height: 60,
    justifyContent: 'center',
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  devicesSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  commentItem: {
    marginBottom: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
  },
  commentMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginRight: 250,
  }
});