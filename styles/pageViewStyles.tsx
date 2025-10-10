import { StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  backIcon: {
    fontSize: 18,
    color: uiColors.danger,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  canvas: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 20,
    color: '#333',
  },
});
