/**
 * Motor Principal de Generación de Planes
 * Orquesta la generación híbrida: plantillas + IA
 */

import { generatePlanWithAI, regeneratePlanWithAI } from "./ai-service";
import { calculateDailyCalories, findMatchingNutritionTemplate } from "./templates/nutrition-templates";
import { findMatchingTrainingTemplate } from "./templates/training-templates";
import {
  ExperienceLevel,
  RegenerationConstraints,
  UserPreferences,
  WeeklyPlan
} from "./types";
import { autoFixPlan, defaultValidationRules, isPlanValid, validatePlan } from "./validations";

// ============================================================================
// GENERACIÓN INICIAL DE PLAN
// ============================================================================

/**
 * Genera un plan semanal completo usando el enfoque híbrido
 */
export async function generateWeeklyPlan(
  userId: string,
  preferences: UserPreferences,
  weekNumber: number = 1,
  useAI: boolean = true
): Promise<WeeklyPlan> {
  const startTime = Date.now();

  // 1. Buscar plantillas base
  const trainingTemplate = findMatchingTrainingTemplate(
    preferences.goal,
    preferences.daysPerWeek,
    preferences.sessionTime,
    preferences.equipment,
    ExperienceLevel.BEGINNER // TODO: determinar nivel basado en historial
  );

  const nutritionTemplate = findMatchingNutritionTemplate(
    preferences.goal,
    preferences.dietType,
    preferences.mealsPerDay,
    preferences.allergies
  );

  // 2. Calcular calorías diarias
  const dailyCalories = calculateDailyCalories(
    preferences.goal,
    preferences.weight,
    preferences.height,
    preferences.age,
    preferences.gender,
    preferences.activityLevel
  );

  // 3. Generar plan base desde plantillas
  let plan: WeeklyPlan = {
    id: `plan-${userId}-${weekNumber}-${Date.now()}`,
    userId,
    weekNumber,
    createdAt: new Date().toISOString(),
    version: 1,
    preferences,
    training: {
      weeklyStructure: trainingTemplate?.weeklyStructure || [],
      totalVolume: {},
      progression: trainingTemplate?.progression.week1 || "",
    },
    nutrition: {
      dailyCalories,
      macroTargets: {
        protein: nutritionTemplate
          ? (dailyCalories * nutritionTemplate.macroDistribution.protein) / 100 / 4
          : dailyCalories * 0.3 / 4, // 30% de proteína por defecto
        carbs: nutritionTemplate
          ? (dailyCalories * nutritionTemplate.macroDistribution.carbs) / 100 / 4
          : dailyCalories * 0.4 / 4, // 40% de carbos por defecto
        fat: nutritionTemplate
          ? (dailyCalories * nutritionTemplate.macroDistribution.fat) / 100 / 9
          : dailyCalories * 0.3 / 9, // 30% de grasas por defecto
      },
      weeklyMenu: nutritionTemplate?.weeklyMenu || [],
    },
    validation: {
      passed: false,
      warnings: [],
      errors: [],
      checks: [],
    },
    metadata: {
      generatedBy: trainingTemplate && nutritionTemplate ? "template" : "hybrid",
      templateIds: [
        trainingTemplate?.id,
        nutritionTemplate?.id,
      ].filter(Boolean) as string[],
    },
  };

  // 4. Si hay plantillas completas, usarlas como base
  // Si no, o si se solicita IA, generar con IA
  if (useAI && (!trainingTemplate || !nutritionTemplate)) {
    try {
      const aiResponse = await generatePlanWithAI(preferences, {
        training: trainingTemplate?.weeklyStructure,
        nutrition: nutritionTemplate?.weeklyMenu,
      });

      // Fusionar respuesta de IA con plan base
      if (aiResponse.training) {
        plan.training.weeklyStructure = aiResponse.training.weeklyStructure;
        plan.training.progression = aiResponse.training.progression;
      }

      if (aiResponse.nutrition) {
        plan.nutrition.weeklyMenu = aiResponse.nutrition.weeklyMenu;
        plan.nutrition.mealPrepTips = aiResponse.nutrition.mealPrepTips;

        // Recalcular macros desde el menú generado
        const firstDay = aiResponse.nutrition.weeklyMenu[0];
        if (firstDay) {
          plan.nutrition.dailyCalories = firstDay.totalCalories;
          plan.nutrition.macroTargets = {
            protein: firstDay.protein,
            carbs: firstDay.carbs,
            fat: firstDay.fat,
          };
        }
      }

      plan.metadata.generatedBy = "ai";
      plan.metadata.aiModel = "gpt-4o-mini";
    } catch (error) {
      console.error("Error al generar con IA, usando solo plantillas:", error);
      // Continuar con plantillas si IA falla
    }
  }

  // 5. Calcular volumen total por grupo muscular
  plan.training.totalVolume = calculateMuscleGroupVolume(plan.training.weeklyStructure);

  // 6. Validar plan
  const validationChecks = validatePlan(plan, defaultValidationRules, preferences.weight);
  plan.validation.checks = validationChecks;
  plan.validation.passed = isPlanValid(validationChecks);
  plan.validation.errors = validationChecks
    .filter(c => c.severity === "error" && !c.passed)
    .map(c => c.message);
  plan.validation.warnings = validationChecks
    .filter(c => c.severity === "warning" && !c.passed)
    .map(c => c.message);

  // 7. Ajustar automáticamente si hay errores críticos
  if (!plan.validation.passed) {
    plan = autoFixPlan(plan, validationChecks, defaultValidationRules);
    
    // Re-validar después del ajuste
    const revalidationChecks = validatePlan(plan, defaultValidationRules, preferences.weight);
    plan.validation.checks = revalidationChecks;
    plan.validation.passed = isPlanValid(revalidationChecks);
  }

  // 8. Metadata final
  plan.metadata.generationTime = Date.now() - startTime;

  return plan;
}

