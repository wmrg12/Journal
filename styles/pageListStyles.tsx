import { uiColors } from "@/constants/colors";
import { Dimensions, StyleSheet } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;

const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

const cardWidth = (screenWidth - 48) / 2; 
const cardHeight = cardWidth * 1.45; 

export default StyleSheet.create({
  // Header mejorado
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: getResponsiveValue(44, 40, 52),
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: "700",
    color: uiColors.brown,
    letterSpacing: 0.3,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  columns: {
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 8,
  },
  item: {
    flexBasis: "47%",
    maxWidth: "47%",
    flexGrow: 0,
    marginBottom: 8,
  },

  card: {
    borderRadius: getResponsiveValue(16, 18, 20),
    backgroundColor: uiColors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: uiColors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    width: "100%",
    aspectRatio: 0.55, 
    borderWidth: 0,
  },

  pagePreviewWrap: {
    flex: 1,
    width: "100%",
    borderRadius: getResponsiveValue(16, 18, 20),
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },

  pagePreviewPortrait: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: getResponsiveValue(16, 18, 20),
    borderTopRightRadius: getResponsiveValue(16, 18, 20),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  pageNumberText: {
    color: uiColors.white,
    fontSize: getResponsiveValue(10, 11, 12),
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  previewImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: uiColors.white,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
  },
  footerText: {
    fontSize: getResponsiveValue(12, 13, 14),
    fontWeight: "600",
    color: uiColors.brown,
    letterSpacing: 0.2,
  },
  footerIcon: {
    width: getResponsiveValue(28, 28, 30),
    height: getResponsiveValue(26, 28, 30),
    borderRadius: 15,
    backgroundColor: "#FFF4E0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFE4B5",
  },

  contentIndicators: {
    position: "absolute",
    bottom: 5,
    right: 1,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  fab: {
    position: "absolute",
    right: getResponsiveValue(20, 24, 28),
    bottom: getResponsiveValue(24, 28, 32),
    backgroundColor: uiColors.primary,
    borderRadius: 30,
    width: getResponsiveValue(56, 58, 60),
    height: getResponsiveValue(56, 58, 60),
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: uiColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 10,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: uiColors.gray,
    textAlign: "center",
    marginTop: 12,
  },
});