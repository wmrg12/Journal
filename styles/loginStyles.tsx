import { uiColors } from "@/constants/colors";
import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

// Helpers responsivos
const isSmallPhone = width < 375;
const isMediumPhone = width >= 375 && width < 412;
const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
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
  imageVertical: {
    width: undefined,
    height: getResponsiveValue(300, 320, 350),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: getResponsiveValue(-20, -25, -20),
    top: 0,
    marginTop: getResponsiveValue(200, 100, 110),
  },
  imageVertical2: {
    width: undefined,
    height: getResponsiveValue(300, 250, 280),
    aspectRatio: 1 / 1.5,
    resizeMode: "contain",
    position: "absolute",
    left: getResponsiveValue(80, 85, 100),
    top: 0,
    marginTop: getResponsiveValue(210, 170, 190),
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: getResponsiveValue(30, 35, 40),
    borderTopRightRadius: getResponsiveValue(30, 35, 40),
    padding: getResponsiveValue(40, 55, 70),
    paddingVertical: getResponsiveValue(30, 35, 40),
    paddingHorizontal: getResponsiveValue(30, 38, 45),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
  },
  title: {
    fontSize: getResponsiveValue(40, 34, 40),
    fontWeight: "bold",
    color: uiColors.primary,
    textAlign: "left",
    marginBottom: -5,
    alignSelf: "flex-start",
  },
  subtitle: {
    fontSize: getResponsiveValue(13, 12, 13),
    color: uiColors.gray,
    textAlign: "left",
    marginTop: 10,
    marginBottom: 25,
  },
  button: {
    backgroundColor: uiColors.primary,
    paddingVertical: getResponsiveValue(12, 14, 15),
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: getResponsiveValue(17, 15, 16),
  },

});

