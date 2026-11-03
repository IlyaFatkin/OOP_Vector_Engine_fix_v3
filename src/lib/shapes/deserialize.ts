import { Shape } from './Shape';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';
import { Triangle } from './Triangle';
import { QuadraticBezier } from './QuadraticBezier';
import { CubicBezier } from './CubicBezier';
import { PathBezier } from './PathBezier';
import type { ShapeJSON } from './types';

export function shapeFromJSON(data: ShapeJSON): Shape | null {
  let shape: Shape | null = null;

  switch (data.type) {
    case 'rect':
      shape = new Rect(data.w, data.h);
      break;
    case 'line':
      shape = new Line(data.x1, data.y1, data.x2, data.y2);
      break;
    case 'oval':
      shape = new Oval(data.rx, data.ry);
      break;
    case 'triangle':
      shape = new Triangle(data.x1, data.y1, data.x2, data.y2, data.x3, data.y3);
      break;
    case 'quadraticBezier':
      shape = new QuadraticBezier(data.x0, data.y0, data.x1, data.y1, data.x2, data.y2, data.steps ?? 40);
      break;
    case 'cubicBezier':
      shape = new CubicBezier(
        data.x0, data.y0, data.x1, data.y1,
        data.x2, data.y2, data.x3, data.y3,
        data.steps ?? 40
      );
      break;
    case 'pathBezier':
      shape = new PathBezier(data.points ?? [], data.mode ?? 'polyline', data.closed ?? false, data.steps ?? 40);
      break;
    default:
      return null;
  }

  if (data.transform) shape.transform = data.transform;
  if (data.fillStyle) shape.fillStyle = data.fillStyle;
  if (data.strokeStyle) shape.strokeStyle = data.strokeStyle;
  if (data.strokeWidth !== undefined) shape.strokeWidth = data.strokeWidth;
  if (data.id) shape.id = data.id;
  shape.markDirty();
  return shape;
}
