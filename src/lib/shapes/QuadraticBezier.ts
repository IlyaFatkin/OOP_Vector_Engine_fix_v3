import { Shape } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';

export class QuadraticBezier extends Shape {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  steps: number;
  private _flatCache: { x: number; y: number }[] | null = null;

  constructor(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    steps = 40
  ) {
    super();

    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.steps = steps;
  }

  evalLocal(t: number): { x: number; y: number } {
    const mt = 1 - t;

    return {
      x: mt * mt * this.x0 + 2 * mt * t * this.x1 + t * t * this.x2,
      y: mt * mt * this.y0 + 2 * mt * t * this.y1 + t * t * this.y2,
    };
  }

  flattenDevicePoints(): { x: number; y: number }[] {
    if (this._flatCache) return this._flatCache;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= this.steps; i++) {
      const p = this.evalLocal(i / this.steps);
      pts.push(this.transformPointToDevice(p.x, p.y));
    }
    this._flatCache = pts;
    return pts;
  }

  override markDirty(): void {
    this._flatCache = null;
    super.markDirty();
  }

  drawRaster(r: RasterRenderer) {
    r.strokePolyline(this.flattenDevicePoints(), this.strokeStyle, this.strokeWidth);
  }

  hitTest(px: number, py: number): boolean {
    const pts = this.flattenDevicePoints();
    const threshold = this.strokeWidth / 2 + 4;

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) continue;

      const t = Math.max(
        0,
        Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq)
      );

      const cx = a.x + t * dx;
      const cy = a.y + t * dy;

      if (Math.hypot(px - cx, py - cy) <= threshold) {
        return true;
      }
    }

    return false;
  }

  computeLocalBounds() {
    const pts = Array.from({ length: this.steps + 1 }, (_, i) =>
      this.evalLocal(i / this.steps)
    );

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  computeBounds() {
    const pts = this.flattenDevicePoints();

    return {
      minX: Math.min(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxX: Math.max(...pts.map((p) => p.x)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }

  getControlPoints() {
    return [
      { x: this.x0, y: this.y0 },
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];
  }

  setControlPoint(i: number, arg1: { x: number; y: number } | number, arg2?: number) {
    const pt = typeof arg1 === 'number' ? { x: arg1, y: arg2 ?? 0 } : arg1;
    if (i === 0) { this.x0 = pt.x; this.y0 = pt.y; }
    if (i === 1) { this.x1 = pt.x; this.y1 = pt.y; }
    if (i === 2) { this.x2 = pt.x; this.y2 = pt.y; }
    this.markDirty();
  }
  toJSON() {
    return {
      type: 'quadraticBezier' as const,
      id: this.id,
      transform: this.transform,
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
      x0: this.x0,
      y0: this.y0,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      steps: this.steps,
    };
  }
}