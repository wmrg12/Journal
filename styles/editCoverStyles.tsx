import { uiColors } from '@/constants/colors';
import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;

const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

export const editCoverStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveValue(20, 24, 28),
    paddingVertical: getResponsiveValue(15, 18, 20),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: getResponsiveValue(20, 24, 28),
  },
  closeButton: {
    width: getResponsiveValue(30, 34, 38),
    height: getResponsiveValue(30, 34, 38),
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: getResponsiveValue(30, 34, 38),
  },
  closeIcon: {
    fontSize: getResponsiveValue(19, 21, 23),
    color: uiColors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: '600',
    color: uiColors.danger,
    marginTop: getResponsiveValue(30, 34, 38),
  },
  saveButton: {
    width: getResponsiveValue(30, 34, 38),
    height: getResponsiveValue(30, 34, 38),
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveIcon: {
    fontSize: getResponsiveValue(13, 15, 17),
    color: uiColors.white,
    fontWeight: '600',
    marginTop: getResponsiveValue(30, 34, 38),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: getResponsiveValue(40, 48, 56),
  },
  diaryPreview: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(30, 36, 42),
  },
  diary: {
    width: getResponsiveValue(160, 180, 200),
    height: getResponsiveValue(200, 225, 250),
    borderRadius: 8,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  diaryBinding: {
    position: 'absolute',
    right: getResponsiveValue(20, 24, 28),
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(96, 93, 93, 0.3)',
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
    width: '100%',
    paddingHorizontal: getResponsiveValue(30, 36, 42),
    marginBottom: getResponsiveValue(25, 30, 35),
  },
  inputLabel: {
    fontSize: getResponsiveValue(16, 18, 20),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  nameInput: {
    backgroundColor: uiColors.white,
    width: getResponsiveValue(280, 310, 340),
    borderRadius: 12,
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(14, 16, 18),
    marginLeft: getResponsiveValue(11, 13, 15),
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
    width: '100%',
    paddingHorizontal: getResponsiveValue(30, 36, 42),
    marginBlock: 0,
  },
  colorLabel: {
    fontSize: getResponsiveValue(16, 18, 20),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  deleteSection: {
    marginTop: getResponsiveValue(20, 24, 28),
    bottom: getResponsiveValue(40, 48, 56),
    width: '100%',
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: getResponsiveValue(12, 14, 16),
    paddingHorizontal: getResponsiveValue(30, 36, 42),
    marginBlock: getResponsiveValue(20, 24, 28),
  },
  deleteButtonText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: uiColors.gray,
    textDecorationLine: 'underline',
    marginBlock: 0,
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    marginTop: getResponsiveValue(12, 14, 16),
    fontSize: getResponsiveValue(14, 15, 16),
    color: '#999',
  },
});