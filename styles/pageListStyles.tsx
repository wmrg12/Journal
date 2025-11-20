import { uiColors } from "@/constants/colors";
import { Dimensions, StyleSheet } from "react-native";

// Helpers responsivos
const { width: screenWidth } = Dimensions.get("window");
const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;
const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

export default StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
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
    paddingHorizontal: getResponsiveValue(14, 8, 10),
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
    marginBottom: getResponsiveValue(12, 14, 16),
  },

  // Tarjeta
  card: {
    borderRadius: getResponsiveValue(10, 15, 18),
    backgroundColor: uiColors.white,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(151, 146, 146, 0.36)",
    width: 180,
    height: 295,
    paddingHorizontal: 0,
    alignItems: "center",
  },

  pagePreviewWrap: {
    padding: 0,
    width: "100%",
    height: "100%",
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 12,
    backgroundColor: "transparent",

  },

  pagePreviewPortrait: {
    flex: 1,
    height: 300,
    width: 160,
    borderRadius: getResponsiveValue(12, 13, 15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 23, 23, 0.07)",
    alignSelf: "center",
    backgroundColor: "#ffffffff",
    overflow: "hidden",
  },

  pageNumberText: {
    color: uiColors.white,
    fontSize: getResponsiveValue(10, 11, 12),
    fontWeight: "600",
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: uiColors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  footerText: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: uiColors.gray,
  },
  footerIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFEFCF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: uiColors.background,
  },

  fab: {
    position: "absolute",
    right: getResponsiveValue(18, 22, 24),
    bottom: getResponsiveValue(21, 12, 16),
    backgroundColor: uiColors.primary,
    borderRadius: 28,
    width: getResponsiveValue(52, 54, 56),
    height: getResponsiveValue(52, 54, 56),
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
