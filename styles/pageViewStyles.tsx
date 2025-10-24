import { StyleSheet } from "react-native";
import { uiColors } from "@/constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    paddingHorizontal: 8,
    height: "100%",
    justifyContent: "center",
  },
  rightButton: {
    position: "absolute",
    right: 20,
    paddingHorizontal: 8,
    height: "100%",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 18,
    color: uiColors.danger,
  },
  nextIcon: {
    fontSize: 18,
    color: uiColors.danger,
  },
  leftGroup: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    padding: 10,
    marginHorizontal: 4,
  },
  checkButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  checkIcon: {
    fontSize: 18,
    color: uiColors.danger,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  toolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  toolPlain: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  toolIcon: {
    fontSize: 20,
    color: uiColors.black,
  },

  // Estilos del modal de deibujo
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80,
  },
  modalMenuContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    marginHorizontal: 20,
  },
  modalOption: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    flex: 1,
    borderRadius: 15,
    minWidth: 80,
  },
  modalOptionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  drawModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
    height: 145,
    marginLeft: 10,
    marginRight: 10,
    width: 380,
  },
  toolsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  toolButton: {
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    minWidth: 90,
  },
  toolButtonActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  toolLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  toolsAndColorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  toolsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolButtonCompact: {
    alignItems: "center",
    marginRight: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },

  toolLabelCompact: {
    fontSize: 11,
    color: "#333",
    marginTop: 3,
  },
  colorsSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 25,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonActive: {
    borderColor: "#2196F3",
    borderWidth: 2,
  },

  colorsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  colorButtonCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  thicknessSliderSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  thicknessSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "left",
    marginRight: 10,
  },
  thicknessSlider: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  thicknessOption: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
  },
  thicknessOptionActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  thicknessDot: {
    backgroundColor: "#333",
  },
  sliderWrapper: {
    flex: 1,
    alignItems: "stretch",
  },
  slider: {
    width: "100%",
    height: 47,
  },
  dotsRow: {
    position: "absolute",
    top: 18,
    left: 8,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
});
