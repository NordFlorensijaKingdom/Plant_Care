import type { CareDifficulty, LightLevel, TimeInterval } from "@/context/PlantContext";

import catalogRaw from "@/data/plantCatalog.json";
import problemsRaw from "@/data/plantProblems.json";

export interface PlantCatalogEntry {
  id: string;
  name: string;
  latinName: string;
  carePlanId: string;
  lightLevel: LightLevel;
  difficulty: CareDifficulty;
  temperatureC: { min: number; max: number };
  quickTips: {
    light: string;
    watering: string;
    temperature: string;
    mistakes: string[];
  };
  recommended?: {
    wateringEnabled?: boolean;
    mistingEnabled?: boolean;
    wateringInterval?: TimeInterval;
    mistingInterval?: TimeInterval;
  };
  relatedProblems?: string[];
}

export interface PlantProblemEntry {
  id: string;
  title: string;
  symptoms: string[];
  likelyCauses: string[];
  safeActions: string[];
  avoidActions: string[];
  whenToEscalate: string[];
}

const CATALOG = catalogRaw as unknown as PlantCatalogEntry[];
const PROBLEMS = problemsRaw as unknown as PlantProblemEntry[];

export function getPlantCatalog(): PlantCatalogEntry[] {
  return CATALOG;
}

export function getPlantCatalogById(id: string): PlantCatalogEntry | null {
  return CATALOG.find((p) => p.id === id) ?? null;
}

export function getPlantProblems(): PlantProblemEntry[] {
  return PROBLEMS;
}

export function getPlantProblemById(id: string): PlantProblemEntry | null {
  return PROBLEMS.find((p) => p.id === id) ?? null;
}

export type PlantCatalogFilters = {
  lightLevels?: LightLevel[];
  carePlanIds?: string[];
  difficulties?: CareDifficulty[];
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function filterPlantCatalog(
  query: string,
  filters: PlantCatalogFilters
): PlantCatalogEntry[] {
  const q = norm(query);
  return CATALOG.filter((p) => {
    if (filters.lightLevels?.length && !filters.lightLevels.includes(p.lightLevel)) return false;
    if (filters.carePlanIds?.length && !filters.carePlanIds.includes(p.carePlanId)) return false;
    if (filters.difficulties?.length && !filters.difficulties.includes(p.difficulty)) return false;
    if (!q) return true;
    const hay = `${p.name} ${p.latinName}`.toLowerCase();
    return hay.includes(q);
  });
}

export function filterProblems(query: string): PlantProblemEntry[] {
  const q = norm(query);
  if (!q) return PROBLEMS;
  return PROBLEMS.filter((p) => {
    const hay = `${p.title} ${p.symptoms.join(" ")} ${p.likelyCauses.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

