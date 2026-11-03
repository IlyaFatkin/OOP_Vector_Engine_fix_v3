import { test, expect, vi, beforeEach } from 'vitest'
import { Rect } from './shapes/Rect'
import { shapeFromJSON } from './shapes/deserialize'
import type { ShapeJSON } from './shapes/types'

const files = new Map<string, string>()

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { Document: 1 },
  mkdir: vi.fn(async () => {}),
  readTextFile: vi.fn(async (path: string) => {
    const content = files.get(path)
    if (content === undefined) throw new Error('not found')
    return content
  }),
  writeTextFile: vi.fn(async (path: string, content: string) => {
    files.set(path, content)
  }),
}))

beforeEach(() => {
  files.clear()
})

test('saveProject returns unique id and persists shapes', async () => {
  const { saveProject, loadProject } = await import('./projectStorage')

  const shapes: ShapeJSON[] = [
    { type: 'rect', w: 140, h: 100, transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 } },
  ]

  const id = await saveProject('new', 'Тест', 'bresenham', shapes)
  expect(id).toBeTruthy()
  expect(id).not.toBe('new')
  expect(id).not.toMatch(/^\d+$/)

  const loaded = await loadProject(id)
  expect(loaded).not.toBeNull()
  expect(loaded!.name).toBe('Тест')
  expect(loaded!.shapes).toHaveLength(1)
  expect(loaded!.shapes[0].type).toBe('rect')
})

test('delete then save does not overwrite another project', async () => {
  const { saveProject, loadProject, deleteProject, loadAllProjects } = await import('./projectStorage')

  const a = await saveProject('new', 'A', 'bresenham', [])
  const b = await saveProject('new', 'B', 'bresenham', [])
  expect(a).not.toBe(b)

  await deleteProject(a)
  const list = await loadAllProjects()
  expect(list.map(p => p.id)).not.toContain(a)
  expect(list.map(p => p.id)).toContain(b)

  const c = await saveProject('new', 'C', 'bresenham', [])
  expect(c).not.toBe(a)
  expect(c).not.toBe(b)

  const stillB = await loadProject(b)
  expect(stillB?.name).toBe('B')
})

test('serialize then restore rect keeps geometry and transform', async () => {
  const r = new Rect(140, 100)
  r.transform = { x: 250, y: 180, rotation: 0.5, scaleX: 1.2, scaleY: 0.8 }
  r.fillStyle = { r: 255, g: 100, b: 50, a: 200 }

  const json = r.toJSON() as ShapeJSON
  const restored = shapeFromJSON(json)
  expect(restored).not.toBeNull()
  expect(restored).toBeInstanceOf(Rect)
  const rr = restored as Rect
  expect(rr.w).toBe(140)
  expect(rr.h).toBe(100)
  expect(rr.transform.x).toBe(250)
  expect(rr.transform.rotation).toBeCloseTo(0.5)
  expect(rr.transform.scaleX).toBeCloseTo(1.2)
  expect(rr.fillStyle.g).toBe(100)
})
