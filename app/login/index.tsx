//login/index.tsx
import styles from "@/styles/loginStyles";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { 
  ActivityIndicator, 
  Dimensions, 
  Image, 
  Text, 
  TouchableOpacity, 
  View,
  Alert 
} from "react-native";
import login1 from "../../assets/images/login1.png";
import login2 from "../../assets/images/login2.png";
import login3 from "../../assets/images/login3.png";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => { 
      void WebBrowser.coolDownAsync(); 
    };
  }, []);
};

export default function LoginScreen() {
  useWarmUpBrowser();

  const { width } = Dimensions.get("window");
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [loading, setLoading] = React.useState(false);
  const isRunningRef = React.useRef(false); 

  const onPress = React.useCallback(async () => {
    if (isRunningRef.current || loading) return;
    
    isRunningRef.current = true;
    setLoading(true);

    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        console.log('Sesión creada, activando...');
        await setActive?.({ session: createdSessionId });
        console.log('Sesión activada - La navegación será manejada automáticamente');
        return;
      }

      Alert.alert('Error', 'No se pudo iniciar sesión. Intenta nuevamente.');
      setLoading(false);
      isRunningRef.current = false;
    } catch (err: any) {
      console.error("OAuth error:", err);
      Alert.alert(
        'Error de autenticación',
        err?.message || 'Ocurrió un error desconocido. Intenta nuevamente.'
      );
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

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={onPress} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar con Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}