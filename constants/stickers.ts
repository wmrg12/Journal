import { ImageSourcePropType } from 'react-native';

// Mapeo centralizado de IDs de stickers a sus sources locales
export const STICKER_SOURCES: Record<string, ImageSourcePropType> = {
  sticker1: require('@/assets/images/stickers/sticker1.png'),
  sticker2: require('@/assets/images/stickers/sticker2.png'),
  sticker3: require('@/assets/images/stickers/sticker3.png'),
  sticker4: require('@/assets/images/stickers/sticker4.png'),
};

// Lista de IDs de stickers disponibles
export const AVAILABLE_STICKER_IDS = Object.keys(STICKER_SOURCES) as (keyof typeof STICKER_SOURCES)[];
