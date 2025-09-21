import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderDiarios from "../../components/HeaderDiarios";
import styles from "../../components/globalStyles"; // Importamos los estilos globales
import colors from "../../constants/colors";

export default function Home() {
  return (
    <View style={styles.container}>
      {/* Header con tabs */}
      <HeaderDiarios />

      {/* Contenido central */}
      <View style={styles.content}>
        <Ionicons name="book-outline" size={80} color={colors.brown} />
        <Text style={styles.message}>CREA UN DIARIO..!</Text>
      </View>

      {/* Botón flotante */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}
