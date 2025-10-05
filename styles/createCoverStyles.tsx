import { StyleSheet } from "react-native";
import { uiColors } from "@/constants/colors";

export const diaryStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },


  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: uiColors.background,
  },
  backButton: {
    padding: 5,
  },
  backArrow: {
    fontSize: 24,
    color: uiColors.accent,
    fontWeight: "500",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: uiColors.accent,
    width: 28, 
    height: 28,
  },


  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 20,
  },


  diaryPreview: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  diary: {
    width: 130,
    height: 180,
    borderRadius: 8,
    position: "relative",
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diaryBinding: {
    position: "absolute",
    right: 20,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: uiColors.white,
    opacity: 0.7,
  },


  inputContainer: {
    marginBottom: 32,
  },
  nameInput: {
    borderBottomWidth: 1,
    borderBottomColor: uiColors.gray,
    paddingVertical: 12,
    fontSize: 16,
    color: uiColors.black,
    fontFamily: "System",
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

  
  saveButton: {
    backgroundColor: uiColors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: "center",
    minWidth: 120,
    marginTop: "auto",
    marginBottom: 40,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: uiColors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  
  bottomIndicator: {
    width: 134,
    height: 5,
    backgroundColor: uiColors.black,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 8,
    opacity: 0.3,
  },
});