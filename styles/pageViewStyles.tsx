import { StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';

export default StyleSheet.create({
  /* ──────────────── CONTENEDORES PRINCIPALES ──────────────── */
  container: { flex: 1 },
  pageContent: { flex: 1 },
  pageCard: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },

  /* ──────────────── LOADING OVERLAY ──────────────── */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  /* ──────────────── HEADER ──────────────── */
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  leftGroup: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: { padding: 10, marginHorizontal: 4 },
  checkButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', color: uiColors.black },

  /* ──────────────── TOP TOOLBAR ──────────────── */
  topToolbar: {
    height: 56,
    backgroundColor: uiColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: uiColors.background,
  },
  topToolbarLeft: { flexDirection: 'row', alignItems: 'center' },
  topToolbarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  topToolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  topToolbarIcon: {
    padding: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topToolbarPageLabelWrap: { alignItems: 'center', marginBottom: 4 },
  topToolbarPageLabel: { fontSize: 12, color: '#555' },
  disabledIcon: { opacity: 0.4 },

  /* ──────────────── CANVAS ──────────────── */
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1, position: 'relative' },

  /* ──────────────── TOOLBAR INFERIOR ──────────────── */
  toolbarWrap: {
    height: 65,
    backgroundColor: uiColors.background,
    borderTopWidth: 1,
    borderTopColor: uiColors.background,
  },
  toolbarBar: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolItem: {
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  toolItemDisabled: { opacity: 0.4 },
  toolItemIcon: { marginBottom: 3 },
  toolItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: uiColors.black,
  },
  toolItemLabelDisabled: { color: uiColors.gray },

  /* ──────────────── TEXTO EN CANVAS ──────────────── */
  textContainer: { position: 'absolute' },
  textBox: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  textBoxSelected: { borderWidth: 1, borderColor: uiColors.primary },
  textBoxLocked: { borderStyle: 'dashed' },
  textContent: {},
  textToolbar: {
    position: 'absolute',
    top: -30,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textToolbarButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: uiColors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textToolbarDelete: { backgroundColor: uiColors.danger },
  rotateButton: {
    position: 'absolute',
    bottom: -32,
    right: 0,
    backgroundColor: uiColors.gray,
    borderRadius: 20,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  resizeHandle: {
    position: 'absolute',
    top: -16,
    bottom: 0,
    left: -15,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  resizeHandleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: uiColors.primary,
    borderWidth: 2,
    borderColor: uiColors.primary,
    shadowColor: uiColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  /* ──────────────── MODAL DE DIBUJO ──────────────── */
  drawModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  drawModalBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  drawOptionsContainer: {
    backgroundColor: uiColors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
    minHeight: 300,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: uiColors.bord,
  },
  drawIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: uiColors.grayO,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  drawOptionsTitle: { fontSize: 16, fontWeight: '400', color: uiColors.black },

  /* ──────────────── SECCIONES DE DIBUJO ──────────────── */
  toolsSection: { marginBottom: 24 },
  toolsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  toolButtonLarge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: uiColors.white,
    borderWidth: 2,
    borderColor: uiColors.grayO,
    marginHorizontal: 4,
  },
  toolButtonActive: {
    backgroundColor: uiColors.cards,
    borderWidth: 2,
    borderColor: uiColors.primary,
  },
  toolLabelLarge: {
    fontSize: 13,
    color: uiColors.black,
    marginTop: 6,
    fontWeight: '500',
  },
  colorSectionDraw: { marginBottom: 16 },
  colorCircleLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thicknessSection: { marginBottom: 12 },
  drawSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: uiColors.black,
    marginBottom: 10,
  },
  dotBar: {
    position: 'relative',
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dotBarTrack: {
    position: 'absolute',
    left: 19,
    right: 14,
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  dotBarFill: {
    position: 'absolute',
    left: 18,
    height: 3,
    backgroundColor: uiColors.primary,
    borderRadius: 3,
  },
  dotTap: { width: 10, height: 25, alignItems: 'center', justifyContent: 'center' },
  dotSelectable: {
    backgroundColor: uiColors.primary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  /* ──────────────── MODAL DE TEXTO ──────────────── */
  textModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  textModalBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  textOptionsContainer: {
    backgroundColor: uiColors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
    minHeight: 350,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: uiColors.bord,
  },
  textIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: uiColors.grayO,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textIconLetter: { fontSize: 20, fontWeight: '600', color: uiColors.black },
  textOptionsTitle: { fontSize: 16, fontWeight: '400', color: uiColors.black },
  textInput: {
    borderWidth: 1,
    borderColor: uiColors.bord,
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    fontSize: 16,
    color: uiColors.black,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: uiColors.background,
  },

  /* ──────────────── SECCIONES DE TEXTO ──────────────── */
  colorSection: { marginBottom: 20 },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: { borderColor: uiColors.black, borderWidth: 2.5 },
  fontSection: { marginBottom: 20 },
  fontButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: uiColors.grayO,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButtonSelected: {
    backgroundColor: uiColors.bord,
    borderWidth: 1,
    borderColor: uiColors.gray,
  },
  fontButtonText: { fontSize: 14, color: uiColors.gray, fontWeight: '400' },
  fontButtonTextSelected: { color: uiColors.black, fontWeight: '500' },

  /* ──────────────── BOTÓN AÑADIR TEXTO ──────────────── */
  addTextButton: {
    backgroundColor: uiColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addTextButtonText: { color: uiColors.white, fontSize: 16, fontWeight: '600' },

  /* ──────────────── SECCIÓN DE FORMAS ──────────────── */

  shapeContainer: {
    position: 'absolute',
  },

  // Caja que contiene la forma
  shapeBox: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 5,
    overflow: 'visible',
    borderStyle: 'dashed',
  },

  shapeBoxSelected: {
    borderColor: uiColors.primary,
    borderStyle: 'dashed',
  },

  /* ─────────────── BOTONES ALREDEDOR DE LA FORMA ─────────────── */
  shapeControlButton: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: uiColors.primary,
    elevation: 2,
  },

  // Eliminar
  shapeDeleteButton: {
    top: -20,
    left: -20,
    backgroundColor: uiColors.primary,
  },

  // Bloquear
  shapeLockButton: {
    top: -20,
    right: -20,
  },

  shapeLockButtonLocked: {
    backgroundColor: uiColors.primary,
  },

  // Duplicar
  shapeDuplicateButton: {
    bottom: -20,
    left: -20,
    backgroundColor: uiColors.primary,
  },

  // Rotar
  shapeRotateButton: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: uiColors.primary,
    elevation: 2,
  },

  /* ─────────────── HANDLE DE RESIZE  ─────────────── */

  shapeResizeHandle: {
    position: 'absolute',
    bottom: -24,
    left: '50%',
    transform: [{ translateX: -14 }],
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  shapeResizeHandleInner: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: uiColors.primary,
    borderColor: uiColors.primary,
    width: 18,
    height: 8,
  },

  /* ──────────────── MODAL DE FORMAS ──────────────── */

  shapeModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  shapeModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  shapeOptionsContainer: {
    backgroundColor: uiColors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
    minHeight: 320,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  shapeOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: uiColors.bord,
  },

  shapeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: uiColors.grayO,
  },

  shapeOptionsTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: uiColors.black,
  },

  shapeToolsSection: {
    marginBottom: 5,
  },

  shapeSectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: uiColors.black,
  },

  shapeToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  shapeToolButtonLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: uiColors.grayO,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
  },

  shapeToolButtonActive: {
    backgroundColor: uiColors.cards,
    borderWidth: 2,
    borderColor: uiColors.primary,
  },

  shapeToolLabelLarge: {
    marginLeft: 4,
    fontSize: 12,
    color: uiColors.black,
  },

  shapeColorSection: {
    marginBottom: 20,
  },

  shapeColorCircleLarge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  shapeColorCircleSelected: {
    borderWidth: 2.5,
    borderColor: uiColors.black,
  },

  shapeAddButton: {
    backgroundColor: uiColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  shapeAddButtonText: {
    color: uiColors.white,
    fontWeight: '600',
    fontSize: 16,
  },

  /* ──────────────── MODAL DE AUDIO ──────────────── */
  audioModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  audioModalBackground: {
    flex: 1,
  },
  audioOptionsContainer: {
    backgroundColor: uiColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '50%',
  },
  audioOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  audioOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 10,
    marginTop: -6,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    minHeight: 85,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  optionIconContainer: {
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: uiColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 0,
  },
  recordingIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FEE2E2',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingTime: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1F2937',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: uiColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
