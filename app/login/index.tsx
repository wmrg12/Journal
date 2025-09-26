import { View, Text, Image, TouchableOpacity, ActivityIndicator, Dimensions, } from "react-native";
import React from "react";
import styles from "./loginStyles";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import login1 from "../../assets/images/login1.png";
import login2 from "../../assets/images/login2.png";
import login3 from "../../assets/images/login3.png";

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

  
  const { width } = Dimensions.get("window");

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
        redirectUrl: Linking.createURL("/tabs/home", { scheme: "myapp" }),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        const homeUrl = Linking.createURL("tabs/home", { scheme: "myapp" });
        Linking.openURL(homeUrl);
      } else {
        console.warn("No se creó sesión directa");
        setError("No se pudo iniciar sesión directamente.");
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      setError(err?.message || "Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow, isSignedIn, signOut]);

  //Estructura de la pantalla de login
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
          {loading ? (
           <ActivityIndicator color="#fff" />
            ) : (
             <Text style={styles.buttonText}>Iniciar</Text>
            )}
         </TouchableOpacity>
      </View>
    </View>
  );
}