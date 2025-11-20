import { StyleSheet } from 'react-native';
import { uiColors } from '../constants/colors';

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: uiColors.danger,
    flex: 1,
    textAlign: 'center',
    marginTop: 30,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 50,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // Title
  title: {
    color: uiColors.accent,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 20,
  },

  // Labels
  label: {
    color: uiColors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 0,
  },

  // Preview
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '98%',
    aspectRatio: 0.9,
    borderColor: uiColors.grayO,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },

  // Color Section
  colorSection: {
    marginBottom: 0,
    margin: 2,
    marginLeft: 0,
    marginTop: 0,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: 10,
  },
  colorPaletteWrapper: {
    marginLeft: -18,
  },

  // Pattern Section
  patternSection: {
    width: '100%',
    marginBottom: 15,
    marginTop: 2,
  },
  patternLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: 16,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    justifyContent: 'flex-start',
  },
  patternPreview: {
    width: 58,
    height: 58,
    borderRadius: 10,
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
    borderRadius: 16,
    elevation: 4,
    marginBottom: 20,
    marginTop: 20,
    minWidth: 120,
    paddingHorizontal: 40,
    paddingVertical: 15,
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    color: uiColors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
