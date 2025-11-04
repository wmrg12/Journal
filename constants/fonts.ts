export const textFonts = [
  'Roboto',
  'Courier Prime',
  'Outfit',
  'Outfit Bold',
  'Bitcount',
  'Momo',
  'Bungee',
  'PlayWrite',
  'Cormorant',
] as const;

export type TextFont = (typeof textFonts)[number];

export const fontFamilyMap: Record<TextFont, string> = {
  Roboto: 'Roboto-Regular',
  'Courier Prime': 'CourierPrime-Regular',
  Outfit: 'Outfit-Regular',
  'Outfit Bold': 'Outfit-Bold',
  Bitcount: 'BitcountGridSingle-Regular',
  Momo: 'MomoSignature-Regular',
  Bungee: 'Bungee-Regular',
  PlayWrite: 'PlaywriteMXGuides-Regular',
  Cormorant: 'CormorantGaramond-Italic',
};
