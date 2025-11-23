import { uiColors } from "@/constants/colors";
import { StyleSheet } from "react-native";
import { rw, rh, rf } from "@/utils/responsive";

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
    height: rh(267),
    resizeMode: "cover",
  },

  // Imagen vertical izquierda
  imageVertical: {
    width: undefined,
    height: rh(360),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: rw(-20),
    top: 0,
    marginTop: rh(180),
  },

  // Imagen vertical derecha
  imageVertical2: {
    width: undefined,
    height: rh(350),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: rw(88),
    top: 0,
    marginTop: rh(210),
  },

  // Card principal
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: rw(36),
    borderTopRightRadius: rw(36),
    padding: rw(40),
    paddingVertical: rh(32),
    paddingHorizontal: rw(32),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
  },

  // Titulo principal
  title: {
    fontSize: rf(38),
    fontWeight: "bold",
    color: uiColors.primary,
    textAlign: "left",
    marginBottom: -5,
    alignSelf: "flex-start",
  },

  // Subtitulo
  subtitle: {
    fontSize: rf(12),
    color: uiColors.gray,
    textAlign: "left",
    marginTop: rh(10),
    marginBottom: rh(24),
  },

  // Boton principal
  button: {
    backgroundColor: uiColors.primary,
    paddingVertical: rh(14),
    borderRadius: rw(8),
    alignItems: "center",
  },

  // Texto del boton
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: rf(15),
  },

});