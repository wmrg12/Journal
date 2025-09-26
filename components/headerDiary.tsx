import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Animated, Pressable, Text, TouchableOpacity, View } from "react-native";
import {color} from "../constants/colors";
import styles from "./globalStyles";

export default function HeaderDiarios() {
  const [active, setActive] = useState(0);
  const [containerW, setContainerW] = useState(280); 
  const translateX = useRef(new Animated.Value(0)).current;

 
  const lateralPadding = 4;
  const indicatorW = (containerW - lateralPadding) / 2; 
  const onTab = (i:number) => {
    setActive(i);
    Animated.spring(translateX, {
      toValue: i,              
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.tabsWrapper}>
      <View
        style={styles.tabsContainer}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        {/* Indicador */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: indicatorW,
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, indicatorW], 
                  }),
                },
              ],
            },
          ]}
        />

        {/* Tab 1 */}
        <Pressable style={styles.tab} onPress={() => onTab(0)}>
          <Text style={[styles.tabText, active === 0 && styles.activeTabText]}>
            Mis Diarios
          </Text>
        </Pressable>

        {/* Tab 2 */}
        <Pressable style={styles.tab} onPress={() => onTab(1)}>
          <Text style={[styles.tabText, active === 1 && styles.activeTabText]}>
            Favoritos
          </Text>
        </Pressable>
      </View>

      {/* Icono busqueda */}
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={22} color={color.danger} />
      </TouchableOpacity>
    </View>
  );
}
