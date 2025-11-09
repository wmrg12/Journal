// components/BottomToolbar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { uiColors } from '@/constants/colors';
import S from '../../styles/pageViewStyles';

type ToolbarItem = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isActive?: boolean;
};

type BottomToolbarProps = {
  items: ToolbarItem[];
};

export const BottomToolbar: React.FC<BottomToolbarProps> = ({ items }) => {
  return (
    <View pointerEvents="box-none" style={S.toolbarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.toolbarBar}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            activeOpacity={0.7}
            disabled={item.disabled}
            style={[
              S.toolItem,
              item.disabled && S.toolItemDisabled,
              item.isActive && { backgroundColor: uiColors.grayO },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={item.label}
            accessibilityRole="button"
            accessibilityState={{ disabled: item.disabled }}
          >
            <MaterialIcons
              name={item.icon}
              size={22}
              color={item.disabled ? '#aaa' : '#333'}
              style={S.toolItemIcon}
            />
            <Text style={[S.toolItemLabel, item.disabled && S.toolItemLabelDisabled]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};