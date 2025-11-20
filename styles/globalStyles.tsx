import { uiColors } from '@/constants/colors';
import { Dimensions, Platform, StyleSheet } from 'react-native';

// Obtener dimensiones de pantalla
const { width: screenWidth } = Dimensions.get('window');
const isSmallAndroid = screenWidth < 360;
const isMediumAndroid = screenWidth >= 360 && screenWidth < 400;

// Funciones auxiliares para valores responsivos
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isSmallAndroid) return small;
  if (isMediumAndroid) return medium;
  return large;
};

const styles = StyleSheet.create({
  // --- Estilos Globales ---
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveValue(40, 50, 60),
  },

  message: {
    fontSize: getResponsiveValue(16, 18, 19),
    fontWeight: '600',
    color: uiColors.danger,
  },

  fab: {
    position: 'absolute',
    bottom: getResponsiveValue(80, 75, 80),
    right: getResponsiveValue(12, 16, 20),
    backgroundColor: uiColors.primary,
    borderRadius: 40,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // --- Barra de Filtros / Tabs / Home ---
  searchButton: {
    padding: 6,
    marginLeft: getResponsiveValue(6, 8, 10),
  },

  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingVertical: getResponsiveValue(30, 35, 40),
    marginTop: getResponsiveValue(20, 25, 30),
    marginBottom: getResponsiveValue(-10, -15, -20),
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: uiColors.white,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 0,
    width: getResponsiveValue(220, 240, 260),
    borderWidth: 1,
    borderColor: uiColors.white,
  },

  tab: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveValue(10, 11, 12),
    backgroundColor: 'transparent',
    zIndex: 1,
  },

  tabText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: uiColors.danger,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  activeTabText: { fontWeight: 'bold' },

  indicator: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: 2,
    width: getResponsiveValue(110, 120, 136),
    backgroundColor: uiColors.rgba,
    borderRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    zIndex: 0,
  },

  // Franja izquierda
  bookBinding: {
    position: 'absolute',
    left: 135,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(14, 13, 13, 0.3)',
  },
  // Línea divisoria sutil
  bookDivider: {
    position: 'absolute',
    left: 22,
    top: 10,
    bottom: 10,
    width: 1.2,
    backgroundColor: 'rgba(96, 93, 93, 0.3)',
    borderRadius: 1,
  },

  // --- filtros de tab ---
  containerTab: {
    position: 'absolute',
    bottom: getResponsiveValue(15, 18, 20),
    left: getResponsiveValue(20, 25, 30),
    right: getResponsiveValue(20, 25, 30),
    backgroundColor: uiColors.white,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  indicatorTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 18,
    height: 45,
    backgroundColor: uiColors.rgba,
    borderRadius: 10,
    zIndex: 0,
  },
  rowTab: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  tabButton: {
    paddingVertical: getResponsiveValue(8, 9, 10),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: { marginLeft: getResponsiveValue(4, 5, 6) },
  homeRowTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconOnTop: { zIndex: 10 },

  // --- Grid de diarios ---
  gridContent: {
    paddingHorizontal: getResponsiveValue(10, 7, 8),
    paddingTop: getResponsiveValue(10, 10, 80),
    paddingBottom: getResponsiveValue(100, 110, 120),
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingBottom: getResponsiveValue(100, 110, 120),
  },

  card: {
    width: getResponsiveValue(155, 155, 140),
    height: getResponsiveValue(200, 200, 180),
    margin: getResponsiveValue(8, 10, 12),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(8, 9, 10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHL: { borderWidth: 2, borderColor: '#FFB300' },
  cardTitle: {
    textAlign: 'center',
    color: uiColors.gray,
    fontWeight: '600',
    fontSize: getResponsiveValue(16, 17, 18),
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'serif',
    }),
  },

  cardWrapper: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(6, 7, 8),
  },
  // --- fecha ---
  cardDate: {
    textAlign: 'center',
    fontSize: getResponsiveValue(11, 12, 13),
    color: 'rgba(0,0,0,0.65)',
    textTransform: 'lowercase',
    marginTop: -4,
  },

  // --- favorito ---
  favWrap: {
    position: 'absolute',
    top: getResponsiveValue(6, 7, 8),
    left: getResponsiveValue(6, 7, 8),
    zIndex: 2,
  },
  favBtn: {
    width: getResponsiveValue(30, 32, 34),
    height: getResponsiveValue(30, 32, 34),
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  favBtnActive: {
    backgroundColor: 'rgba(230,57,70,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.55)',
  },

  // --- Editar ---
  editWrap: {
    position: 'absolute',
    top: getResponsiveValue(165, 160, 135),
    right: getResponsiveValue(120, 120, 100),
  },

  editBtn: {
    width: getResponsiveValue(26, 27, 28),
    height: getResponsiveValue(26, 27, 28),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: uiColors.transparent,
    shadowColor: uiColors.transparent,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // --- Panel de busqueda por fechas ---
  searchPanel: {
    overflow: 'hidden',
    paddingHorizontal: getResponsiveValue(12, 14, 16),
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveValue(6, 7, 8),
    paddingTop: getResponsiveValue(6, 7, 8),
  },
  chip: {
    paddingHorizontal: getResponsiveValue(8, 9, 10),
    paddingVertical: getResponsiveValue(6, 7, 8),
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 1,
  },
  chipActive: {
    backgroundColor: uiColors.rgba,
  },
  chipText: {
    fontSize: getResponsiveValue(10, 11, 12),
    color: uiColors.brown,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveValue(8, 9, 10),
    paddingTop: getResponsiveValue(8, 9, 10),
  },
  rangeCol: {
    flex: 1,
  },
  applyBtn: {
    height: getResponsiveValue(36, 38, 40),
    paddingHorizontal: getResponsiveValue(12, 13, 14),
    backgroundColor: uiColors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveValue(4, 5, 6),
  },

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: getResponsiveValue(8, 9, 10),
    height: getResponsiveValue(40, 42, 44),
    gap: getResponsiveValue(4, 5, 6),
  },

  inputMM: {
    width: getResponsiveValue(70, 76, 82),
    textAlign: 'center',
    paddingHorizontal: getResponsiveValue(6, 7, 8),
  },

  inputYYYY: {
    width: getResponsiveValue(95, 102, 110),
    textAlign: 'center',
    paddingHorizontal: getResponsiveValue(6, 7, 8),
  },

  slash: {
    marginHorizontal: getResponsiveValue(1, 1.5, 2),
    color: '#777',
  },

  applyBtnInline: {
    height: getResponsiveValue(32, 34, 36),
    paddingHorizontal: getResponsiveValue(10, 11, 12),
    backgroundColor: uiColors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveValue(4, 5, 6),
  },

  closeBtn: {
    marginLeft: getResponsiveValue(4, 5, 6),
    height: getResponsiveValue(32, 34, 36),
    width: getResponsiveValue(32, 34, 36),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  // SETTINGS - RESPONSIVE PARA ANDROID

  scrollContainersett: {
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingTop: getResponsiveValue(8, 9, 10),
    paddingBottom: getResponsiveValue(35, 38, 40),
  },

  // Header
  headerTitlesett: {
    color: uiColors.danger,
    fontSize: getResponsiveValue(30, 33, 35),
    fontWeight: '900',
    marginBottom: getResponsiveValue(25, 28, 30),
    marginTop: getResponsiveValue(30, 33, 35),
  },

  // Sección de Perfil
  profileCardsett: {
    backgroundColor: uiColors.white,
    borderRadius: getResponsiveValue(14, 15, 16),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },

  profileImageContainersett: {
    width: getResponsiveValue(90, 95, 100),
    height: getResponsiveValue(90, 95, 100),
    borderRadius: getResponsiveValue(45, 47.5, 50),
    backgroundColor: uiColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveValue(14, 15, 16),
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },

  profileImagesett: {
    width: '100%',
    height: '100%',
  },

  profileNamesett: {
    fontSize: getResponsiveValue(15, 18, 20),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: getResponsiveValue(3, 3.5, 4),
  },

  profileEmailsett: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: uiColors.gray,
    marginBottom: getResponsiveValue(7, 7.5, 8),
  },

  // Información de la Cuenta
  accountCardsett: {
    backgroundColor: uiColors.white,
    borderRadius: getResponsiveValue(14, 15, 16),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  accountTitlesett: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    marginBottom: getResponsiveValue(14, 15, 16),
    color: uiColors.gray,
  },

  accountInfoRowsett: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveValue(10, 11, 12),
    borderBottomWidth: 1,
    borderBottomColor: uiColors.white,
  },

  accountInfoRowLastsett: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveValue(10, 11, 12),
  },

  accountIconContainersett: {
    width: getResponsiveValue(36, 38, 40),
    height: getResponsiveValue(36, 38, 40),
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(10, 11, 12),
  },

  accountIconBgBluesett: {
    backgroundColor: '#eff6ff',
  },

  accountIconBgYellowsett: {
    backgroundColor: '#fef3c7',
  },

  accountInfoContentsett: {
    flex: 1,
  },

  accountInfoLabelsett: {
    fontSize: getResponsiveValue(11, 11.5, 12),
    color: uiColors.gray,
    marginBottom: 2,
  },

  accountInfoValuesett: {
    fontSize: getResponsiveValue(11, 11.5, 12),
    color: uiColors.gray,
    fontWeight: '500',
  },

  // Centro de Ayuda
  helpButtonsett: {
    backgroundColor: uiColors.white,
    borderRadius: getResponsiveValue(14, 15, 16),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  helpButtonContentsett: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  helpIconContainersett: {
    width: getResponsiveValue(36, 38, 40),
    height: getResponsiveValue(36, 38, 40),
    borderRadius: getResponsiveValue(18, 19, 20),
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(10, 11, 12),
  },

  helpTitlesett: {
    fontSize: getResponsiveValue(14, 15, 16),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: 2,
  },

  helpDescriptionsett: {
    fontSize: getResponsiveValue(12, 12.5, 13),
    color: '#6b7280',
  },

  // Botón de Cerrar Sesión
  logoutButtonsett: {
    backgroundColor: uiColors.danger,
    paddingVertical: getResponsiveValue(14, 15, 16),
    paddingHorizontal: getResponsiveValue(20, 22, 24),
    borderRadius: getResponsiveValue(10, 11, 12),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  logoutButtonTextsett: {
    color: uiColors.white,
    fontWeight: '700',
    fontSize: getResponsiveValue(14, 15, 16),
  },

  logoutIconsett: {
    marginRight: getResponsiveValue(7, 7.5, 8),
  },

  // HELP SETTINGS - RESPONSIVE PARA ANDROID

  containerhelp: {
    backgroundColor: uiColors.background,
  },

  // Header
  headerhelp: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingTop: getResponsiveValue(45, 48, 50),
    paddingBottom: getResponsiveValue(16, 18, 20),
    backgroundColor: uiColors.background,
    borderBottomWidth: 1,
    borderBottomColor: uiColors.background,
  },

  backButtonhelp: {
    width: getResponsiveValue(36, 38, 40),
    height: getResponsiveValue(36, 38, 40),
    borderRadius: getResponsiveValue(18, 19, 20),
    backgroundColor: uiColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(10, 11, 12),
  },

  headerTitlehelp: {
    fontSize: getResponsiveValue(22, 24, 25),
    fontWeight: '700',
    color: uiColors.danger,
  },

  // Content
  scrollContenthelp: {
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingTop: getResponsiveValue(20, 22, 24),
    paddingBottom: getResponsiveValue(35, 38, 40),
  },

  // Tarjeta de Descripcion
  descriptionCardhelp: {
    backgroundColor: uiColors.white,
    borderRadius: getResponsiveValue(14, 15, 16),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(20, 22, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  descriptionHeaderhelp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(10, 11, 12),
  },

  descriptionIconContainerhelp: {
    width: getResponsiveValue(44, 46, 48),
    height: getResponsiveValue(44, 46, 48),
    borderRadius: getResponsiveValue(22, 23, 24),
    backgroundColor: uiColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(10, 11, 12),
  },

  descriptionTitlehelp: {
    fontSize: getResponsiveValue(18, 19, 20),
    fontWeight: '700',
    color: uiColors.gray,
    flex: 1,
    paddingLeft: getResponsiveValue(8, 9, 10),
  },

  descriptionTexthelp: {
    fontSize: getResponsiveValue(13, 14, 15),
    color: uiColors.gray,
    lineHeight: getResponsiveValue(20, 21, 22),
  },

  // Titulo de seccion
  sectionTitlehelp: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: getResponsiveValue(14, 15, 16),
    marginLeft: getResponsiveValue(3, 3.5, 4),
  },

  // Tarjetas de Contacto
  contactCardhelp: {
    backgroundColor: uiColors.white,
    borderRadius: getResponsiveValue(14, 15, 16),
    padding: getResponsiveValue(16, 17, 18),
    marginBottom: getResponsiveValue(14, 15, 16),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIconContainerhelp: {
    width: getResponsiveValue(48, 50, 52),
    height: getResponsiveValue(48, 50, 52),
    borderRadius: getResponsiveValue(24, 25, 26),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(14, 15, 16),
  },

  contactContenthelp: {
    flex: 1,
  },

  contactTitlehelp: {
    fontSize: getResponsiveValue(15, 16, 17),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: getResponsiveValue(3, 3.5, 4),
  },

  contactDescriptionhelp: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: uiColors.gray,
    marginBottom: getResponsiveValue(5, 5.5, 6),
  },

  contactEmailhelp: {
    fontSize: getResponsiveValue(11, 12, 13),
    fontWeight: '500',
  },

  // Tarjeta de Información Adicional
  infoCardhelp: {
    backgroundColor: '#8fc58c8b',
    borderRadius: getResponsiveValue(10, 11, 12),
    padding: getResponsiveValue(14, 15, 16),
    marginTop: getResponsiveValue(7, 7.5, 8),
    borderLeftWidth: 4,
    borderLeftColor: '#286d20ff',
  },

  infoCardContenthelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIconhelp: {
    marginRight: getResponsiveValue(7, 7.5, 8),
    marginTop: 2,
  },

  infoTextContainerhelp: {
    flex: 1,
  },

  infoTitlehelp: {
    fontSize: getResponsiveValue(12, 13, 14),
    fontWeight: '600',
    color: '#5fa964ff',
    marginBottom: getResponsiveValue(3, 3.5, 4),
  },

  infoTexthelp: {
    fontSize: getResponsiveValue(11, 12, 13),
    color: '#48794aff',
    lineHeight: getResponsiveValue(18, 19, 20),
  },
} as const);

export default styles;
