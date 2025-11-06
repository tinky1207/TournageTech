// app/(auth)/sign-up.tsx
import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View, ImageBackground, Image, Alert, StyleSheet, Platform } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter, useNavigation } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);
};

export default function SignUpScreen() {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const navigation = useNavigation();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });

  useWarmUpBrowser();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const onSignUpPress = async () => {
    if (loading) return;

    if (!isLoaded) return;

    if (!emailAddress || !password || !username) { // Add username check
      Alert.alert('Error', 'Please enter your email, password, and username');
      return;
    }

    setLoading(true);
    try {
      const createResult = await signUp.create({
        emailAddress,
        password,
        username, // Pass username to Clerk
      });

      console.log('Sign-up create result status:', createResult.status);
      console.log('Sign-up create result createdUserId:', createResult.createdUserId);

            if (createResult.status === 'missing_requirements') {
        console.log('Missing fields:', createResult.missingFields.join(', ') || 'None');
        console.log('Unverified fields:', createResult.unverifiedFields.join(', ') || 'None'); // Add this
        if (createResult.missingFields.length > 0) {
          Alert.alert('Missing Info', 'Sign-up incomplete. Missing fields: ' + createResult.missingFields.join(', '));
          return;
        } else if (createResult.unverifiedFields.includes('email_address')) {
          // Proceed to verification - this is expected
          console.log('Email unverified - proceeding to verification');
        } else {
          Alert.alert('Missing Info', 'Sign-up incomplete. Unverified fields: ' + createResult.unverifiedFields.join(', '));
          return;
        }
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push('/(auth)/verify-email');
    } catch (err: any) {
      console.error('Raw sign-up error:', err);
      if (err.errors?.some((e: any) => e.code === 'form_identifier_exists')) {
        Alert.alert('Error', 'The account or username already exists');
      } else if (err.message.includes('not a valid parameter')) {
        Alert.alert('Config Error', 'Invalid parameter (e.g., username). Enable sign-up with username in Clerk dashboard.');
      } else {
        Alert.alert('Error', err.message || 'Failed to start sign-up. Check logs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onApplePress = React.useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startAppleFlow({
        redirectUrl: Linking.createURL('(auth)/sign-up'),
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        }
        router.replace('/registration');
      } else {
        // @ts-ignore
        if (signUp?.status === 'missing_requirements' || signIn?.status === 'needs_factor_one') {
          // Redirect to verification or registration if needed
          router.replace('/(auth)/verify-email'); // Or '/registration' if additional setup is required
        } else {
          Alert.alert('Error', 'Apple sign-up incomplete. Please try again.');
        }
      }
    } catch (err) {
      console.error('Apple OAuth error', err);
      Alert.alert('Error', 'An error occurred during Apple sign-up');
    } finally {
      setLoading(false);
    }
  }, [loading, startAppleFlow, router]);

  const onGooglePress = React.useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startGoogleFlow({
        redirectUrl: Linking.createURL('(auth)/sign-up'),
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        }
        router.replace('/registration');
      } else {
        // @ts-ignore
        if (signUp?.status === 'missing_requirements' || signIn?.status === 'needs_factor_one') {
          // Redirect to verification or registration if needed
          router.replace('/(auth)/verify-email'); // Or '/registration' if additional setup is required
        } else {
          Alert.alert('Error', 'Google sign-up incomplete. Please try again.');
        }
      }
    } catch (err) {
      console.error('Google OAuth error', err);
      Alert.alert('Error', 'An error occurred during Google sign-up');
    } finally {
      setLoading(false);
    }
  }, [loading, startGoogleFlow, router]);
  
  return (
    <ImageBackground
      source={require('../../assets/images/background-2.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <Text style={styles.subtitle}>Create an account</Text>
      <View style={styles.innerContainer}>
        <Text style={styles.userText}>Please input your:</Text>
        <TextInput
          style={styles.inputUsername}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="Username"
          placeholderTextColor={'#a6a6a6'}
        />
        <TextInput
          style={styles.inputEmail}
          value={emailAddress}
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Email"
          placeholderTextColor={'#a6a6a6'}
        />
        <TextInput
          style={styles.inputPassword}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={'#a6a6a6'}
        />
        <TouchableOpacity style={styles.signInButton} onPress={onSignUpPress}>
          <Text style={styles.signInButtonText}>Sign up</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>OR</Text>
        <View style={styles.oauthContainer}>
          <TouchableOpacity style={styles.oauthButton} onPress={onApplePress}>
            <Image source={require('../../assets/images/apple.png')} style={styles.oauthImageApple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.oauthButton} onPress={onGooglePress}>
            <Image source={require('../../assets/images/google.png')} style={styles.oauthImageGoogle} />
          </TouchableOpacity>
        </View>
        <Text style={styles.linkText}>
          Already got an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/sign-in')}>
            Sign-in
          </Text>
        </Text>
        <Text style={styles.agreementText}>
          By continuing, you are agreeing to our{' '}
          <Text style={styles.agreementLink} onPress={() => router.push('/terms-sign-up')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.agreementLink} onPress={() => router.push('/privacy-sign-up')}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  innerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 30,
    color: 'white',
    marginBottom: 20,
    marginTop: 120,
    fontWeight: 'bold',
    marginLeft: -94
  },
  userText: {
    fontSize: 18,
    color: 'white',
    marginLeft: -190,
    fontWeight: 'bold',
  },
  inputUsername: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    paddingHorizontal: 5,
    fontSize: 20,
    marginTop: 18
  },
  inputEmail: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    paddingHorizontal: 5,
    fontSize: 20,
    marginTop: 18
  },
  inputPassword: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    paddingHorizontal: 5,
    fontSize: 20,
    marginTop: 18
  },
  signInButton: {
    width: '95%',
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 15,
    marginTop: 30
  },
  signInButtonText: {
    color: '#1308d2',
    fontWeight: 'bold',
    fontSize: 16
  },
  orText: {
    color: 'white',
    marginBottom: 15,
    fontSize: 20
  },
  oauthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  oauthButton: {
    width: 160,
    height: 48,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 10
  },
  oauthImageGoogle: {
    width: 30,
    height: 33,
  },
  oauthImageApple: {
    width: 30,
    height: 36,
  },
  linkText: {
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  link: {
    color: '#5ce1e6',
    textDecorationLine: 'underline',
  },
  agreementText: {
    color: '#5ce1e6',
    textAlign: 'center',
    fontSize: 12
  },
  agreementLink: {
    textDecorationLine: 'underline',
  },
});