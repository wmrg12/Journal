import { StyleSheet } from 'react-native';
import { uiColors } from '../constants/colors';
import { rw, rh, rf } from '@/utils/responsive';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
    paddingHorizontal: rw(10),
    paddingTop: 0,
  },

  // Header
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
    padding: rw(7),
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rw(20),
    paddingTop: rh(20),
    paddingBottom: rh(20),
  },

  // Title
  title: {
    color: uiColors.accent,
    textAlign: 'center',
    fontSize: rf(18),
    fontWeight: '700',
    marginBottom: rh(20),
  },

  // Labels
  label: {
    color: uiColors.accent,
    fontSize: rf(20),
    fontWeight: '600',
    marginTop: 0,
  },

  // Preview
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 0.92,
    borderColor: uiColors.grayO,
    borderRadius: rw(14),
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: rh(10),
    marginBottom: rh(20),
  },

  // Color Section
  colorSection: {
    marginBottom: rh(10),
    marginLeft: 0,
    marginTop: 0,
  },
  colorLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: rh(10),
  },
  colorPaletteWrapper: {
    marginLeft: rw(7),
  },

  // Pattern Section
  patternSection: {
    width: '100%',
    marginBottom: rh(15),
    marginTop: rh(5),
  },
  patternLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: uiColors.danger,
    marginBottom: rh(12),
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',  
    gap: rh(10),                       
  },
  patternPreview: {
    width: '22%',                     
    aspectRatio: 1,                    
    borderRadius: rw(10),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: rh(5),
  },
  patternPreviewSelected: {
    borderColor: uiColors.primary,
    borderWidth: 2,
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
    borderRadius: rw(16),
    elevation: 4,
    marginBottom: rh(20),
    marginTop: rh(15),
    minWidth: rw(140),
    paddingHorizontal: rw(40),
    paddingVertical: rh(14),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    color: uiColors.white,
    fontSize: rf(16),
    fontWeight: '600',
    textAlign: 'center',
  },
});