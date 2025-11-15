import styles from "@/styles/loginStyles";
import { useAuth, useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { ActivityIndicator, Dimensions, Image, Keyboard, Text, TouchableOpacity, View } from "react-native";
import login1 from "../../assets/images/login1.png";
import login2 from "../../assets/images/login2.png";
import login3 from "../../assets/images/login3.png";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function LoginScreen() {
  useWarmUpBrowser();

  const { width } = Dimensions.get("window");
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { isSignedIn } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isRunningRef = React.useRef(false); 

  // Frecuencia de sesiones
  React.useEffect(() => {
    if (isSignedIn) {
      Keyboard.dismiss();
      const homeUrl = Linking.createURL("/tabs/home", { scheme: "myapp" });
      Linking.openURL(homeUrl);
    }
  }, [isSignedIn]);

  const onPress = React.useCallback(async () => {
    if (isRunningRef.current || loading) return;
    isRunningRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = Linking.createURL("/tabs/home", { scheme: "myapp" });
      const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId) {
        Keyboard.dismiss();
        await setActive?.({ session: createdSessionId });
        const homeUrl = Linking.createURL("/tabs/home", { scheme: "myapp" });
        Linking.openURL(homeUrl);
        return;
      }

      if (signIn || signUp) {
        Keyboard.dismiss();
        const homeUrl = Linking.createURL("/tabs/home", { scheme: "myapp" });
        Linking.openURL(homeUrl);
        return;
      }

      setError("No se pudo iniciar sesión directamente.");
    } catch (err: any) {
      console.error("OAuth error", err);
      setError(err?.message || "Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
      isRunningRef.current = false;
    }
  }, [startOAuthFlow, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.imageColumn}>
        <Image source={login1} style={[styles.image, { width }]} />
        <Image source={login2} style={styles.imageVertical} resizeMode="contain" />
        <Image source={login3} style={[styles.imageVertical2, { width }]} resizeMode="contain" />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bienvenido a </Text>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          Tu espacio para capturar ideas, planear tu día y disfrutar creando tus diarios.
          ¡Inicia sesión y empieza a escribir!
        </Text>

        <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar</Text>}
        </TouchableOpacity>

        {!!error && (
          <Text style={{ marginTop: 12, color: "#dc2626", textAlign: "center" }}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}
