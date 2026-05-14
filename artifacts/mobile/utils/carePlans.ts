import type { TimeInterval } from "@/context/PlantContext";

export type CarePlanId = "succulents" | "tropical" | "flowering";

export interface CarePlanTemplate {
  id: CarePlanId;
  wateringEnabled: boolean;
  mistingEnabled: boolean;
  wateringInterval: TimeInterval;
  mistingInterval: TimeInterval;
}

export const CARE_PLAN_TEMPLATES: CarePlanTemplate[] = [
  {
    id: "succulents",
    wateringEnabled: true,
    mistingEnabled: false,
    wateringInterval: { value: 14, unit: "days" },
    mistingInterval: { value: 1, unit: "days" },
  },
  {
    id: "tropical",
    wateringEnabled: true,
    mistingEnabled: true,
    wateringInterval: { value: 3, unit: "days" },
    mistingInterval: { value: 1, unit: "days" },
  },
  {
    id: "flowering",
    wateringEnabled: true,
    mistingEnabled: true,
    wateringInterval: { value: 2, unit: "days" },
    mistingInterval: { value: 2, unit: "days" },
  },
];

export function findCarePlanTemplate(id: string | null | undefined): CarePlanTemplate | null {
  if (!id) return null;
  const found = CARE_PLAN_TEMPLATES.find((t) => t.id === id);
  return found ?? null;
}
