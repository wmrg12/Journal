import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import styles from "@/styles/globalStyles";

export default function Help() {
  const router = useRouter();

  const contactOptions = [
    {
      id: 1,
      title: "Aliza Vicente",
      description: "wmrg12",
      email: "alizaabigailvicenteguzman@gmail.com",
      profileImage: require("@/assets/images/profiles/Aliza.png"), 
      color: "#408c55ff",
      bgColor: "#e0fadbff"
    },
    {
      id: 2,
      title: "Adriana Soto",
      description: "sweethv7",
      email: "soto7adriana@gmail.com",
      profileImage: require("@/assets/images/profiles/Adri.png"), 
      color: "#a558aaff",
      bgColor: "#f3d6f4ff"
    },
    {
      id: 3,
      title: "Leticia Loredo",
      description: "lets04",
      email: "letiloredosalazar2004@hotmail.com",
      profileImage: require("@/assets/images/profiles/Leti2.png"),
      color: "#ed4bcaff",
      bgColor: "#f4cfebff"
    },
  ];

  const handleEmailPress = (email: string, subject: string) => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            "Error",
            "No se pudo abrir el cliente de correo. Por favor, envía un email a: " + email,
            [
              {
                text: "Copiar email",
                onPress: () => {
                  Alert.alert("Email", email);
                }
              },
              { text: "Cerrar" }
            ]
          );
        }
      })
      .catch((err) => {
        console.error("Error al abrir email:", err);
        Alert.alert("Error", "No se pudo abrir el cliente de correo");
      });
  };

  return (
    <View style={[styles.container, styles.containerhelp]}>
      {/* Header */}
      <View style={styles.headerhelp}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonhelp}
        >
          <Ionicons name="arrow-back" size={22} color="#c32a2cff" />
        </TouchableOpacity>
        <Text style={styles.headerTitlehelp}>
          Centro de Ayuda
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.scrollContenthelp}>
          
          {/* Descripción */}
          <View style={styles.descriptionCardhelp}>
            <View style={styles.descriptionHeaderhelp}>
              <View style={styles.descriptionIconContainerhelp}>
                <Ionicons name="information-circle" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.descriptionTitlehelp}>
                ¿Necesitas ayuda?
              </Text>
            </View>
            <Text style={styles.descriptionTexthelp}>
              Estamos aquí para ayudarte. Puedes comunicarte con nosotras y nos pondremos en contacto contigo lo antes posible.
            </Text>
          </View>

          {/* Título de sección */}
          <Text style={styles.sectionTitlehelp}>
            Centro de Contactos
          </Text>

          {/* Opciones de contacto */}
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleEmailPress(option.email, option.title)}
              style={styles.contactCardhelp}
            >
              {/* Contenedor de foto de perfil */}
              <View style={[
                styles.contactIconContainerhelp,
                { 
                  backgroundColor: option.bgColor,
                  overflow: "hidden", // Importante para el borderRadius
                  padding: 0,
                }
              ]}>
                <Image 
                  source={option.profileImage}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                  }}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log("Error cargando imagen:", error.nativeEvent.error);
                  }}
                />
              </View>

              <View style={styles.contactContenthelp}>
                <Text style={styles.contactTitlehelp}>
                  {option.title}
                </Text>
                <Text style={styles.contactDescriptionhelp}>
                  {option.description}
                </Text>
                <Text style={[
                  styles.contactEmailhelp,
                  { color: option.color }
                ]}>
                  {option.email}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}

          {/* Información adicional */}
          <View style={styles.infoCardhelp}>
            <View style={styles.infoCardContenthelp}>
              <Ionicons name="time-outline" size={20} color="#7cb96bff" style={styles.infoIconhelp} />
              <View style={styles.infoTextContainerhelp}>
                <Text style={styles.infoTitlehelp}>
                  Tiempo de respuesta
                </Text>
                <Text style={styles.infoTexthelp}>
                  Nuestro equipo responde en un plazo de 24-48 horas hábiles.
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}