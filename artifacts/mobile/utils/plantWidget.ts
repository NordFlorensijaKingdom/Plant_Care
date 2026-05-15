import { HEALTH_STATUS_CONFIG, Plant, getProgress, getTimeRemaining } from "@/context/PlantContext";

export type PlantWidgetPayload = {
  id: string;
  name: string;
  species: string;
  healthLabel: string;
  healthColor: string;
  wateringEnabled: boolean;
  waterProgress: number;
  waterRemaining: string;
  mistingEnabled: boolean;
  mistProgress: number;
  mistRemaining: string;
};

export function buildPlantWidgetPayload(plant: Plant): PlantWidgetPayload {
  return {
    id: plant.id,
    name: plant.name,
    species: plant.species,
    healthLabel: HEALTH_STATUS_CONFIG[plant.healthStatus].label,
    healthColor: HEALTH_STATUS_CONFIG[plant.healthStatus].color,
    wateringEnabled: plant.wateringEnabled,
    waterProgress: getProgress(plant.lastWatered, plant.wateringInterval),
    waterRemaining: getTimeRemaining(plant.lastWatered, plant.wateringInterval),
    mistingEnabled: plant.mistingEnabled,
    mistProgress: getProgress(plant.lastMisted, plant.mistingInterval),
    mistRemaining: getTimeRemaining(plant.lastMisted, plant.mistingInterval),
  };
}

