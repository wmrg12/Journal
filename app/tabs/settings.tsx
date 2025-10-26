import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import styles from "@/styles/globalStyles";

export default function Settings() {
  const { signOut } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Cierrar sesion
      await signOut();

      const loginUrl = Linking.createURL("/login", { scheme: "myapp" });
      Linking.openURL(loginUrl);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 20 }}>
        Configuración
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#ef4444",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 10,
          alignItems: "center",
        }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Cerrar sesion</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
