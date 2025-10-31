import { uiColors } from "../constants/colors";
import { StyleSheet } from "react-native";

export const stylest = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  // Header 
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 23,
    paddingBottom: 18,
  },
  title: {
    fontSize: 46,
    fontWeight: "800",
    color: uiColors.danger,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: uiColors.gray,
    marginBottom: 14,
    fontWeight: "600",
  },
  addBtn: {
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: uiColors.buttont,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: uiColors.bord,
  },
  addBtnText: {
    fontSize: 14,
    color: uiColors.gray,
    fontWeight: "600",
  },

  // listas

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24, 
  },

  listBlock: { marginBottom: 20 },
  completedBlock: {
    marginTop: 6,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: uiColors.white,
  },
  sectionTitle: {
    fontSize: 15,
    color: uiColors.gray,
    marginBottom: 14,
    fontWeight: "600",
  },
  separator: { height: 12 },
  emptyText: {
    textAlign: "center",
    color: uiColors.gray,
    fontSize: 16,
    marginTop: 15,
    marginVertical: 30,
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: uiColors.cards,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardPending: {
    backgroundColor: uiColors.cards,
  },
  cardCompleted: {
    backgroundColor: uiColors.cards,
    borderRadius: 14,
  },
  cardPressed: { opacity: 0.85 },
  leftIcon: { marginRight: 12 },
  cardText: { flex: 1, fontSize: 16, color: uiColors.gray},

  // Circulo checkbox 
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: uiColors.white,
    borderWidth: 2,
    borderColor: uiColors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCircleChecked: {
    borderColor: uiColors.white,
  },
  checkmark: {
    fontSize: 15,
    fontWeight: "bold",
    color: uiColors.gray,
  },

  // Botón eliminar
  deleteCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: uiColors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteX: {
    color: uiColors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: -1,
  },

  // Boton guardar 
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(29, 29, 29, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: uiColors.white,
    borderRadius: 14,
    padding: 16,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  modalTitle: {
    color: uiColors.gray,
    fontWeight: "800",
    fontSize: 16,
  },
  modalClose: {
    fontSize: 20,
    color: uiColors.gray,
    paddingHorizontal: 6,
  },
  modalInput: {
    backgroundColor: uiColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: uiColors.bord,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveBtn: {
    alignSelf: "flex-end",
    backgroundColor: uiColors.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: uiColors.bord,
    fontWeight: "700",
    fontSize: 13,
  },
});

