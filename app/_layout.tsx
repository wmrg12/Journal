import { useEffect, useState } from 'react';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Text, View, ActivityIndicator } from "react-native";
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from 'expo-splash-screen';
import { initDb } from '../services/db';
import { useAuthSync } from '../hooks/useAuthSync';

// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used\n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore save item error: ", err);
      return;
    }
  },
};

/**
 * Componente interno que maneja la sincronización con Firebase
 * Solo se renderiza después de que Clerk esté listo
 */
function AppContent() {
  useAuthSync(); // Sincroniza automáticamente el usuario de Clerk con Firebase

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/index" options={{ headerShown: false }} />
      <Stack.Screen name="createPage/index" options={{ headerShown: false }} />
      <Stack.Screen name="page/index" options={{ headerShown: false }} />
      <Stack.Screen name="pageList/index" options={{ headerShown: false }} />
      <Stack.Screen name="editCover/index" options={{ headerShown: false }} />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
      <Stack.Screen name="createDiary/index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const [fontsLoaded] = useFonts({
    "outfit-regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "outfit-bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "outfit-medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "outfit-black": require("../assets/fonts/Outfit-Black.ttf"),
  });

  const [dbReady, setDbReady] = useState(false);

  // Inicializar base de datos SQLite
  useEffect(() => {
    initDb()
      .then(() => {
        console.log('✅ SQLite Database initialized');
        setDbReady(true);
      })
      .catch((error) => {
        console.error('❌ Database initialization failed:', error);
        setDbReady(true); // Continuar de todas formas
      });
  }, []);

  // Ocultar splash screen cuando todo esté listo
  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // Mostrar loading mientras se cargan fuentes y DB
  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AppContent />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
