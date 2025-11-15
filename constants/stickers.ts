import { ImageSourcePropType } from 'react-native';

// Stickers
export const STICKER_SOURCES: Record<string, ImageSourcePropType> = {
  sticker1: require('@/assets/images/stickers/sticker1.png'),
  sticker2: require('@/assets/images/stickers/sticker2.png'),
  sticker3: require('@/assets/images/stickers/sticker3.png'),
  sticker4: require('@/assets/images/stickers/sticker4.png'),
  sticker5: require('@/assets/images/stickers/sticker5.png'),
  sticker6: require('@/assets/images/stickers/sticker6.png'),
  sticker7: require('@/assets/images/stickers/sticker7.png'),
  sticker8: require('@/assets/images/stickers/sticker8.png'),
  sticker9: require('@/assets/images/stickers/sticker9.png'),
  sticker10: require('@/assets/images/stickers/sticker10.png'),
  sticker11: require('@/assets/images/stickers/sticker11.png'),
  sticker12: require('@/assets/images/stickers/sticker12.png'),
  sticker13: require('@/assets/images/stickers/sticker13.png'),
  sticker14: require('@/assets/images/stickers/sticker14.png'),
  sticker15: require('@/assets/images/stickers/sticker15.png'),
  sticker16: require('@/assets/images/stickers/sticker16.png'),
  sticker17: require('@/assets/images/stickers/sticker17.png'),
  sticker18: require('@/assets/images/stickers/sticker18.png'),
  sticker19: require('@/assets/images/stickers/sticker19.png'),
  sticker20: require('@/assets/images/stickers/sticker20.png'),
  sticker21: require('@/assets/images/stickers/sticker21.png'),
  sticker22: require('@/assets/images/stickers/sticker22.png'),
  sticker23: require('@/assets/images/stickers/sticker23.png'),
  sticker24: require('@/assets/images/stickers/sticker24.png'),
};

// Lista de IDs de stickers disponibles
export const AVAILABLE_STICKER_IDS = Object.keys(STICKER_SOURCES) as (keyof typeof STICKER_SOURCES)[];
