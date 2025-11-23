import { uiColors } from '@/constants/colors';
import { Platform, StyleSheet } from 'react-native';
import { rw, rh, rf } from '@/utils/responsive';

const styles = StyleSheet.create({
  // --- Estilos Globales ---
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
    paddingTop: rh(0),
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rh(50),
  },

  message: {
    fontSize: rf(18),
    fontWeight: '600',
    color: uiColors.danger,
  },

  fab: {
    position: 'absolute',
    bottom: rh(95),
    right: rw(16),
    backgroundColor: uiColors.primary,
    borderRadius: rw(40),
    width: rw(56),
    height: rw(56),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // --- Barra de Filtros / Tabs / Home ---
  searchModalOverlay: {
    marginTop: rh(10),
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  searchModalContent: {
    width: '88%',
    maxWidth: 520,
    backgroundColor: uiColors.white,
    borderRadius: rw(12),
    paddingHorizontal: rw(16),
    paddingVertical: rh(10),
    zIndex: 41,
    elevation: 0,
    shadowColor: '#ffffffff',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rh(8),
  },
  searchModalTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: uiColors.gray,
  },
  modalCloseBtn: {
    padding: rw(6),
    borderRadius: rw(8),
  },
  modalMessageWrap: {
    marginTop: rh(10),
    paddingHorizontal: rw(6),
    paddingVertical: rh(8),
    borderRadius: rw(8),
    backgroundColor: 'transparent',
  },
  modalMessageText: {
    fontSize: rf(13),
    color: uiColors.danger,
    textAlign: 'center',
  },

  searchButton: {
    padding: rw(6),
    marginLeft: rw(8),
  },

  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rw(14),
    paddingVertical: rh(35),
    marginTop: rh(25),
    marginBottom: rh(-15),
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: uiColors.white,
    borderRadius: rw(12),
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 0,
    width: rw(240),
    borderWidth: 1,
    borderColor: uiColors.white,
  },

  tab: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rh(11),
    backgroundColor: 'transparent',
    zIndex: 1,
  },

  tabText: {
    fontSize: rf(15),
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
    width: rw(120),
    backgroundColor: uiColors.rgba,
    borderRadius: rw(12),
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    zIndex: 0,
  },

  // Franja izquierda
  bookBinding: {
    position: 'absolute',
    left: rw(135),
    top: 0,
    bottom: 0,
    width: rw(4),
    backgroundColor: 'rgba(14, 13, 13, 0.3)',
  },
  // Línea divisoria sutil
  bookDivider: {
    position: 'absolute',
    left: rw(22),
    top: rh(10),
    bottom: rh(10),
    width: rw(1.2),
    backgroundColor: 'rgba(96, 93, 93, 0.3)',
    borderRadius: rw(1),
  },

  // --- filtros de tab ---
  containerTab: {
    position: 'absolute',
    bottom: rh(20),
    left: rw(25),
    right: rw(25),
    backgroundColor: uiColors.white,
    borderRadius: rw(10),
    paddingVertical: rh(2),
    paddingHorizontal: rh(2),
    maxHeight: rh(55), 
    overflow: 'hidden', 
  },
  indicatorTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: rw(18),
    height: rh(50),
    backgroundColor: uiColors.rgba,
    borderRadius: rw(10),
    zIndex: 0,
  },
  rowTab: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  tabButton: {
    paddingVertical: rh(9),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: { marginLeft: rw(8) },
  homeRowTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconOnTop: { zIndex: 10 },

  // --- Grid de diarios ---
  gridContent: {
    paddingHorizontal: rw(7),
    paddingTop: rh(10),
    paddingBottom: rh(110),
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rw(14),
    paddingBottom: rh(110),
  },

  card: {
    width: rw(155),
    height: rh(200),
    margin: rw(10),
    borderRadius: rw(10),
    justifyContent: 'center',
    alignItems: 'center',
    padding: rw(9),
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
    fontSize: rf(17),
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'serif',
    }),
  },

  cardWrapper: {
    alignItems: 'center',
    marginBottom: rh(7),
  },
  // --- fecha ---
  cardDate: {
    textAlign: 'center',
    fontSize: rf(12),
    color: 'rgba(0,0,0,0.65)',
    textTransform: 'lowercase',
    marginTop: rh(-4),
  },

  // --- favorito ---
  favWrap: {
    position: 'absolute',
    top: rh(7),
    left: rw(7),
    zIndex: 2,
  },
  favBtn: {
    width: rw(32),
    height: rw(32),
    borderRadius: rw(78),
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
    top: rh(160),
    right: rw(120),
  },

  editBtn: {
    width: rw(27),
    height: rw(27),
    borderRadius: rw(14),
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
    paddingHorizontal: rw(14),
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rw(7),
    paddingTop: rh(7),
  },
  chip: {
    paddingHorizontal: rw(9),
    paddingVertical: rh(7),
    backgroundColor: '#fff',
    borderRadius: rw(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 1,
  },
  chipActive: {
    backgroundColor: uiColors.rgba,
  },
  chipText: {
    fontSize: rf(11),
    color: uiColors.brown,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rw(9),
    paddingTop: rh(9),
  },
  rangeCol: {
    flex: 1,
  },
  applyBtn: {
    height: rh(38),
    paddingHorizontal: rw(13),
    backgroundColor: uiColors.primary,
    borderRadius: rw(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(5),
  },

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: rw(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: rw(9),
    height: rh(42),
    gap: rw(5),
  },

  inputMM: {
    width: rw(76),
    textAlign: 'center',
    paddingHorizontal: rw(7),
  },

  inputYYYY: {
    width: rw(102),
    textAlign: 'center',
    paddingHorizontal: rw(7),
  },

  slash: {
    marginHorizontal: rw(1.5),
    color: '#777',
  },

  applyBtnInline: {
    height: rh(34),
    paddingHorizontal: rw(11),
    backgroundColor: uiColors.primary,
    borderRadius: rw(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(5),
  },

  closeBtn: {
    marginLeft: rw(5),
    height: rh(34),
    width: rw(34),
    borderRadius: rw(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  // SETTINGS - RESPONSIVE PARA ANDROID
  scrollContainersett: {
    paddingHorizontal: rw(18),
    paddingTop: rh(9),
    paddingBottom: rh(38),
  },

  // Header
  headerTitlesett: {
    color: uiColors.danger,
    fontSize: rf(33),
    fontWeight: '900',
    marginBottom: rh(28),
    marginTop: rh(33),
  },

  // Sección de Perfil
  profileCardsett: {
    backgroundColor: uiColors.white,
    borderRadius: rw(15),
    padding: rw(18),
    marginBottom: rh(18),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },

  profileImageContainersett: {
    width: rw(95),
    height: rw(95),
    borderRadius: rw(47.5),
    backgroundColor: uiColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rh(15),
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },

  profileImagesett: {
    width: '100%',
    height: '100%',
  },

  profileNamesett: {
    fontSize: rf(18),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: rh(3.5),
  },

  profileEmailsett: {
    fontSize: rf(13),
    color: uiColors.gray,
    marginBottom: rh(7.5),
  },

  // Información de la Cuenta
  accountCardsett: {
    backgroundColor: uiColors.white,
    borderRadius: rw(15),
    padding: rw(18),
    marginBottom: rh(18),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  accountTitlesett: {
    fontSize: rf(17),
    fontWeight: '600',
    marginBottom: rh(15),
    color: uiColors.gray,
  },

  accountInfoRowsett: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rh(11),
    borderBottomWidth: 1,
    borderBottomColor: uiColors.white,
  },

  accountInfoRowLastsett: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rh(11),
  },

  accountIconContainersett: {
    width: rw(38),
    height: rw(38),
    borderRadius: rw(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(11),
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
    fontSize: rf(11.5),
    color: uiColors.gray,
    marginBottom: 2,
  },

  accountInfoValuesett: {
    fontSize: rf(11.5),
    color: uiColors.gray,
    fontWeight: '500',
  },

  // Centro de Ayuda
  helpButtonsett: {
    backgroundColor: uiColors.white,
    borderRadius: rw(15),
    padding: rw(18),
    marginBottom: rh(18),
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
    width: rw(38),
    height: rw(38),
    borderRadius: rw(19),
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(11),
  },

  helpTitlesett: {
    fontSize: rf(15),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: 2,
  },

  helpDescriptionsett: {
    fontSize: rf(12.5),
    color: '#6b7280',
  },

  // Botón de Cerrar Sesión
  logoutButtonsett: {
    backgroundColor: uiColors.danger,
    paddingVertical: rh(15),
    paddingHorizontal: rw(22),
    borderRadius: rw(11),
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
    fontSize: rf(15),
  },

  logoutIconsett: {
    marginRight: rw(7.5),
  },

  // HELP SETTINGS - RESPONSIVE PARA ANDROID
  containerhelp: {
    backgroundColor: uiColors.background,
  },

  // Header
  headerhelp: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rw(18),
    paddingTop: rh(48),
    paddingBottom: rh(18),
    backgroundColor: uiColors.background,
    borderBottomWidth: 1,
    borderBottomColor: uiColors.background,
  },

  backButtonhelp: {
    width: rw(38),
    height: rw(38),
    borderRadius: rw(19),
    backgroundColor: uiColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(11),
  },

  headerTitlehelp: {
    fontSize: rf(24),
    fontWeight: '700',
    color: uiColors.danger,
  },

  // Content
  scrollContenthelp: {
    paddingHorizontal: rw(18),
    paddingTop: rh(22),
    paddingBottom: rh(38),
  },

  // Tarjeta de Descripcion
  descriptionCardhelp: {
    backgroundColor: uiColors.white,
    borderRadius: rw(15),
    padding: rw(18),
    marginBottom: rh(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  descriptionHeaderhelp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rh(11),
  },

  descriptionIconContainerhelp: {
    width: rw(46),
    height: rw(46),
    borderRadius: rw(23),
    backgroundColor: uiColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(11),
  },

  descriptionTitlehelp: {
    fontSize: rf(19),
    fontWeight: '700',
    color: uiColors.gray,
    flex: 1,
    paddingLeft: rw(9),
  },

  descriptionTexthelp: {
    fontSize: rf(14),
    color: uiColors.gray,
    lineHeight: rh(21),
  },

  // Titulo de seccion
  sectionTitlehelp: {
    fontSize: rf(17),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: rh(15),
    marginLeft: rw(3.5),
  },

  // Tarjetas de Contacto
  contactCardhelp: {
    backgroundColor: uiColors.white,
    borderRadius: rw(15),
    padding: rw(17),
    marginBottom: rh(15),
    shadowColor: uiColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIconContainerhelp: {
    width: rw(50),
    height: rw(50),
    borderRadius: rw(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(15),
  },

  contactContenthelp: {
    flex: 1,
  },

  contactTitlehelp: {
    fontSize: rf(16),
    fontWeight: '600',
    color: uiColors.gray,
    marginBottom: rh(3.5),
  },

  contactDescriptionhelp: {
    fontSize: rf(13),
    color: uiColors.gray,
    marginBottom: rh(5.5),
  },

  contactEmailhelp: {
    fontSize: rf(12),
    fontWeight: '500',
  },

  // Tarjeta de Información Adicional
  infoCardhelp: {
    backgroundColor: '#8fc58c8b',
    borderRadius: rw(11),
    padding: rw(15),
    marginTop: rh(7.5),
    borderLeftWidth: 4,
    borderLeftColor: '#286d20ff',
  },

  infoCardContenthelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIconhelp: {
    marginRight: rw(7.5),
    marginTop: 2,
  },

  infoTextContainerhelp: {
    flex: 1,
  },

  infoTitlehelp: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#5fa964ff',
    marginBottom: rh(3.5),
  },

  infoTexthelp: {
    fontSize: rf(12),
    color: '#48794aff',
    lineHeight: rh(19),
  },
} as const);

export default styles;