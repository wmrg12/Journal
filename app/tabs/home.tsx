import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "../../components/globalStyles"; // Importamos los estilos globales
import HeaderDiarios from "../../components/headerDiary";
import colors from "../../constants/colors";

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
