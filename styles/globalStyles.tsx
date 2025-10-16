import { StyleSheet, Platform } from "react-native";
import { uiColors } from "../constants/colors";

const styles = StyleSheet.create({
  // --- Estilos Globales ---
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -90,
  },

  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: uiColors.black,
  },

  fab: {
    position: "absolute",
    bottom: 98,
    right: 18,
    backgroundColor: uiColors.primary,
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  // --- Barra de Filtros / Tabs / Home ---
  searchButton: { padding: 6, marginLeft: 12 },

  tabsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: uiColors.white,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    paddingVertical: 0,
    width: 240,
    borderWidth: 1,
    borderColor: uiColors.white,
  },

  tab: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "transparent",
    zIndex: 1,
  },

  tabText: {
    fontSize: 16,
    color: uiColors.danger,
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
  activeTabText: { fontWeight: "bold" },

  indicator: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: 2,
    width: 136,
    backgroundColor: uiColors.rgba,
    borderRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    zIndex: 0,
  },

  // --- filtros de tab ---
  containerTab: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    backgroundColor: uiColors.white,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  indicatorTab: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 18,
    height: 48,
    backgroundColor: uiColors.rgba,
    borderRadius: 10,
    zIndex: 0,
  },
  rowTab: { flexDirection: "row", flex: 1, justifyContent: "space-around" },
  tabButton: { paddingVertical: 10, alignItems: "center", justifyContent: "center", zIndex: 1 },
  tabLabel: { marginLeft: 6 },
  homeRowTab: { flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
  iconOnTop: { zIndex: 10 },

  // --- Grid de diarios ---
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 96,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 96,
  },

  card: {
    width: 140,
    height: 180,
    margin: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center", 
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHL: { borderWidth: 2, borderColor: "#FFB300" },
  cardTitle: { textAlign: "center", color: uiColors.gray, fontWeight: "600", fontSize: 18, 
    fontFamily: Platform.select({
    ios: "Times New Roman",
    android: "serif",
    default: "serif",
  }),
  },

  cardWrapper: {
    alignItems: "center",
    marginBottom: 8, 

  },
  // --- fecha ---
  cardDate: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(0,0,0,0.65)",
    textTransform: "lowercase",
    marginTop: -4,
  },
  
  // --- favorito ---
  favWrap: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
  },
  favBtn: {
    width: 34,
    height: 34,
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    elevation: 0,
  },
  favBtnActive: {
    backgroundColor: "rgba(230,57,70,0.22)",
    borderWidth: 1,
    borderColor: "rgba(230,57,70,0.55)",
  },

} as const);

export default styles;
