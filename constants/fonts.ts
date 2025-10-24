export const textFonts = [
  'Roboto',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
] as const;

export type TextFont = (typeof textFonts)[number];
