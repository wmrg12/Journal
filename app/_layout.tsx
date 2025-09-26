
import { Stack } from "expo-router";
import { Text } from "react-native"; 
import { ClerkProvider } from '@clerk/clerk-expo'
import * as SecureStore from "expo-secure-store";

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

  return (
  <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
    <Stack>
      <Stack.Screen name="login/index" options={{ title: "Iniciar Sesión" }} />
    </Stack>
  </ClerkProvider>
  );

}
