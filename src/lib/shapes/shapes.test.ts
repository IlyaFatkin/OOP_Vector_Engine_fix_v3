import { test, expect } from 'vitest'
import { Triangle } from './Triangle'
import { QuadraticBezier } from './QuadraticBezier'
import { CubicBezier } from './CubicBezier'
import { PathBezier } from './PathBezier'

test('Triangle hitTest inside', () => {
  const t = new Triangle(-50, 50, 50, 50, 0, -50)
  expect(t.hitTest(0, 0)).toBe(true)
})

test('Triangle hitTest outside', () => {
  const t = new Triangle(-50, 50, 50, 50, 0, -50)
  expect(t.hitTest(100, 100)).toBe(false)
})

test('Triangle getLocalBounds', () => {
  const t = new Triangle(-30, 20, 40, 20, 0, -30)
  const b = t.getLocalBounds()
  expect(b.minX).toBe(-30)
  expect(b.maxX).toBe(40)
})

test('QuadraticBezier evalLocal at t=0', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(0)
  expect(pt.x).toBeCloseTo(0, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('QuadraticBezier evalLocal at t=1', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(1)
  expect(pt.x).toBeCloseTo(100, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('QuadraticBezier evalLocal at t=0.5', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const pt = q.evalLocal(0.5)
  expect(pt.x).toBeCloseTo(50, 1)
  expect(pt.y).toBeCloseTo(50, 1)
})

test('CubicBezier evalLocal at t=0', () => {
  const c = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0)
  const pt = c.evalLocal(0)
  expect(pt.x).toBeCloseTo(0, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('CubicBezier evalLocal at t=1', () => {
  const c = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0)
  const pt = c.evalLocal(1)
  expect(pt.x).toBeCloseTo(100, 1)
  expect(pt.y).toBeCloseTo(0, 1)
})

test('PathBezier polyline mode', () => {
  const p = new PathBezier([
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 50 },
  ], 'polyline')
  const pts = p.getControlPoints()
  expect(pts.length).toBe(3)
})

test('PathBezier add and remove point', () => {
  const p = new PathBezier([{ x: 0, y: 0 }], 'polyline')
  p.addPointLocal(10, 10)
  expect(p.getControlPoints().length).toBe(2)
  p.removePoint(0)
  expect(p.getControlPoints().length).toBe(1)
})

test('PathBezier catmull mode creates beziers', () => {
  const p = new PathBezier([
    { x: 0, y: 0 },
    { x: 10, y: 20 },
    { x: 30, y: 10 },
    { x: 40, y: 30 },
  ], 'catmull', false)
  const beziers = p.catmullToBeziers()
  expect(beziers.length).toBeGreaterThan(0)
})
import { Rect } from './Rect'
import { Oval } from './Oval'

test('QuadraticBezier setControlPoint updates geometry', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  q.setControlPoint(1, { x: 80, y: 40 })
  const pts = q.getControlPoints()
  expect(pts[1].x).toBe(80)
  expect(pts[1].y).toBe(40)
})

test('QuadraticBezier setControlPoint accepts (index, x, y)', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  q.setControlPoint(0, 10, 20)
  const pts = q.getControlPoints()
  expect(pts[0].x).toBe(10)
  expect(pts[0].y).toBe(20)
})

test('CubicBezier setControlPoint updates all points', () => {
  const c = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0)
  c.setControlPoint(2, { x: 90, y: 15 })
  const pts = c.getControlPoints()
  expect(pts[2].x).toBe(90)
  expect(pts[2].y).toBe(15)
  expect(pts.length).toBe(4)
})

test('Rect serialize and restore preserves fields', () => {
  const r = new Rect(140, 100)
  r.transform = { x: 250, y: 180, rotation: 0.5, scaleX: 1.2, scaleY: 0.8 }
  r.fillStyle = { r: 255, g: 100, b: 50, a: 200 }
  const json = r.toJSON()
  expect(json.type).toBe('rect')
  expect(json.w).toBe(140)
  expect(json.h).toBe(100)
  expect(json.transform?.x).toBe(250)
})

test('Oval uses rx/ry fields', () => {
  const o = new Oval(70, 50)
  expect(o.rx).toBe(70)
  expect(o.ry).toBe(50)
  const json = o.toJSON()
  expect(json.rx).toBe(70)
  expect(json.ry).toBe(50)
})

test('Matrix is cached until markDirty', () => {
  const r = new Rect(100, 50)
  r.transform = { x: 10, y: 20, rotation: 0, scaleX: 2, scaleY: 2 }
  const m1 = r.getLocalToDeviceMatrix()
  const m2 = r.getLocalToDeviceMatrix()
  expect(m1).toBe(m2) // same reference = cached
  r.markDirty()
  const m3 = r.getLocalToDeviceMatrix()
  expect(m3).not.toBe(m1)
})

import { shapeFromJSON } from './deserialize'

test('Rect serialize and restore via shapeFromJSON', () => {
  const r = new Rect(140, 100)
  r.transform = { x: 250, y: 180, rotation: 0.5, scaleX: 1.2, scaleY: 0.8 }
  const restored = shapeFromJSON(r.toJSON())
  expect(restored).toBeInstanceOf(Rect)
  const rr = restored as Rect
  expect(rr.w).toBe(140)
  expect(rr.transform.x).toBe(250)
  expect(rr.transform.scaleX).toBeCloseTo(1.2)
})

test('bounds are cached until markDirty', () => {
  const r = new Rect(100, 50)
  const b1 = r.getBounds()
  const b2 = r.getBounds()
  expect(b1).toBe(b2)
  r.markDirty()
  const b3 = r.getBounds()
  expect(b3).not.toBe(b1)
})

test('curve points are cached until markDirty', () => {
  const q = new QuadraticBezier(0, 0, 50, 100, 100, 0)
  const p1 = q.flattenDevicePoints()
  const p2 = q.flattenDevicePoints()
  expect(p1).toBe(p2)
  q.markDirty()
  const p3 = q.flattenDevicePoints()
  expect(p3).not.toBe(p1)
})
