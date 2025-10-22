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
});
