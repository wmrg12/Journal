import { Text, View, Pressable, ActivityIndicator } from "react-native";
import React from "react";
import styles from "./loginStyles";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { isSignedIn, signOut } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onPress = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
    
      if (isSignedIn) {
        console.log("Limpiando sesión residual...");
        await signOut();
      }

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/login/home", { scheme: "myapp" } ),
      });

      if (createdSessionId) {
      
        await setActive!({ session: createdSessionId });

        const homeUrl = Linking.createURL("/login/home", { scheme: "myapp" });
        Linking.openURL(homeUrl);
      } else {
        console.warn("No se creó sesión directa, usar signIn/signUp");
        setError("No se pudo iniciar sesión directamente.");
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      setError(err?.message || "Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow, isSignedIn, signOut]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
      )}
      
    </View>
  );
}
