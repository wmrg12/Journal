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

SplashScreen.preventAutoHideAsync();

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

  // Detectar cuando se cierra sesión
  useEffect(() => {
    if (prevIsSignedInRef.current === true && isSignedIn === false) {
      console.log('Sesión cerrada, limpiando estado...');

      const syncService = getSyncInstance();
      if (syncService) {
        syncService.destroy();
      }

      // Limpiar completamente
      setSyncInitialized(false);
      setDbReady(false);
      hasNavigatedRef.current = false;
      prevUserIdRef.current = null;
      isInitializingRef.current = false;
      isSwitchingUserRef.current = false;
    }
    prevIsSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  // Cambio de usuario
  useEffect(() => {
    if (user?.id && prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      console.log('Usuario cambió de', prevUserIdRef.current, 'a', user.id);

      isSwitchingUserRef.current = true;

      (async () => {
        try {
          // Destruir sync del usuario anterior
          const syncService = getSyncInstance();
          if (syncService) {
            console.log('Destruyendo sync del usuario anterior...');
            syncService.destroy();
          }

          // Cerrar base de datos anterior
          console.log('Cerrando base de datos anterior...');
          await closeDatabase();

          // Resetear todo el estado
          setSyncInitialized(false);
          setDbReady(false);
          hasNavigatedRef.current = false;
          isInitializingRef.current = false;

          // Esperar un momento para que todo se limpie
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log('Limpieza completa, listo para nuevo usuario');
        } catch (error) {
          console.error('Error durante cambio de usuario:', error);
        } finally {
          isSwitchingUserRef.current = false;
        }
      })();
    }
    prevUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // Establecer currentUserId
  useEffect(() => {
    if (user?.id) {
      console.log('Estableciendo currentUserId:', user.id);
      setCurrentUserId(user.id);
    }
  }, [user?.id]);

  // Sincronización cuando el usuario está autenticado
  useEffect(() => {
    if (
      userLoaded &&
      user?.id &&
      !syncInitialized &&
      isSignedIn &&
      !isInitializingRef.current &&
      !isSwitchingUserRef.current
    ) {
      isInitializingRef.current = true;

      (async () => {
        console.log('Inicializando para usuario:', user.id);

        setDbReady(false);

        try {
          // Inicializar base de datos
          await initDb(user.id);
          console.log('Base de datos del usuario lista');

          // Actualizar user_id en datos existentes
          await updateUserIdForExistingData().catch((error) => {
            console.error('Error actualizando user_id:', error);
          });

          // Configurar función para obtener token
          const getSupabaseToken = async () => {
            try {
              console.log('Solicitando token de Clerk');
              const token = await getToken({ template: 'supabase' });
              console.log('Token obtenido:', token ? 'Sí' : 'No');
              return token;
            } catch (error) {
              console.error('Error obteniendo token:', error);
              return null;
            }
          };

          // Inicializar servicio de sincronización
          initSync(user.id, getSupabaseToken);

          // Iniciar sincronización en background
          const syncService = getSyncInstance();
          if (syncService) {
            syncService.performFullSync().catch((error: unknown) => {
              console.error('Error en sincronización completa:', error);
            });
          }

          // Marcar como listo
          console.log('Marcando como listo para navegación...');
          setSyncInitialized(true);
          setDbReady(true);

          // Pequeño delay para estabilidad
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log('Inicialización completa');
        } catch (error) {
          console.error('Error en inicialización:', error);
          setDbReady(false);
          setSyncInitialized(false);
          isInitializingRef.current = false;
        }
      })();
    }
  }, [user?.id, userLoaded, syncInitialized, getToken, isSignedIn]);

  // Navegacion automatica
  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      console.log('⏳ Esperando auth/user loaded...');
      return;
    }

    const inAuthGroup = segments[0] === 'login';

    console.log('📍 Estado de navegación:', {
      isSignedIn,
      userId: user?.id,
      inAuthGroup,
      dbReady,
      syncInitialized,
      hasNavigated: hasNavigatedRef.current,
      isSwitching: isSwitchingUserRef.current,
      segments: segments.join('/'),
    });

    // Si está autenticado, DB listo, y sync inicializado
    if (
      isSignedIn &&
      user?.id &&
      dbReady &&
      syncInitialized &&
      !hasNavigatedRef.current &&
      !isSwitchingUserRef.current
    ) {
      console.log('✅ Condiciones cumplidas, navegando a /tabs/home...');
      hasNavigatedRef.current = true;

      // Navegar después de un pequeño delay
      setTimeout(() => {
        console.log('🚀 Ejecutando navegación a /tabs/home');
        router.replace('/tabs/home');
      }, 200);
    } else if (!isSignedIn && !inAuthGroup) {
      // Si no está autenticado y no está en login
      console.log('❌ No autenticado, navegando a /login...');
      hasNavigatedRef.current = false;
      router.replace('/login');
    }
  }, [isSignedIn, user?.id, segments, authLoaded, userLoaded, dbReady, syncInitialized, router]);

  return <></>;
}

function AppContent() {
  return (
    <>
      <SyncManager />
      <Stack>
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
        console.log('Database initialized');
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
