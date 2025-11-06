// app/(auth)/_layout.tsx
import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  if (isSignedIn && pathname !== '/(auth)/verify-email') {
    return <Redirect href="/(tabs)/exercise" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}