import { StyleSheet } from "react-native";
import { color } from "@/constants/colors";

export const diaryStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: color.background,
  },
  backButton: { padding: 5 },
  backArrow: { fontSize: 24, color: color.accent, fontWeight: "500" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: color.accent,
  },
  content: { flex: 1, paddingHorizontal: 40, paddingTop: 20 },
  diaryPreview: { alignItems: "center", marginBottom: 32, marginTop: 12 },
  diary: {
    width: 130, height: 180, borderRadius: 8, position: "relative",
    shadowColor: color.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  diaryBinding: {
    position: "absolute", right: 20, top: 0, bottom: 0, width: 2,
    backgroundColor: color.white, opacity: 0.7,
  },
  inputContainer: { marginBottom: 32 },
  nameInput: {
    borderBottomWidth: 1, borderBottomColor: color.grey,
    paddingVertical: 12, fontSize: 16, color: color.black, fontFamily: "System",
  },
  colorSection: { marginBottom: 40 },
  colorLabel: {
    fontSize: 16, fontWeight: "600", color: color.accent, marginBottom: 14,
  },
  saveButton: {
    backgroundColor: color.primary, paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 25, alignSelf: "center", minWidth: 120,
    marginTop: "auto", marginBottom: 40,
    shadowColor: color.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  saveButtonText: { color: color.white, fontSize: 16, fontWeight: "600", textAlign: "center" },
  bottomIndicator: {
    width: 134, height: 5, backgroundColor: color.black, borderRadius: 2.5,
    alignSelf: "center", marginBottom: 8, opacity: 0.3,
  },
});
