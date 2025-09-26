import React, { useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import styles from "./globalStyles";
import colors from "@/constants/colors";

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

  const labelOpacity =
    itemW > 0
      ? translateX.interpolate({
          inputRange: [-itemW * 0.5, 0, itemW * 0.5],
          outputRange: [0, 1, 0],
          extrapolate: "clamp",
        })
      : 0;

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

          const tint = focused ? colors.background : colors.danger;

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
              color={focused ? colors.danger : colors.danger} 
              style={styles.iconOnTop} 
            />
          </TouchableOpacity>

        );
      })}
    </View>
  </View>
);
}
