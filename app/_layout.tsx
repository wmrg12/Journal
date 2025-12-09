//app/_layout.tsx
import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useUser, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { initDb, setCurrentUserId, updateUserIdForExistingData, closeDatabase } from '@/src/db/dao';
import { initSync, getSyncInstance } from '../src/service/supabaseSync';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

SplashScreen.preventAutoHideAsync();

const OFFLINE_SESSION_KEY = 'offline_user_session';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used\n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore save item error: ', err);
      return;
    }
  },
};

function SyncManager() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const prevUserIdRef = useRef<string | null>(null);
  const hasNavigatedRef = useRef(false);
  const prevIsSignedInRef = useRef<boolean | undefined>(undefined);
  const isInitializingRef = useRef(false);
  const isSwitchingUserRef = useRef(false);
  const [isOnline, setIsOnline] = useState(true);
  const offlineInitializedRef = useRef(false);

  // Detectar conectividad
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Detectar cuando se cierra sesión (ACTUALIZADO para modo offline)
  useEffect(() => {
    // Solo procesar cierre de sesión si estamos ONLINE
    if (prevIsSignedInRef.current === true && isSignedIn === false && isOnline) {
      const syncService = getSyncInstance();
      if (syncService) {
        syncService.destroy();
      }

      setSyncInitialized(false);
      setDbReady(false);
      hasNavigatedRef.current = false;
      prevUserIdRef.current = null;
      isInitializingRef.current = false;
      isSwitchingUserRef.current = false;

      AsyncStorage.removeItem(OFFLINE_SESSION_KEY).catch(console.error);
    }

    // En modo offline, NO hacer nada si Clerk dice que no hay sesión
    if (!isOnline && isSignedIn === false) {
      return;
    }

    prevIsSignedInRef.current = isSignedIn;
  }, [isSignedIn, isOnline]);

  // Cambio de usuario
  useEffect(() => {
    if (user?.id && prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      isSwitchingUserRef.current = true;

      (async () => {
        try {
          const syncService = getSyncInstance();
          if (syncService) {
            syncService.destroy();
          }

          await closeDatabase();

          setSyncInitialized(false);
          setDbReady(false);
          hasNavigatedRef.current = false;
          isInitializingRef.current = false;

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error durante cambio de usuario:', error);
        } finally {
          isSwitchingUserRef.current = false;
        }
      })();
    }
    prevUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // Establecer userId globalmente
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user?.id]);

  // Inicializar DB en modo offline
  useEffect(() => {
    if (!isOnline && !offlineInitializedRef.current && !dbReady) {
      (async () => {
        try {
          const savedSession = await AsyncStorage.getItem(OFFLINE_SESSION_KEY);
          if (savedSession) {
            const { userId } = JSON.parse(savedSession);

            // Establecer userId globalmente
            setCurrentUserId(userId);

            // Inicializar base de datos local
            await initDb(userId);

            setDbReady(true);
            setSyncInitialized(true);
            offlineInitializedRef.current = true;
          }
        } catch (error) {
          console.error('Error inicializando en modo offline:', error);
        }
      })();
    }
  }, [isOnline, dbReady]);

  // Guardar/limpiar sesión offline
  useEffect(() => {
    if (authLoaded && isSignedIn && user?.id && isOnline) {
      AsyncStorage.setItem(
        OFFLINE_SESSION_KEY,
        JSON.stringify({
          userId: user.id,
          timestamp: Date.now(),
        }),
      ).catch(console.error);
    } else if (authLoaded && !isSignedIn && isOnline) {
      AsyncStorage.removeItem(OFFLINE_SESSION_KEY).catch(console.error);
    }
  }, [authLoaded, isSignedIn, user?.id, isOnline]);

  // Inicialización de DB y Sync al iniciar sesión (SOLO ONLINE)
  useEffect(() => {
    if (
      userLoaded &&
      user?.id &&
      !syncInitialized &&
      isSignedIn &&
      !isInitializingRef.current &&
      !isSwitchingUserRef.current &&
      isOnline
    ) {
      isInitializingRef.current = true;

      (async () => {
        setDbReady(false);

        try {
          await initDb(user.id);

          await updateUserIdForExistingData().catch((error) => {
            console.error('Error actualizando user_id:', error);
          });

          const getSupabaseToken = async () => {
            try {
              const token = await getToken({ template: 'supabase' });
              return token;
            } catch (error) {
              console.error('Error obteniendo token:', error);
              return null;
            }
          };

          initSync(user.id, getSupabaseToken);

          setSyncInitialized(true);
          setDbReady(true);

          await new Promise((resolve) => setTimeout(resolve, 300));

          setTimeout(() => {
            const syncService = getSyncInstance();
            if (syncService) {
              syncService.performFullSync().catch((error: unknown) => {
                console.error('Error en sincronización completa:', error);
              });
            }
          }, 1000);
        } catch (error) {
          console.error('Error en inicialización:', error);
          setDbReady(true);
          setSyncInitialized(true);
        } finally {
          isInitializingRef.current = false;
        }
      })();
    }
  }, [user?.id, userLoaded, syncInitialized, getToken, isSignedIn, isOnline]);

  // Navegación automática
  useEffect(() => {
    // MODO OFFLINE, No depender de Clerk
    if (!isOnline && dbReady && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      setTimeout(() => {
        router.replace('/tabs/home');
      }, 200);
      return;
    }

    // MODO ONLINE, Verificar Clerk
    if (!authLoaded || !userLoaded) {
      return;
    }

    const inAuthGroup = segments[0] === 'login';

    // Usuario autenticado y todo listo
    if (
      isSignedIn &&
      user?.id &&
      dbReady &&
      syncInitialized &&
      !hasNavigatedRef.current &&
      !isSwitchingUserRef.current &&
      isOnline
    ) {
      hasNavigatedRef.current = true;
      setTimeout(() => {
        router.replace('/tabs/home');
      }, 200);
    }
    // No autenticado y online
    else if (!isSignedIn && !inAuthGroup && isOnline) {
      hasNavigatedRef.current = false;
      router.replace('/login');
    }
    // Offline sin sesión
    else if (!isSignedIn && !isOnline && !dbReady) {
      // No hacer nada, el modo offline lo manejará
    }
  }, [
    isSignedIn,
    user?.id,
    segments,
    authLoaded,
    userLoaded,
    dbReady,
    syncInitialized,
    router,
    isOnline,
  ]);

  return <></>;
}

