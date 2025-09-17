import { StyleSheet } from "react-native";
import colors from "../../constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.rosaMedioOscuro,
  },
  button: {
    padding: 10,
    margin: 20,
    backgroundColor: colors.rosaClaro,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    textAlign: "center",
    color: "#fff",
  },
});
