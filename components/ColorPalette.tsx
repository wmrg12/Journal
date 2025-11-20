// components/ColorPalette.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { uiColors } from '@/constants/colors';

type Props = {
  options: readonly string[];
  value: string;
  onChange: (hex: string) => void;
  colorsPerRow?: number;
};

const OPTION_SIZE = 40;

export default function ColorPalette({ options, value, onChange, colorsPerRow = 6 }: Props) {
  // Dividir los colores en filas dinámicamente
  const rows: string[][] = [];
  for (let i = 0; i < options.length; i += colorsPerRow) {
    rows.push(options.slice(i, i + colorsPerRow) as string[]);
  }

  const renderRow = (row: string[], rowIndex: number) => (
    <View key={rowIndex} style={styles.colorRow}>
      {row.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          style={[styles.colorOption, { backgroundColor: c }, value === c && styles.selectedColor]}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar color ${c}`}
        />
      ))}
    </View>
  );

  return <View>{rows.map((row, index) => renderRow(row, index))}</View>;
}

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 2,
    marginBottom: 10,
    marginLeft: 25,
  },
  colorOption: {
    width: OPTION_SIZE,
    height: OPTION_SIZE,
    borderRadius: OPTION_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: uiColors.gray,
    borderWidth: 3,
    transform: [{ scale: 1.06 }],
  },
});
