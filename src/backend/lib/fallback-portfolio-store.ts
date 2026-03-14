import fs from 'fs';
import path from 'path';
import { portfolioProjects as seedProjects } from '@/shared/data/portfolio';

type PortfolioProjectRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  year: number;
  paints: string[];
};

type PortfolioState = {
  projects: PortfolioProjectRecord[];
  nextIdCounter: number;
};

type PortfolioInput = {
  title: string;
  description: string;
  category: string;
  image?: string;
  year: number;
  paints: string[];
};

// Keep runtime fallback data outside Next build output to avoid dev reload loops.
const storeDirectory = path.join(process.cwd(), '.runtime-data');
const storeFilePath = path.join(storeDirectory, 'fallback-portfolio-store.json');

function mapSeedProject(project: (typeof seedProjects)[number], id: string): PortfolioProjectRecord {
  return {
    id,
    title: project.title,
    description: project.description,
    category: project.category,
    image: project.image ?? '',
    year: project.year,
    paints: [...project.paints],
  };
}

function buildSeedState(): PortfolioState {
  return {
    projects: seedProjects.map((project) => mapSeedProject(project, String(project.id))),
    nextIdCounter: seedProjects.length + 1,
  };
}

function ensureStoreFile() {
  if (!fs.existsSync(storeDirectory)) {
    fs.mkdirSync(storeDirectory, { recursive: true });
  }

  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, JSON.stringify(buildSeedState()), 'utf8');
  }
}

function writeState(state: PortfolioState) {
  ensureStoreFile();
  fs.writeFileSync(storeFilePath, JSON.stringify(state), 'utf8');
}

function mergeMissingSeedProjects(state: PortfolioState) {
  const existingTitles = new Set(state.projects.map((project) => project.title.toLowerCase()));
  const existingByTitle = new Map(
    state.projects.map((project) => [project.title.toLowerCase(), project])
  );
  let nextId = state.nextIdCounter;
  let hasChanges = false;

  for (const project of seedProjects) {
    const normalizedTitle = project.title.toLowerCase();
    const existingProject = existingByTitle.get(normalizedTitle);

    if (existingProject) {
      // Keep runtime edits, but align image path with the latest seeded asset.
      if (existingProject.image !== (project.image ?? '')) {
        existingProject.image = project.image ?? '';
        hasChanges = true;
      }
      continue;
    }

    state.projects.push(mapSeedProject(project, String(nextId)));
    existingTitles.add(normalizedTitle);
    nextId += 1;
    hasChanges = true;
  }

  if (nextId !== state.nextIdCounter) {
    state.nextIdCounter = nextId;
    hasChanges = true;
  }

  return hasChanges;
}

function readState(): PortfolioState {
  ensureStoreFile();

  try {
    const raw = fs.readFileSync(storeFilePath, 'utf8');
    const parsed = JSON.parse(raw) as PortfolioState;

    if (!Array.isArray(parsed.projects) || typeof parsed.nextIdCounter !== 'number') {
      throw new Error('Invalid fallback portfolio store file');
    }

    if (mergeMissingSeedProjects(parsed)) {
      writeState(parsed);
    }

    return parsed;
  } catch {
    const seedState = buildSeedState();
    writeState(seedState);
    return seedState;
  }
}

function normalizeInput(input: PortfolioInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    image: input.image?.trim() ?? '',
    year: Number(input.year),
    paints: input.paints.map((paint) => paint.trim()).filter(Boolean),
  };
}

export function listFallbackPortfolioProjects() {
  const state = readState();
  return [...state.projects].sort((a, b) => b.year - a.year);
}

export function createFallbackPortfolioProject(input: PortfolioInput) {
  const state = readState();
  const normalized = normalizeInput(input);

  const project: PortfolioProjectRecord = {
    id: String(state.nextIdCounter),
    ...normalized,
  };

  state.nextIdCounter += 1;
  state.projects.unshift(project);
  writeState(state);
  return project;
}

export function updateFallbackPortfolioProject(id: string, input: PortfolioInput) {
  const state = readState();
  const index = state.projects.findIndex((project) => project.id === id);
  if (index < 0) {
    return null;
  }

  state.projects[index] = {
    ...state.projects[index],
    ...normalizeInput(input),
  };

  writeState(state);
  return state.projects[index];
}

export function deleteFallbackPortfolioProject(id: string) {
  const state = readState();
  const index = state.projects.findIndex((project) => project.id === id);
  if (index < 0) {
    return false;
  }

  state.projects.splice(index, 1);
  writeState(state);
  return true;
}

