// app/(auth)/sign-in.tsx
import * as React from 'react';
import { Text, TextInput, View, TouchableOpacity, Alert, StyleSheet, Image, ImageBackground, Platform } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, useNavigation } from 'expo-router';
import { useOAuth } from '@clerk/clerk-expo';
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

export default function SignInScreen() {
  const { signIn, setActive: signInSetActive, isLoaded } = useSignIn();
  const router = useRouter();
  const navigation = useNavigation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });

  useWarmUpBrowser();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const onSignInPress = async () => {
    if (loading) return;
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email address and password');
      return;
    }

    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await signInSetActive({ session: completeSignIn.createdSessionId });
        router.replace('/(tabs)/exercise');
      } else {
        Alert.alert('Error', 'Email address or password are incorrect');
      }
    } catch (err: any) {
      if (err.errors && err.errors[0].code === 'form_identifier_not_found') {
        Alert.alert('Error', 'The account may not found, please try again or sign-up');
      } else {
        Alert.alert('Error', 'Email address or password are incorrect');
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
        redirectUrl: Linking.createURL('(auth)/sign-in'),
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
          router.replace('/(auth)/verify-email');
        } else {
          Alert.alert('Error', 'Apple sign-in incomplete. Please try again.');
        }
      }
    } catch (err) {
      console.error('Apple OAuth error', err);
      Alert.alert('Error', 'An error occurred during Apple sign-in');
    } finally {
      setLoading(false);
    }
  }, [loading, startAppleFlow, router]);

  const onGooglePress = React.useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startGoogleFlow({
        redirectUrl: Linking.createURL('(auth)/sign-in'),
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
          router.replace('/(auth)/verify-email');
        } else {
          Alert.alert('Error', 'Google sign-in incomplete. Please try again.');
        }
      }
    } catch (err) {
      console.error('Google OAuth error', err);
      Alert.alert('Error', 'An error occurred during Google sign-in');
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
      <Text style={styles.subtitle}>Login to account</Text>
      <View style={styles.innerContainer}>
        <TextInput
          style={styles.inputEmail}
          value={email}
          onChangeText={setEmail}
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
        <TouchableOpacity style={styles.signInButton} onPress={onSignInPress}>
          <Text style={styles.signInButtonText}>Sign in</Text>
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
          Haven't got an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/sign-up')}>
            Sign-up page is here
          </Text>
        </Text>
        <Text style={styles.linkText}>
          Forgot your password?{' '}
          <Text style={styles.link} onPress={() => router.push('/reset-password')}>
            Change your password here
          </Text>
        </Text>
        <Text style={styles.agreementText}>
          By continuing, you are agreeing to our{' '}
          <Text style={styles.agreementLink} onPress={() => router.push('/terms-sign-in')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.agreementLink} onPress={() => router.push('/privacy-sign-in')}>
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
    marginLeft: -115
  },
  label: {
    color: 'white',
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
  },
  inputEmail: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    marginBottom: 20,
    paddingHorizontal: 5,
    fontSize: 20,
  },
  inputPassword: {
    width: '95%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    marginBottom: 22,
    paddingHorizontal: 5,
    fontSize: 20,
    marginTop: 10
  },
  signInButton: {
    width: '95%',
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 15,
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