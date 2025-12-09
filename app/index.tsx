// app/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_SESSION_KEY = 'offline_user_session';
const MAX_CLERK_WAIT_TIME = 3000;

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasOfflineSession, setHasOfflineSession] = useState(false);
  const [clerkTimedOut, setClerkTimedOut] = useState(false);

  // Verificar conectividad
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Verificar sesión offline guardada
  useEffect(() => {
    (async () => {
      try {
        const savedSession = await AsyncStorage.getItem(OFFLINE_SESSION_KEY);
        if (savedSession) {
          const { userId, timestamp } = JSON.parse(savedSession);
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          const isValid = Date.now() - timestamp < thirtyDaysInMs;

          setHasOfflineSession(isValid);
        }
      } catch (error) {
        console.error('Error verificando sesión offline:', error);
      }
    })();
  }, []);

  // Timeout para Clerk si tarda mucho
  useEffect(() => {
    if (!isOnline && !isLoaded) {
      const timeout = setTimeout(() => {
        setClerkTimedOut(true);
      }, MAX_CLERK_WAIT_TIME);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, isLoaded]);

  useEffect(() => {
    // MODO OFFLINE o Clerk no responde
    if (!isOnline || clerkTimedOut) {
      if (hasOfflineSession) {
        setTimeout(() => {
          router.replace('/tabs/home');
        }, 500);
      } else {
        setTimeout(() => {
          router.replace('/login');
        }, 500);
      }
      return;
    }

    // MODO ONLINE: Esperar a Clerk
    if (!isLoaded) return;

    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, [isLoaded, isOnline, hasOfflineSession, clerkTimedOut]);

  useEffect(() => {
    if (!ready || !isOnline) return;

    if (isSignedIn) {
      // Guardar sesión para uso offline
      AsyncStorage.setItem(
        OFFLINE_SESSION_KEY,
        JSON.stringify({
          userId: 'user_id_placeholder',
          timestamp: Date.now(),
        }),
      ).catch(console.error);
      router.replace('/tabs/home');
    } else {
      // Limpiar sesión offline si no está autenticado
      AsyncStorage.removeItem(OFFLINE_SESSION_KEY).catch(console.error);
      router.replace('/login');
    }
  }, [ready, isSignedIn, isOnline]);

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
