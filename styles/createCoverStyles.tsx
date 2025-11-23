import { StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';
import { rw, rh, rf } from '@/utils/responsive';

export const diaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
    paddingHorizontal: rw(10),

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rw(16),
    paddingVertical: rh(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: rh(28),
    
  },
  backButton: {
    padding: rw(8),
    width: rw(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    color: uiColors.danger,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: rw(44),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rw(20),
    paddingTop: rh(20),
    paddingBottom: rh(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: rw(20),
    paddingTop: rh(20),
  },
  diaryPreview: {
    alignItems: 'center',
    marginBottom: rh(30),
  },
  diary: {
    width: rw(160),
    height: rh(200),
    borderRadius: rw(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  diaryBinding: {
    position: 'absolute',
    right: rw(12),
    top: 0,
    bottom: 0,
    width: rw(3),
    backgroundColor: 'rgba(14, 13, 13, 0.3)',
  },
  bookDivider: {
    position: 'absolute',
    left: rw(22),
    top: rh(10),
    bottom: rh(10),
    width: rw(1.2),
    backgroundColor: 'rgba(96, 93, 93, 0.3)',
    borderRadius: rw(1),
  },
  inputContainer: {
    marginBottom: rh(20),
    width: '100%',
    paddingHorizontal: rw(10),
  },
  inputLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: rh(10),
  },
  nameInput: {
    backgroundColor: uiColors.white,
    width: '100%',
    borderRadius: rw(12),
    paddingHorizontal: rw(16),
    paddingVertical: rh(14),
    fontSize: rf(16),
    color: uiColors.gray,
    borderWidth: 2,
    borderColor: uiColors.grayO,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  colorSection: {
    marginBottom: rh(20),
    paddingHorizontal: rw(10),
  },
  colorLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: rh(10),
  },
  saveButton: {
    alignSelf: 'center',
    backgroundColor: uiColors.primary,
    height: rh(50),
    width: rw(140),
    borderRadius: rw(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rh(10),
    marginBottom: rh(20),
  },
  saveButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});