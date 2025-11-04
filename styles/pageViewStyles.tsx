import { StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';

export default StyleSheet.create({
  container: { flex: 1 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Header
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
  navButton: {
    padding: 10,
    marginHorizontal: 4,
  },
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: uiColors.black,
  },

  // Canvas
  canvas: {
    flex: 1,
    marginBottom: 0,
  },

  // Textos en canvas
  textContainer: {
    position: 'absolute',
  },
  textContent: {},

  // Toolbar horizontal fijo en la parte inferior
  toolbarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: uiColors.white,
    borderTopWidth: 1,
    borderTopColor: uiColors.bord,
    paddingBottom: 8,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
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
  toolItemDisabled: {
    opacity: 0.4,
  },
  toolItemIcon: {
    marginBottom: 3,
  },
  toolItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: uiColors.black,
  },
  toolItemLabelDisabled: {
    color: uiColors.gray,
  },
  // Texto en canvas
  textBox: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  textBoxSelected: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  textBoxLocked: {
    borderStyle: 'dashed',
  },
  textToolbar: {
    position: 'absolute',
    top: -26,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textToolbarButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textToolbarDelete: {
    backgroundColor: uiColors.danger,
  },
  rotateButton: {
    position: 'absolute',
    bottom: -32,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // Modal de dibujo
  drawModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  drawOptionsTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: uiColors.black,
  },

  // Sección de herramientas
  toolsSection: {
    marginBottom: 24,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolButtonLarge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: uiColors.grayO,
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

  // Sección de colores para dibujo
  colorSectionDraw: {
    marginBottom: 16,
  },
  colorCircleLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Sección de grosor
  thicknessSection: {
    marginBottom: 12,
  },
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
  dotTap: {
    width: 10,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelectable: {
    backgroundColor: uiColors.primary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  // Modal de texto
  textModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  textModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  textIconLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: uiColors.black,
  },
  textOptionsTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: uiColors.black,
  },
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

  // Sección de colores para texto
  colorSection: {
    marginBottom: 20,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: uiColors.black,
    borderWidth: 2.5,
  },

  // Sección de fuentes
  fontSection: {
    marginBottom: 20,
  },
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
  fontButtonText: {
    fontSize: 14,
    color: uiColors.gray,
    fontWeight: '400',
  },
  fontButtonTextSelected: {
    color: uiColors.black,
    fontWeight: '500',
  },

  // Botón de añadir texto
  addTextButton: {
    backgroundColor: uiColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addTextButtonText: {
    color: uiColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
