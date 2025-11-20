import { uiColors } from "@/constants/colors";
import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

// Breakpoints SOLO para Android 
const isSmallAndroid = width < 360;  
const isMediumAndroid = width >= 360 && width < 400;  

// Función responsiva con valores estables
const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallAndroid) return small;
  if (isMediumAndroid) return medium;
  return large;
};

export default StyleSheet.create({
 
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: uiColors.background,
  },

  imageColumn: {
    flex: 2, 
  },

  image: {
    height: height / 3, 
    resizeMode: "cover",
  },

  // Imagen vertical izquierda
  imageVertical: {
    width: undefined,
    height: getResponsiveValue(330, 340, 350),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: getResponsiveValue(-22, -20, -18),
    top: 0,
    marginTop: getResponsiveValue(180, 180, 110),
  },

  // Imagen vertical derecha
  imageVertical2: {
    width: undefined,
    height: getResponsiveValue(280, 290, 280),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: getResponsiveValue(85, 88, 100),
    top: 0,
    marginTop: getResponsiveValue(180, 250, 190),
  },

  // Card principal
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: getResponsiveValue(32, 36, 40),
    borderTopRightRadius: getResponsiveValue(32, 36, 40),
    padding: getResponsiveValue(35, 40, 45),
    paddingVertical: getResponsiveValue(28, 32, 35),
    paddingHorizontal: getResponsiveValue(28, 35, 40),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
  },

  // Titulo principal
  title: {
    fontSize: getResponsiveValue(36, 38, 40),
    fontWeight: "bold",
    color: uiColors.primary,
    textAlign: "left",
    marginBottom: -5,
    alignSelf: "flex-start",
  },

  // Subtitulo
  subtitle: {
    fontSize: getResponsiveValue(12, 12, 13),
    color: uiColors.gray,
    textAlign: "left",
    marginTop: getResponsiveValue(8, 10, 10),
    marginBottom: getResponsiveValue(22, 24, 25),
  },

  // Boton principal
  button: {
    backgroundColor: uiColors.primary,
    paddingVertical: getResponsiveValue(13, 14, 15),
    borderRadius: 8,
    alignItems: "center",
  },

  // Texto del boton
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: getResponsiveValue(15, 15, 16),
  },

});