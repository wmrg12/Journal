// types.ts
import { PageText as BasePageText } from '@/src/db/dao';

export type PageText = BasePageText & {
  rotation?: number;
};

export type DrawTool = 'pencil' | 'pen' | 'marker' | 'eraser';

export type Stroke = {
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
  _persistedPathD?: string;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'rectangle' | 'line' | 'arrow' | 'diamond' | 'pentagon' | 'sun' | 'bolt' |'flower' | 'mountain'; ;

// Interface para PageShape (debe coincidir con tu esquema de BD)
export interface PageShape {
  id: string;
  page_id: string;
  shape_type: ShapeType;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  is_locked: boolean;
  created_at: number;
  updated_at: number;
}

// Props para crear un nuevo shape
export interface CreateShapeParams {
  page_id: string;
  shape_type: ShapeType;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation?: number;
  is_locked?: boolean;
}

// Props para actualizar un shape existente
export interface UpdateShapeParams {
  color?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  is_locked?: boolean;
}