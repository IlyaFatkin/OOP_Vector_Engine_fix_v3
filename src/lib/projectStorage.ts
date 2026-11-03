import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { ShapeJSON } from './shapes/types';

const PROJECTS_DIR = 'VectorEngine/projects';
const INDEX_FILE = 'VectorEngine/index.json';

export type ProjectMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectData = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lineAlgorithm: string;
  shapes: ShapeJSON[];
};

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureDir() {
  try {
    await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
  } catch {
    /* ignore */
  }
  try {
    await mkdir('VectorEngine', { baseDir: BaseDirectory.Document, recursive: true });
  } catch {
    /* ignore */
  }
}

async function readIndex(): Promise<ProjectMeta[]> {
  await ensureDir();
  try {
    const content = await readTextFile(INDEX_FILE, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeIndex(index: ProjectMeta[]) {
  await ensureDir();
  await writeTextFile(INDEX_FILE, JSON.stringify(index, null, 2), {
    baseDir: BaseDirectory.Document,
  });
}

/**
 * Saves a project. Returns the final id of the saved project
 * (new unique id when projectId === 'new', otherwise the existing id).
 */
export async function saveProject(
  projectId: string,
  name: string,
  lineAlgorithm: string,
  shapes: ShapeJSON[]
): Promise<string> {
  await ensureDir();

  const now = new Date().toISOString();
  const index = await readIndex();

  let finalId = projectId;
  let existing = index.find((p) => p.id === projectId);

  if (projectId === 'new' || !existing) {
    // Always generate a unique id for new projects so deletion cannot cause collisions
    finalId = generateUniqueId();
    existing = undefined;
  }

  if (existing) {
    existing.name = name;
    existing.updatedAt = now;
  } else {
    index.push({
      id: finalId,
      name,
      createdAt: now,
      updatedAt: now,
    });
  }

  await writeIndex(index);

  const projectData: ProjectData = {
    id: finalId,
    name,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lineAlgorithm,
    shapes,
  };

  const filePath = `${PROJECTS_DIR}/${finalId}.json`;
  await writeTextFile(filePath, JSON.stringify(projectData, null, 2), {
    baseDir: BaseDirectory.Document,
  });

  return finalId;
}

export async function loadProject(projectId: string): Promise<ProjectData | null> {
  await ensureDir();

  try {
    const filePath = `${PROJECTS_DIR}/${projectId}.json`;
    const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function loadAllProjects(): Promise<ProjectMeta[]> {
  return await readIndex();
}

export async function deleteProject(projectId: string): Promise<void> {
  await ensureDir();

  const index = await readIndex();
  const newIndex = index.filter((p) => p.id !== projectId);
  await writeIndex(newIndex);
  // Note: file is left on disk intentionally (or could be removed if plugin supports unlink).
  // Index no longer references it, so it cannot be overwritten by a colliding id.
}
