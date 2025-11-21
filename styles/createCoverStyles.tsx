import { StyleSheet, Dimensions } from 'react-native';
import { uiColors } from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;

const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

export const diaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingVertical: getResponsiveValue(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: getResponsiveValue(8, 10, 12),
    width: getResponsiveValue(40, 44, 48),
    alignItems: 'flex-start',
    marginTop: getResponsiveValue(30, 34, 38),
  },
  headerTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: '600',
    color: uiColors.danger,
    flex: 1,
    textAlign: 'center',
    marginTop: getResponsiveValue(30, 34, 38),
  },
  headerSpacer: {
    width: getResponsiveValue(40, 44, 48),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveValue(24, 28, 32),
    paddingTop: getResponsiveValue(32, 36, 40),
    paddingBottom: getResponsiveValue(24, 28, 32),
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveValue(24, 28, 32),
    paddingTop: getResponsiveValue(32, 36, 40),
  },
  diaryPreview: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(40, 46, 52),
  },
  diary: {
    width: getResponsiveValue(160, 180, 200),
    height: getResponsiveValue(200, 225, 250),
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  diaryBinding: {
    position: 'absolute',
    right: getResponsiveValue(12, 14, 16),
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(14, 13, 13, 0.3)',
  },
  bookDivider: {
    position: 'absolute',
    left: getResponsiveValue(22, 26, 30),
    top: 10,
    bottom: 10,
    width: 1.2,
    backgroundColor: 'rgba(96, 93, 93, 0.3)',
    borderRadius: 1,
  },
  inputContainer: {
    marginBottom: getResponsiveValue(32, 36, 40),
    width: getResponsiveValue(280, 310, 340),
    marginLeft: getResponsiveValue(8, 10, 12),
  },
  inputLabel: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  nameInput: {
    backgroundColor: uiColors.white,
    width: getResponsiveValue(280, 310, 340),
    borderRadius: 12,
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(14, 16, 18),
    marginLeft: getResponsiveValue(11, 13, 15),
    marginBottom: -20,
    fontSize: getResponsiveValue(16, 17, 18),
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
    marginBottom: getResponsiveValue(45, 50, 55),
    margin: 7,
    gap: 5,
    marginLeft: 7,
    marginRight: 7,
  },
  colorLabel: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  saveButton: {
    backgroundColor: uiColors.primary,
    height: getResponsiveValue(50, 54, 58),
    width: getResponsiveValue(120, 135, 150),
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
    marginBottom: 10,
    marginLeft: getResponsiveValue(100, 115, 130),
  },
  saveButtonText: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});