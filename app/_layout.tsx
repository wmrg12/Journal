import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { initDb } from '../src/db/dao';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';


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

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <Stack>
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="createPage/index" options={{ headerShown: false }} />
        <Stack.Screen name="page/index" options={{ headerShown: false }} />
        <Stack.Screen name="pageList/index" options={{ headerShown: false }} />
        <Stack.Screen name="editCover/index" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="createDiary/index" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  );
}
