// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Redirigir INMEDIATAMENTE sin setTimeout
    if (isSignedIn) {
      router.replace('/tabs/home');
    } else {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn]);

  // Solo vista blanca, sin ActivityIndicator para que sea más rápido
  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}