// app/(auth)/verify-email.tsx
import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View, ImageBackground, Image, Alert, StyleSheet } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, useNavigation } from 'expo-router';
import { useAuth, isClerkRuntimeError } from '@clerk/clerk-expo';  // Add isClerkRuntimeError


export default function VerifyEmailScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/registration');
    }
  }, [isSignedIn, router]);

  const onVerifyPress = async () => {
    if (!isLoaded || loading) return;

    if (!code) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }

    setLoading(true);
    try {
      await signUp.reload(); // Reload to ensure latest state

      if (signUp.status === 'missing_requirements') {
        console.log('SignUp missing fields:', signUp.missingFields.join(', '));
        if (signUp.missingFields.length > 0) {
          Alert.alert('Sign-Up Incomplete', 'Missing required fields: ' + signUp.missingFields.join(', ') + '. Update dashboard or code.');
          return;
        } // Proceed if only unverified
      }

      const currentVerification = signUp.verifications.emailAddress;
      if (currentVerification.status === "verified") {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/registration');
        return;
      }

      console.log('SignUp status before attempt:', signUp.status);
      console.log('Email verification status before attempt:', signUp.verifications?.emailAddress?.status);
      console.log('Input code:', code.trim());

      console.log('SignUp ID:', signUp.id); // Should not be undefined

      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      console.log('Verification attempt status:', signUpAttempt.status);
      console.log('Verification attempt createdUserId:', signUpAttempt.createdUserId);
      console.log('Verification attempt createdSessionId:', signUpAttempt.createdSessionId);

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/registration');
      } else if (signUpAttempt.status === 'missing_requirements') {
        Alert.alert('Still Incomplete', 'Verification passed but missing requirements. Check dashboard for required fields.');
      } else {
        Alert.alert('Verification Issue', `Status: ${signUpAttempt.status}. Try resending code.`);
      }
    } catch (err: any) {
      console.error('Raw verification error:', err.message || err);
      if (isClerkRuntimeError(err) && err.code === 'network_error') {
        Alert.alert('Network Error', 'Clerk detected a network issue. Check connection and retry.');
      } else if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
        Alert.alert('Verification Failed', 'Muted error from Clerk—likely network or config. Try resending.');
      } else if (err.status === 422 || err.clerkError) {
        Alert.alert('Verification Error', err.errors?.[0]?.longMessage || 'Invalid code. Try again or resend.');
      } else if (err.errors && err.errors[0]) {
        const errorCode = err.errors[0].code;
        if (errorCode === 'verification_already_verified') {
          await signUp.reload();
          if (signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
            router.replace('/registration');
          } else {
            Alert.alert('Error', 'Account already verified but no session. Try signing in.');
          }
        } else if (errorCode === 'form_code_incorrect') {
          Alert.alert('Incorrect Code', 'The verification code is wrong or expired. Try again or resend.');
        } else {
          Alert.alert('Error', `Verification failed: ${err.message || 'Unknown'}.`);
        }
      } else {
        Alert.alert('Unknown Error', `An unexpected error occurred: ${err.message || 'Check logs'}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onResendPress = async () => {
    if (!isLoaded || loading) return;

    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('Resend error:', err.message || err);
      Alert.alert('Error', 'Failed to resend code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onBackPress = () => {
    router.back();
  };

  return (
    <ImageBackground source={require('../../assets/images/background-2.png')} style={styles.background}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Image source={require('../../assets/images/left-arrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>Please verify your email</Text>
        <TextInput
          value={code}
          placeholder="Enter verification code"
          onChangeText={setCode}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#a6a6a6"
        />
        <TouchableOpacity onPress={onVerifyPress} style={styles.button}>
          <Text style={styles.buttonText}>Enter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onResendPress} style={styles.resendButton}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backButton: { position: 'absolute', top: 545, left: 30 },
  backIcon: { width: 38, height: 30, tintColor: 'red' },
  title: { color: 'white', fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  input: { 
    width: '95%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 26,
    marginTop: 5
  },
  button: { 
    width: '95%',
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 15,
  },
  buttonText: { color: '#1308d2', textAlign: 'center', fontWeight: 'bold', fontSize: 24 },
  resendButton: { 
    width: '30%',
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingHorizontal: 5,
    marginTop: 18
  },
  resendText: { color: 'white', textAlign: 'center', fontSize: 15  },
});