import { StyleSheet } from "react-native";
import { uiColors } from "../constants/colors";

export default StyleSheet.create({

  container: {
    backgroundColor: uiColors.background,
    flex: 1,
    paddingHorizontal: 40, 
    paddingTop: 20,
  },


  title: {
    color: uiColors.accent,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 40,
  },
  label: {
    color: uiColors.accent,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },

  preview: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    aspectRatio: 1.2,
    borderColor: "#00000022",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,       
    marginBottom: 32,    
  },

  colorSection: {
    marginBottom: 40,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: uiColors.accent,
    marginBottom: 14,
  },

  createButton: {
    alignSelf: "center",
    backgroundColor: uiColors.primary,
    borderRadius: 25,
    elevation: 4,
    marginBottom: 40,
    marginTop: "auto",
    minWidth: 120,
    paddingHorizontal: 40,
    paddingVertical: 15,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    color: uiColors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
