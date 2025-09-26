import { StyleSheet } from "react-native";
import colors from "../constants/colors";

export default StyleSheet.create({

  // --- Estilos Globales ---
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -90,
  },

  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },

  fab: {
    position: "absolute",
    bottom: 98,
    right: 18,
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  // --- Barra de Filtros / Tabs / Home ---
  searchButton: {
    padding: 6,
    marginLeft: 12,
  },

  tabsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,    
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    paddingVertical: 0,
    width: 240,                        
    borderWidth: 1,
    borderColor: colors.white,         
  },

  tab: {
    width: "50%",                      
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "transparent", 
    zIndex: 1,
  },

  tabText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: "bold", 
    backgroundColor: "transparent",                
  },

  activeTabText: {
    fontWeight: "bold",
  },

  indicator: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: 2,
    width: 136,                        
    backgroundColor: colors.rgba,
    borderRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    zIndex: 0, 
  },

  // --- filtros de tab ---
    containerTab:{
        position: "absolute",   
        bottom: 20,             
        left: 30,
        right: 30,
      
      backgroundColor: colors.white, 
      borderRadius: 10,       
      paddingVertical: 2,
      paddingHorizontal: 0,
      
    },
    indicatorTab:{
      position: "absolute",
      top: 0,             
      left: 0,   
      width: 18,          
      height: 48,        
      backgroundColor: colors.rgba,
      borderRadius: 10,   
      zIndex: 0,
    },
    rowTab: {
      flexDirection: "row",
      flex: 1,          
      justifyContent: "space-around",
    },
    tabButton:{
      paddingVertical: 10,
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 1,
    },
    tabLabel:{
      marginLeft: 6,
    },
    homeRowTab:{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      position: "relative", 
    },
    iconOnTop: {
      zIndex: 10, 
    },
});




