import { StyleSheet } from "react-native";
import { uiColors } from "@/constants/colors";

export default StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 4,
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: uiColors.brown,
  },

  // Lista
  list: {
    paddingHorizontal: 12,
    paddingBottom: 100, 
  },
  columns: {
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  item: {
    flexBasis: "48%",
    maxWidth: "48%",
    flexGrow: 0,
    marginBottom: 12,
  },

  // Tarjeta
  card: {
    borderRadius: 14,
    backgroundColor: uiColors.white,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(218, 196, 196, 0.36)",
  },

  pagePreviewWrap: {
    padding: 10,
  },

  pagePreviewPortrait: {
    width: "100%",
    aspectRatio: 3 / 4, 
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    alignSelf: "center",
    backgroundColor: "#ffffffff",
  },

  previewImage: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 12,
  },

  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: uiColors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  footerText: {
    fontSize: 12,
    color: uiColors.gray,
  },
  footerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFEFCF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: uiColors.background,
  },

  fab: {
  position: "absolute",
  right: 24,
  bottom: 40, 
  backgroundColor: uiColors.primary,
  borderRadius: 28,
  width: 56,
  height: 56,
  alignItems: "center",
  justifyContent: "center",
  elevation: 5,
  shadowColor: uiColors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.5,
  zIndex: 10, 
},

});
