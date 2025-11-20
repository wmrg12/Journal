import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { getSyncInstance } from "../../src/service/supabaseSync";
import { Ionicons } from "@expo/vector-icons";
import styles from "@/styles/globalStyles";

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      console.log('Cerrando sesion...');
      
      // Destruir sincronizacion
      const syncService = getSyncInstance();
      if (syncService) {
        syncService.destroy();
        console.log('Sync service destruido');
      }
      
      // Cerrar sesion en Clerk
      await signOut();
      console.log('Sesion cerrada en Clerk');
      // Limpieza
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navegar a login
      console.log('Navegando a login...');
      router.replace('/login');
      
    } catch (error) {
      console.error("Error al cerrar sesion:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToHelp = () => {
    router.push('/settings/help');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainersett}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <Text style={styles.headerTitlesett}>
          Configuracion
        </Text>

        {/* Seccion de Perfil */}
        <View style={styles.profileCardsett}>
          {/* Foto de perfil */}
          <View style={styles.profileImageContainersett}>
            {user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                style={styles.profileImagesett}
              />
            ) : (
              <Ionicons name="person" size={50} color="#9ca3af" />
            )}
          </View>

          {/* Nombre del usuario */}
          <Text style={styles.profileNamesett}>
            {user?.fullName || "Usuario"}
          </Text>
          
          <Text style={styles.profileEmailsett}>
            {user?.primaryEmailAddress?.emailAddress || ""}
          </Text>
        </View>

        {/* Informacion de la Cuenta */}
        <View style={styles.accountCardsett}>
          <Text style={styles.accountTitlesett}>
            Informacion de la cuenta
          </Text>

          {/* Nombre completo */}
          <View style={styles.accountInfoRowsett}>
            <View style={[styles.accountIconContainersett, styles.accountIconBgBluesett]}>
              <Ionicons name="person-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.accountInfoContentsett}>
              <Text style={styles.accountInfoLabelsett}>
                Nombre completo
              </Text>
              <Text style={styles.accountInfoValuesett}>
                {user?.fullName || "No disponible"}
              </Text>
            </View>
          </View>

          {/* Correo electronico */}
          <View style={styles.accountInfoRowLastsett}>
            <View style={[styles.accountIconContainersett, styles.accountIconBgYellowsett]}>
              <Ionicons name="mail-outline" size={20} color="#f59e0b" />
            </View>
            <View style={styles.accountInfoContentsett}>
              <Text style={styles.accountInfoLabelsett}>
                Correo electronico
              </Text>
              <Text style={styles.accountInfoValuesett}>
                {user?.primaryEmailAddress?.emailAddress || "No disponible"}
              </Text>
            </View>
          </View>
        </View>

        {/* Centro de Ayuda */}
        <TouchableOpacity
          onPress={navigateToHelp}
          style={styles.helpButtonsett}
        >
          <View style={styles.helpButtonContentsett}>
            <View style={styles.helpIconContainersett}>
              <Ionicons name="help-circle-outline" size={22} color="#10b981" />
            </View>
            <View>
              <Text style={styles.helpTitlesett}>
                Centro de Ayuda
              </Text>
              <Text style={styles.helpDescriptionsett}>
                Contacto y soporte
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Boton de Cerrar Sesion */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButtonsett}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIconsett} />
              <Text style={styles.logoutButtonTextsett}>
                Cerrar sesion
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}