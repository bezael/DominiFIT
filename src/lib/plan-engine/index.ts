/**
 * Motor de Generación de Planes - Exportaciones principales
 */

export * from "./ai-service";
export * from "./plan-generator";
export { calculateDailyCalories, findMatchingNutritionTemplate, nutritionTemplates } from "./templates/nutrition-templates";
export { findMatchingTrainingTemplate, trainingTemplates } from "./templates/training-templates";
export * from "./types";
export * from "./validations";

