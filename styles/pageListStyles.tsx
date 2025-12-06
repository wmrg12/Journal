import { uiColors } from "@/constants/colors";
import { StyleSheet } from "react-native";
import { rw, rh, rf } from "@/utils/responsive";

export default StyleSheet.create({
  // Header 
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rw(20),
    paddingTop: rh(44),
    paddingBottom: rh(16),
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: "700",
    color: uiColors.white,
    letterSpacing: 0.3,
  },

  list: {
    paddingHorizontal: rw(16),
    paddingTop: rh(8),
    paddingBottom: rh(120),
  },
  columns: {
    justifyContent: "space-between",
    gap: rw(16),
    paddingVertical: rh(8),
  },
  item: {
    flexBasis: "47%",
    maxWidth: "47%",
    flexGrow: 0,
    marginBottom: rh(8),
  },

  card: {
    borderRadius: rw(18),
    backgroundColor: uiColors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: uiColors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    width: "100%",
    aspectRatio: 0.45,
    borderWidth: 0,
  },

  pagePreviewWrap: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },

  pagePreviewPortrait: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: rw(18),
    borderTopRightRadius: rw(18),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#ffffffff",
    overflow: "hidden",
  },

  pageNumberText: {
    color: uiColors.white,
    fontSize: rf(11),
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
    paddingHorizontal: rw(14),
    paddingVertical: rh(5),
    backgroundColor: uiColors.white,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.04)",
  },
  footerText: {
    fontSize: rf(13),
    fontWeight: "600",
    color: uiColors.brown,
    letterSpacing: 0.2,
  },
  footerIcon: {
    width: rw(28),
    height: rw(28),
    borderRadius: rw(15),
    backgroundColor: "#FFF4E0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFE4B5",
  },

  contentIndicators: {
    position: "absolute",
    bottom: rh(5),
    right: rw(1),
    flexDirection: "row",
    gap: rw(6),
    backgroundColor: "transparent",
    paddingHorizontal: rw(8),
    paddingVertical: rh(4),
    borderRadius: rw(12),
  },

  fab: {
    position: "absolute",
    right: rw(24),
    bottom: rh(28),
    backgroundColor: uiColors.primary,
    borderRadius: rw(30),
    width: rw(58),
    height: rw(58),
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
    paddingVertical: rh(60),
    gap: rw(16),
  },
  emptyText: {
    fontSize: rf(16),
    color: uiColors.gray,
    textAlign: "center",
    marginTop: rh(12),
  },
});