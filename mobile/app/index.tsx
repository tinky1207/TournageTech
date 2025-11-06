// app/index.tsx
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)/exercise" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }
}