// ============================================================================
// REGENERACIÓN CON RESTRICCIONES
// ============================================================================

/**
 * Regenera un plan existente aplicando restricciones adicionales
 */
export async function regeneratePlan(
  existingPlan: WeeklyPlan,
  constraints: RegenerationConstraints
): Promise<WeeklyPlan> {
  const startTime = Date.now();

  // 1. Actualizar preferencias con restricciones
  const updatedPreferences: UserPreferences = {
    ...existingPlan.preferences,
    sessionTime: constraints.maxSessionTime || existingPlan.preferences.sessionTime,
    allergies: [
      ...existingPlan.preferences.allergies,
      ...(constraints.excludeFoods || []),
    ],
  };

  // 2. Generar con IA aplicando restricciones
  let aiResponse;
  try {
    aiResponse = await regeneratePlanWithAI(existingPlan, constraints);
  } catch (error) {
    throw new Error(`Error al regenerar plan con IA: ${error instanceof Error ? error.message : "Error desconocido"}`);
  }

  // 3. Crear nuevo plan fusionando el existente con los cambios
  const regeneratedPlan: WeeklyPlan = {
    ...existingPlan,
    id: `${existingPlan.id}-regenerated-${Date.now()}`,
    version: existingPlan.version + 1,
    createdAt: new Date().toISOString(),
    constraints: {
      ...existingPlan.constraints,
      ...constraints,
    },
  };

  // 4. Aplicar cambios de entrenamiento
  if (aiResponse.training) {
    regeneratedPlan.training.weeklyStructure = aiResponse.training.weeklyStructure;
    regeneratedPlan.training.progression = aiResponse.training.progression;
    regeneratedPlan.training.totalVolume = calculateMuscleGroupVolume(
      aiResponse.training.weeklyStructure
    );
  }

  // 5. Aplicar cambios de nutrición
  if (aiResponse.nutrition) {
    regeneratedPlan.nutrition.weeklyMenu = aiResponse.nutrition.weeklyMenu;
    regeneratedPlan.nutrition.mealPrepTips = aiResponse.nutrition.mealPrepTips;

    // Ajustar calorías y macros si se especificó
    if (constraints.maxCalories) {
      regeneratedPlan.nutrition.dailyCalories = constraints.maxCalories;
    }

    if (constraints.minProtein && existingPlan.preferences.weight) {
      regeneratedPlan.nutrition.macroTargets.protein =
        existingPlan.preferences.weight * constraints.minProtein;
    }

    // Recalcular desde el menú si está disponible
    const firstDay = aiResponse.nutrition.weeklyMenu[0];
    if (firstDay) {
      regeneratedPlan.nutrition.dailyCalories = firstDay.totalCalories;
      regeneratedPlan.nutrition.macroTargets = {
        protein: firstDay.protein,
        carbs: firstDay.carbs,
        fat: firstDay.fat,
      };
    }
  }

  // 6. Validar plan regenerado
  const validationChecks = validatePlan(
    regeneratedPlan,
    defaultValidationRules,
    existingPlan.preferences.weight
  );
  regeneratedPlan.validation.checks = validationChecks;
  regeneratedPlan.validation.passed = isPlanValid(validationChecks);
  regeneratedPlan.validation.errors = validationChecks
    .filter(c => c.severity === "error" && !c.passed)
    .map(c => c.message);
  regeneratedPlan.validation.warnings = validationChecks
    .filter(c => c.severity === "warning" && !c.passed)
    .map(c => c.message);

  // 7. Ajustar automáticamente si hay errores
  if (!regeneratedPlan.validation.passed) {
    const fixedPlan = autoFixPlan(regeneratedPlan, validationChecks, defaultValidationRules);
    Object.assign(regeneratedPlan, fixedPlan);
  }

  // 8. Metadata
  regeneratedPlan.metadata.generatedBy = "ai";
  regeneratedPlan.metadata.aiModel = "gpt-4o-mini";
  regeneratedPlan.metadata.generationTime = Date.now() - startTime;

  return regeneratedPlan;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Calcula el volumen total (series) por grupo muscular
 */
function calculateMuscleGroupVolume(weeklyStructure: any[]): { [key: string]: number } {
  const volume: { [key: string]: number } = {};

  weeklyStructure.forEach(day => {
    day.exercises?.forEach((exercise: any) => {
      exercise.muscleGroups?.forEach((muscle: string) => {
        if (!volume[muscle]) {
          volume[muscle] = 0;
        }
        volume[muscle] += exercise.sets || 0;
      });
    });
  });

  return volume;
}
