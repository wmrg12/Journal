import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
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
  onDone: () => void;
};

export default function PageToolbar({
  pageNum,
  total,
  isLoading,
  onBack,
  onPrevPage,
  onNextPage,
  onDone,
}: PageToolbarProps) {
  const isFirstPage = pageNum <= 1;
  const isLastPage = pageNum >= total;

  return (
    <View style={S.topToolbar}>
      {/* back + imagen decorativa */}
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

        {/* Imagen decorativa de animalitos */}
        <View style={S.decorativeImageContainer}>
          <Image
            source={require('@/assets/images/cats-decoration.png')}
            style={S.decorativeImage}
            resizeMode="contain"
          />
        </View>
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
