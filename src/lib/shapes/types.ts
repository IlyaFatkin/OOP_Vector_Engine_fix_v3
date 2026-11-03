import type { Transform } from './Shape';

export type RGBAJSON = { r: number; g: number; b: number; a: number };

export type ShapeBaseJSON = {
  id?: string;
  transform?: Transform;
  fillStyle?: RGBAJSON;
  fillOpacity?: number;
  strokeStyle?: RGBAJSON;
  strokeWidth?: number;
  strokeOpacity?: number;
};

export type RectJSON = ShapeBaseJSON & { type: 'rect'; w: number; h: number };
export type LineJSON = ShapeBaseJSON & { type: 'line'; x1: number; y1: number; x2: number; y2: number };
export type OvalJSON = ShapeBaseJSON & { type: 'oval'; rx: number; ry: number };
export type TriangleJSON = ShapeBaseJSON & {
  type: 'triangle';
  x1: number; y1: number;
  x2: number; y2: number;
  x3: number; y3: number;
};
export type QuadraticJSON = ShapeBaseJSON & {
  type: 'quadraticBezier';
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  steps?: number;
};
export type CubicJSON = ShapeBaseJSON & {
  type: 'cubicBezier';
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  x3: number; y3: number;
  steps?: number;
};
export type PathPointJSON = { x: number; y: number };
export type PathJSON = ShapeBaseJSON & {
  type: 'pathBezier';
  points: PathPointJSON[];
  mode?: 'polyline' | 'bezier' | 'catmull';
  closed?: boolean;
  steps?: number;
};

export type ShapeJSON =
  | RectJSON
  | LineJSON
  | OvalJSON
  | TriangleJSON
  | QuadraticJSON
  | CubicJSON
  | PathJSON;

export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