function AppContent() {
  return (
    <>
      <SyncManager />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="createPage/index" options={{ headerShown: false }} />
        <Stack.Screen name="page/index" options={{ headerShown: false }} />
        <Stack.Screen name="pageList/index" options={{ headerShown: false }} />
        <Stack.Screen name="editCover/index" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="createDiary/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/help" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const [fontsLoaded] = useFonts({
    'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
    'CourierPrime-Regular': require('../assets/fonts/CourierPrime-Regular.ttf'),
    'Outfit-Regular': require('../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit-Bold.ttf'),
    'BitcountGridSingle-Regular': require('../assets/fonts/BitcountGridSingle-Regular.ttf'),
    'MomoSignature-Regular': require('../assets/fonts/MomoSignature-Regular.ttf'),
    'Bungee-Regular': require('../assets/fonts/Bungee-Regular.ttf'),
    'PlaywriteMXGuides-Regular': require('../assets/fonts/PlaywriteMXGuides-Regular.ttf'),
    'CormorantGaramond-Italic': require('../assets/fonts/CormorantGaramond-Italic.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);

  // Inicializar base de datos base
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        setDbReady(true);
      } catch (e) {
        console.error('Error initDb:', e);
      }
    })();
  }, []);

  // Configurar audio global
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeAndroid: 1,
          interruptionModeIOS: 1,
        });
      } catch (error) {
        console.error('Error configurando audio global:', error);
      }
    })();
  }, []);

  // Ocultar splash screen
  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  if (!publishableKey) {
    throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no está configurada');
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppContent />
    </ClerkProvider>
  );
}
