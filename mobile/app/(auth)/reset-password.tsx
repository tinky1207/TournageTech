// app/(auth)/reset-password.tsx
import * as React from 'react';
import { Text, TextInput, View, TouchableOpacity, Alert, StyleSheet, Image, ImageBackground } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, useNavigation } from 'expo-router';

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const navigation = useNavigation();

  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [codeSent, setCodeSent] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const onSendCodePress = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isLoaded) return;

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setCodeSent(true);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.errors?.[0]?.longMessage || 'An error occurred while sending the code');
    }
  };

  const onResetPress = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'The new password can not be confirm, please enter your new password again');
      return;
    }

    if (!isLoaded || !signIn) return;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/exercise');
      } else {
        Alert.alert('Error', 'Reset failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.errors?.[0]?.longMessage || 'The verification code is incorrect');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background-2.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Image source={require('../../assets/images/left-arrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.labelEnter}>Please enter your email</Text>
        <TextInput
          style={styles.inputLine}
          placeholder="Enter your email"
          placeholderTextColor={'#a6a6a6'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSendCodePress}>
          <Text style={styles.sendButtonText}>Get verification code</Text>
        </TouchableOpacity>
        <Text style={styles.labelVerify}>Please verify your email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          placeholderTextColor={'#a6a6a6'}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
        />
        <Text style={styles.labelNew}>Please enter your new password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor={'#a6a6a6'}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Text style={styles.labelNewAgain}>Please enter your new password again</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password again"
          placeholderTextColor={'#a6a6a6'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.enterButton} onPress={onResetPress}>
          <Text style={styles.enterButtonText}>Enter</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 28,
    marginTop: 140
  },
  backIcon: {
    width: 35,
    height: 24,
    tintColor: 'red',
  },
  labelEnter: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginTop: 145,
    marginLeft: 5

  },
  labelVerify: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 5
  },
  labelNew: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 5
  },
  labelNewAgain: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 5
  },
  input: {
    width: '95%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 5
  },
  inputLine: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    marginBottom: 20,
    paddingHorizontal: 5,
    fontSize: 20,
  },
  sendButton: {
    width: '95%',
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20,
  },
  sendButtonText: {
    color: '#1308d2',
    fontWeight: 'bold',
  },
  enterButton: {
    width: '95%',
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  enterButtonText: {
    color: '#1308d2',
    fontWeight: 'bold',
  },
});