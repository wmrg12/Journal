// components/ColorPalette.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { color, color as colors } from "@/constants/colors";

type Props = {
  options: readonly string[];
  value: string;
  onChange: (hex: string) => void;
};

const OPTION_SIZE = 50;

export default function ColorPalette({ options, value, onChange }: Props) {
  const topRow = options.slice(0, 5);
  const bottomRow = options.slice(5, 10);

  const renderRow = (row: readonly string[]) => (
    <View style={styles.colorRow}>
      {row.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          style={[
            styles.colorOption,
            { backgroundColor: c },
            value === c && styles.selectedColor,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar color ${c}`}
        />
      ))}
    </View>
  );

  return (
    <View>
      {renderRow(topRow)}
      {renderRow(bottomRow)}
    </View>
  );
}

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  colorOption: {
    width: OPTION_SIZE,
    height: OPTION_SIZE,
    borderRadius: OPTION_SIZE / 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: color.gray,
    borderWidth: 3,
    transform: [{ scale: 1.06 }],
  },
});
