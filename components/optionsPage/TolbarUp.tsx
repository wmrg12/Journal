import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { uiColors } from '@/constants/colors';
import S from '../../styles/pageViewStyles';

type PageToolbarProps = {
  pageNum: number;
  total: number;
  isLoading: boolean;
  onBack: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDone: () => void;
};

export default function PageToolbar({
  pageNum,
  total,
  isLoading,
  onBack,
  onPrevPage,
  onNextPage,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDone,
}: PageToolbarProps) {
  const isFirstPage = pageNum <= 1;
  const isLastPage = pageNum >= total;

  return (
    <View style={S.topToolbar}>
      {/* back + undo/redo */}
      <View style={S.topToolbarLeft}>
        {/* Back */}
        <TouchableOpacity
          onPress={onBack}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isLoading ? uiColors.gray : uiColors.danger}
          />
        </TouchableOpacity>

        {/* Undo */}
        <TouchableOpacity
          onPress={onUndo}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={!canUndo || isLoading}
        >
          <MaterialIcons
            name="undo"
            size={22}
            color={!canUndo || isLoading ? uiColors.gray : uiColors.danger}
          />
        </TouchableOpacity>

        {/* Redo */}
        <TouchableOpacity
          onPress={onRedo}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={!canRedo || isLoading}
        >
          <MaterialIcons
            name="redo"
            size={22}
            color={!canRedo || isLoading ? uiColors.gray : uiColors.danger}
          />
        </TouchableOpacity>
      </View>

      {/* Navegación + Pag N */}
      <View style={S.topToolbarCenter}>
        <TouchableOpacity
          onPress={onPrevPage}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={isFirstPage || isLoading}
        >
          <MaterialIcons
            name="chevron-left"
            size={26}
            color={isFirstPage || isLoading ? uiColors.grayO : uiColors.danger}
          />
        </TouchableOpacity>

        <Text style={S.topToolbarPageLabel}>{`Pag ${pageNum}`}</Text>

        <TouchableOpacity
          onPress={onNextPage}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={isLastPage || isLoading}
        >
          <MaterialIcons
            name="chevron-right"
            size={26}
            color={isLastPage || isLoading ? uiColors.grayO : uiColors.danger}
          />
        </TouchableOpacity>
      </View>

      {/* DERECHA */}
      <View style={S.topToolbarRight}>
        <TouchableOpacity
          onPress={onDone}
          style={S.topToolbarIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <MaterialIcons
            name="check-circle-outline"
            size={26}
            color={isLoading ? uiColors.gray : uiColors.danger}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
