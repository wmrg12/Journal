import { useEffect } from 'react';
import { Stack } from "expo-router";
import { ClerkProvider } from '@clerk/clerk-expo'
import * as SecureStore from "expo-secure-store";
import { initDb } from "../src/db/dao";

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

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
  <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
    <Stack>
      <Stack.Screen name="login/index" options={{ title: "Iniciar Sesion" }} />
      <Stack.Screen name="createPage/index" options={{ title: "Crear pagina" }} />
      <Stack.Screen name="page/index" options={{ headerShown: false }} />
      <Stack.Screen name="pageList"/>
      <Stack.Screen name="editCover/index" options={{ title: "Editar portada" }} />

    </Stack>
  </ClerkProvider>
  );

}
