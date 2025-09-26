import { StyleSheet, Dimensions } from "react-native";
import {color} from "../../constants/colors";

const { height } = Dimensions.get("window");

export default StyleSheet.create({
 
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.background,
  },
  imageColumn: {
    flex: 2, 
  },
  image: {
    height: height / 4, 
    resizeMode: "cover",
  },
  imageVertical: {
  width: undefined,     
  height: 350,         
  aspectRatio: 1 / 1.5,
  resizeMode: "contain", 
  position: "absolute",
  left: -20,  
  top: 0,   
  marginTop: 110,
  },
  imageVertical2: {
  width: undefined,     
  height: 280,         
  aspectRatio: 1 / 1.5,
  resizeMode: "contain", 
  position: "absolute",
  left: 100,  
  top: 0,   
  marginTop: 190,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 70,
    paddingVertical: 40,   
    paddingHorizontal: 45,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: color.primary,
    textAlign: "left",
    marginBottom: -5,
    alignSelf: "flex-start",
  },
  subtitle: {
    fontSize: 13,
    color: color.gray,
    textAlign: "left",
    marginTop: 10, 
    marginBottom: 25,
  },
  button: {
    backgroundColor: color.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

});

