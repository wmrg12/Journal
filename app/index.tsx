// app/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, [isLoaded]);

  useEffect(() => {
    if (!ready) return;

    if (isSignedIn) {
      router.replace('/tabs/home');
    } else {
      router.replace('/login');
    }
  }, [ready, isSignedIn]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
