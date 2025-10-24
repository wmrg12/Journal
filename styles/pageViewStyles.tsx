import { StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
  },
  rightButton: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
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
  checkIcon: {
    fontSize: 18,
    color: uiColors.danger,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  toolPlain: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: {
    fontSize: 20,
    color: uiColors.black,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 90,
  },
  modalMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    marginHorizontal: 20,
  },
  modalOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    flex: 1,
    borderRadius: 15,
    minWidth: 100,
  },
  modalOptionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  colorCircleSelected: {
    borderColor: '#333',
    borderWidth: 2.5,
  },

  // Estilos del modal de texto
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
    minHeight: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
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
    borderBottomColor: '#e0e0e0',
  },

  textIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  textIconLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  textOptionsTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
  },

  // Input de texto
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },

  // Sección de colores
  colorSection: {
    marginBottom: 20,
  },

  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 16,
    marginRight: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Sección de fuentes
  fontSection: {
    marginBottom: 20,
  },

  fontButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fontButtonSelected: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  fontButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },

  fontButtonTextSelected: {
    color: '#333',
    fontWeight: '500',
  },

  // Botón añadir texto
  addTextButton: {
    backgroundColor: '#2467a5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  addTextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
