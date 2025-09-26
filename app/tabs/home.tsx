import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderDiarios from "../../components/HeaderDiarios";
import styles from "../../components/globalStyles"; // Importamos los estilos globales
import colors from "../../constants/colors";
import { router } from "expo-router";

export default function Home() {
  const journalId = "debug-journal";
  return (
    <View style={styles.container}>

      <HeaderDiarios />

      {/* Contenido central */}
      <View style={styles.content}>
        <Ionicons name="book-outline" size={80} color={colors.brown} />
        <Text style={styles.message}>CREA UN DIARIO..!</Text>
      </View>

      {/* Boton */}
      <TouchableOpacity
      style={styles.fab}
      onPress={() =>
        router.push({
          pathname: "../pages/create",
          params: { journalId },
        })
      }
    >
      <Ionicons name="add" size={28} color={colors.white} />
    </TouchableOpacity>
    </View>
  );
}
