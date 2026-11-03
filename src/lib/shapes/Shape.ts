import type { RasterRenderer } from '../raster/RasterRenderer';

export type Transform = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type Point = { x: number; y: number };

export type { ShapeJSON } from './types';
import type { ShapeJSON } from './types';

let ID = 0;

export abstract class Shape {
  id: string;

  transform: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };

  fillStyle = { r: 255, g: 0, b: 0, a: 255 };
  fillOpacity = 1;

  strokeStyle = { r: 0, g: 0, b: 0, a: 255 };
  strokeWidth = 1;
  strokeOpacity = 1;

  // Cached matrices and bounds. Invalidated on geometry/transform change.
  private _localToDevice: number[] | null = null;
  private _deviceToLocal: number[] | null = null;
  private _bounds: Bounds | null = null;
  private _localBounds: Bounds | null = null;

  constructor() {
    this.id = 'shape_' + ID++;
  }

  /** Call after changing geometry or transform so caches are rebuilt. */
  protected invalidate(): void {
    this._localToDevice = null;
    this._deviceToLocal = null;
    this._bounds = null;
    this._localBounds = null;
  }

  /** Public invalidation for external code that mutates transform directly. */
  markDirty(): void {
    this.invalidate();
  }

  getLocalToDeviceMatrix(): number[] {
    if (this._localToDevice) return this._localToDevice;

    const { x, y, rotation, scaleX, scaleY } = this.transform;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    this._localToDevice = [
      cos * scaleX,
      -sin * scaleY,
      x,
      sin * scaleX,
      cos * scaleY,
      y,
    ];
    return this._localToDevice;
  }

  getDeviceToLocalMatrix(): number[] {
    if (this._deviceToLocal) return this._deviceToLocal;

    const m = this.getLocalToDeviceMatrix();
    const a = m[0];
    const b = m[1];
    const c = m[2];
    const d = m[3];
    const e = m[4];
    const f = m[5];

    const det = a * e - b * d;
    if (Math.abs(det) < 0.000001) {
      this._deviceToLocal = [1, 0, 0, 0, 1, 0];
      return this._deviceToLocal;
    }

    const invDet = 1 / det;
    this._deviceToLocal = [
      e * invDet,
      -b * invDet,
      (b * f - e * c) * invDet,
      -d * invDet,
      a * invDet,
      (d * c - a * f) * invDet,
    ];
    return this._deviceToLocal;
  }

  transformPointToDevice(px: number, py: number): Point {
    const m = this.getLocalToDeviceMatrix();
    return {
      x: m[0] * px + m[1] * py + m[2],
      y: m[3] * px + m[4] * py + m[5],
    };
  }

  transformPointToLocal(px: number, py: number): Point {
    const m = this.getDeviceToLocalMatrix();
    return {
      x: m[0] * px + m[1] * py + m[2],
      y: m[3] * px + m[4] * py + m[5],
    };
  }

  getCenter(): Point {
    const b = this.getBounds();
    return {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2,
    };
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const local = this.getLocalBounds();
    const localW = local.maxX - local.minX;
    const localH = local.maxY - local.minY;
    if (localW <= 1e-6 || localH <= 1e-6) return;

    const current = this.getBounds();
    const curW = Math.max(1e-3, current.maxX - current.minX);
    const curH = Math.max(1e-3, current.maxY - current.minY);

    const newW = Math.max(1, maxX - minX);
    const newH = Math.max(1, maxY - minY);

    this.transform.scaleX *= newW / curW;
    this.transform.scaleY *= newH / curH;

    this.transform.scaleX = Math.max(0.05, Math.min(100, this.transform.scaleX));
    this.transform.scaleY = Math.max(0.05, Math.min(100, this.transform.scaleY));

    const lcx = (local.minX + local.maxX) / 2;
    const lcy = (local.minY + local.maxY) / 2;
    const ncx = (minX + maxX) / 2;
    const ncy = (minY + maxY) / 2;

    const cos = Math.cos(this.transform.rotation);
    const sin = Math.sin(this.transform.rotation);
    const sx = this.transform.scaleX;
    const sy = this.transform.scaleY;

    this.transform.x = ncx - (cos * sx * lcx - sin * sy * lcy);
    this.transform.y = ncy - (sin * sx * lcx + cos * sy * lcy);

    this.invalidate();
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
  }

  clone(): this {
    return Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      JSON.parse(JSON.stringify(this))
    );
  }

  /** Optional control points for editable curves / shapes. */
  getControlPoints?(): Point[];

  /**
   * Set a control point.
   * Accepts either (index, point) or (index, x, y) for compatibility.
   */
  setControlPoint?(i: number, localPt: Point): void;
  setControlPoint?(i: number, x: number, y: number): void;

  abstract drawRaster(r: RasterRenderer): void;
  abstract hitTest(px: number, py: number): boolean;

  /** Subclasses implement the actual computation. Shape caches the result. */
  protected abstract computeLocalBounds(): Bounds;
  protected abstract computeBounds(): Bounds;

  getLocalBounds(): Bounds {
    if (this._localBounds) return this._localBounds;
    this._localBounds = this.computeLocalBounds();
    return this._localBounds;
  }

  getBounds(): Bounds {
    if (this._bounds) return this._bounds;
    this._bounds = this.computeBounds();
    return this._bounds;
  }

  abstract toJSON(): ShapeJSON;
}
