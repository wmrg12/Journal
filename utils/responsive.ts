// utils/responsive.ts
import { 
  widthPercentageToDP as wp, 
  heightPercentageToDP as hp 
} from 'react-native-responsive-screen';

// Tu celular base
const BASE_WIDTH = 360;
const BASE_HEIGHT = 800;

// Convierte a valores fijos
export const rw = (size: number) => wp((size / BASE_WIDTH) * 100);
export const rh = (size: number) => hp((size / BASE_HEIGHT) * 100);

// Para fuentes 
export const rf = (size: number) => wp((size / BASE_WIDTH) * 100);