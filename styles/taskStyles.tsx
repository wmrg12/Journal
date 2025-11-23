import { uiColors } from "../constants/colors";
import { StyleSheet } from "react-native";
import { rw, rh, rf } from "@/utils/responsive";

export const stylest = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
    paddingHorizontal: rw(20),
    paddingTop: 0,
  },

  // Header 
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: rh(23),
    paddingBottom: rh(18),
  },
  title: {
    fontSize: rf(46),
    fontWeight: "800",
    color: uiColors.danger,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: rh(20),
    fontSize: rf(15),
    color: uiColors.gray,
    marginBottom: rh(8),
    fontWeight: "600",
  },
  addBtn: {
    marginTop: rh(15),
    paddingHorizontal: rw(18),
    paddingVertical: rh(10),
    backgroundColor: uiColors.buttont,
    borderRadius: rw(10),
    borderWidth: 1,
    borderColor: uiColors.bord,
  },
  addBtnText: {
    fontSize: rf(14),
    color: uiColors.gray,
    fontWeight: "600",
  },

  // listas
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: rh(25),
  },

  listBlock: { marginBottom: rh(1) },
  completedBlock: {
    marginTop: rh(6),
    paddingTop: rh(15),
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  sectionTitle: {
    fontSize: rf(15),
    color: uiColors.gray,
    marginBottom: rh(25),
    fontWeight: "600",
  },
  separator: { height: rh(12) },
  emptyText: {
    textAlign: "center",
    color: uiColors.gray,
    fontSize: rf(16),
    marginTop: rh(14),
    marginVertical: rh(30),
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: uiColors.primary,
    borderRadius: rw(14),
    paddingVertical: rh(14),
    paddingHorizontal: rw(14),
  },
  cardPending: {
    backgroundColor: uiColors.cards,
  },
  cardCompleted: {
    backgroundColor: uiColors.cards,
    borderRadius: rw(14),
  },
  cardPressed: { opacity: 0.85 },
  leftIcon: { marginRight: rw(12) },
  cardText: { flex: 1, fontSize: rf(16), color: uiColors.gray },

  // Circulo checkbox 
  checkboxCircle: {
    width: rw(24),
    height: rw(24),
    borderRadius: rw(12),
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
    fontSize: rf(15),
    fontWeight: "bold",
    color: uiColors.gray,
  },

  // Botón eliminar
  deleteCircle: {
    width: rw(26),
    height: rw(26),
    borderRadius: rw(13),
    backgroundColor: uiColors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteX: {
    color: uiColors.white,
    fontSize: rf(16),
    fontWeight: "700",
    marginTop: rh(-1),
  },

  // Boton guardar 
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(29, 29, 29, 0.35)",
    justifyContent: "center",
    paddingHorizontal: rw(24),
  },
  modalCard: {
    backgroundColor: uiColors.white,
    borderRadius: rw(14),
    padding: rw(16),
    gap: rh(20),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: rw(8),
    justifyContent: "space-between",
  },
  modalTitle: {
    color: uiColors.gray,
    fontWeight: "800",
    fontSize: rf(16),
  },
  modalClose: {
    fontSize: rf(20),
    color: uiColors.gray,
    paddingHorizontal: rw(6),
  },
  modalInput: {
    backgroundColor: uiColors.white,
    borderRadius: rw(10),
    borderWidth: 1,
    borderColor: uiColors.bord,
    paddingHorizontal: rw(12),
    paddingVertical: rh(10),
    fontSize: rf(15),
  },
  saveBtn: {
    alignSelf: "flex-end",
    backgroundColor: uiColors.danger,
    paddingHorizontal: rw(16),
    paddingVertical: rh(10),
    borderRadius: rw(8),
  },
  saveBtnText: {
    color: uiColors.bord,
    fontWeight: "700",
    fontSize: rf(13),
  },
});