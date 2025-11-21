import { StyleSheet, Dimensions } from 'react-native';
import { uiColors } from '../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;

const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

export default StyleSheet.create({
  container: {
    backgroundColor: uiColors.background,
    flex: 1,
  },

  // Header
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveValue(50, 55, 60),
    paddingTop: getResponsiveValue(20, 24, 28),
    paddingBottom: getResponsiveValue(10, 12, 14),
  },

  // Title
  title: {
    color: uiColors.accent,
    textAlign: 'center',
    fontSize: getResponsiveValue(23, 25, 27),
    fontWeight: '700',
    marginBottom: getResponsiveValue(20, 24, 28),
  },

  // Labels
  label: {
    color: uiColors.accent,
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    marginTop: 0,
  },

  // Preview
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '98%',
    aspectRatio: getResponsiveValue(0.9, 0.92, 0.95),
    borderColor: uiColors.grayO,
    borderRadius: getResponsiveValue(12, 14, 16),
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: getResponsiveValue(10, 12, 14),
    marginBottom: getResponsiveValue(20, 24, 28),
  },

  // Color Section
  colorSection: {
    marginBottom: 0,
    margin: 2,
    marginLeft: 0,
    marginTop: 0,
  },
  colorLabel: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  colorPaletteWrapper: {
    marginLeft: getResponsiveValue(-18, -20, -22),
  },

  // Pattern Section
  patternSection: {
    width: '100%',
    marginBottom: getResponsiveValue(15, 18, 20),
    marginTop: 2,
  },
  patternLabel: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveValue(9, 11, 13),
    justifyContent: 'flex-start',
  },
  patternPreview: {
    width: getResponsiveValue(58, 64, 70),
    height: getResponsiveValue(58, 64, 70),
    borderRadius: getResponsiveValue(10, 12, 14),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  patternPreviewSelected: {
    borderColor: uiColors.primary,
    borderWidth: 1.5,
    shadowColor: uiColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Create Button
  createButton: {
    alignSelf: 'center',
    backgroundColor: uiColors.primary,
    borderRadius: getResponsiveValue(16, 18, 20),
    elevation: 4,
    marginBottom: getResponsiveValue(20, 24, 28),
    marginTop: getResponsiveValue(20, 24, 28),
    minWidth: getResponsiveValue(120, 135, 150),
    paddingHorizontal: getResponsiveValue(40, 45, 50),
    paddingVertical: getResponsiveValue(15, 17, 19),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    color: uiColors.white,
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    textAlign: 'center',
  },
});