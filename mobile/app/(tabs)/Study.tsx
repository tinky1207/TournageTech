// app/(tabs)/Study.tsx
import { StyleSheet, Text, View } from 'react-native';
import { useClerk } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { TouchableOpacity } from 'react-native';

const SignOutButton = () => {
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      Linking.openURL(Linking.createURL('/'));
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };
  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign out</Text>
    </TouchableOpacity>
  );
};

export default function Study() {
  return (
    <View style={styles.container}>
      <Text>Study Tab Content</Text>
      <SignOutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});