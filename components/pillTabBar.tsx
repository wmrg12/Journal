import { uiColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated, TouchableOpacity, View } from "react-native";
import styles from "../app/styles/globalStyles";

export default function PillTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const itemW = width > 0 ? width / state.routes.length : 0;

  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * (itemW || 0),
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();
  }, [state.index, itemW, translateX]);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
  <View
    onLayout={onLayout}
    style={[
      styles.containerTab,
      { paddingBottom: insets?.bottom ?? 0 }, 
    ]}
  >
    {/* Indicador */}
    {itemW > 0 && (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicatorTab,
          { width: itemW, transform: [{ translateX }] }, 
        ]}
      />
    )}

    {/* Botones */}
    <View style={styles.rowTab}>
      {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const tint = focused ? uiColors.background : uiColors.danger;

      return (

      <TouchableOpacity
            key={route.key}
            style={styles.tabButton}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            <Ionicons
              name={
                route.name === 'home'
                  ? 'book'
                  : route.name === 'task'
                  ? 'albums'
                  : 'settings'
              }
              size={25}
              color={focused ? uiColors.danger : uiColors.danger} 
              style={styles.iconOnTop} 
            />
          </TouchableOpacity>

        );
      })}
    </View>
  </View>
);
}
