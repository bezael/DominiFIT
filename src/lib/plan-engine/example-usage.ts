/**
 * Ejemplos de Uso del Motor de Generación de Planes
 * 
 * Este archivo muestra cómo integrar el motor en tu aplicación
 */

import {
  generateWeeklyPlan,
  regeneratePlan,
  UserPreferences,
  RegenerationConstraints,
  GoalType,
  EquipmentType,
  DietType,
  PlanStyle,
} from "./index";

// ============================================================================
// EJEMPLO 1: Generación Inicial de Plan
// ============================================================================

export async function exampleGenerateInitialPlan() {
  const userId = "user-123";
  
  const preferences: UserPreferences = {
    goal: GoalType.FAT_LOSS,
    daysPerWeek: 4,
    sessionTime: 45,
    equipment: EquipmentType.GYM,
    dietType: DietType.OMNIVORE,
    allergies: [],
    mealsPerDay: 4,
    style: PlanStyle.SIMPLE,
    // Opcionales para cálculo preciso de macros
    weight: 70, // kg
    height: 175, // cm
    age: 30,
    gender: "male",
    activityLevel: "moderate",
  };

  try {
    const plan = await generateWeeklyPlan(userId, preferences, 1, true);
    
    console.log("Plan generado:", {
      id: plan.id,
      validationPassed: plan.validation.passed,
      warnings: plan.validation.warnings,
      generatedBy: plan.metadata.generatedBy,
    });

    // Guardar en Supabase
    // await supabase.from('weekly_plans').insert(plan);

    return plan;
  } catch (error) {
    console.error("Error al generar plan:", error);
    throw error;
  }
}

// ============================================================================
// EJEMPLO 2: Regeneración con Restricciones
// ============================================================================

export async function exampleRegeneratePlan(existingPlan: any) {
  const constraints: RegenerationConstraints = {
    excludeFoods: ["lácteos", "gluten"],
    maxSessionTime: 30,
    minProtein: 2.0, // g/kg
    cookingMethods: ["sin horno", "rápido"],
    notes: "Necesito entrenamientos más cortos y sin lácteos ni gluten",
  };

  try {
    const regeneratedPlan = await regeneratePlan(existingPlan, constraints);
    
    console.log("Plan regenerado:", {
      id: regeneratedPlan.id,
      version: regeneratedPlan.version,
      validationPassed: regeneratedPlan.validation.passed,
      constraints: regeneratedPlan.constraints,
    });

    return regeneratedPlan;
  } catch (error) {
    console.error("Error al regenerar plan:", error);
    throw error;
  }
}

// ============================================================================
// EJEMPLO 3: Integración con Onboarding
// ============================================================================

/**
 * Esta función se puede llamar desde la página Loading.tsx
 * después de que el usuario complete el onboarding
 */
export async function generatePlanFromOnboarding(
  userId: string,
  onboardingData: {
    goal: string;
    daysPerWeek: number;
    sessionTime: number;
    equipment: string;
    dietType: string;
    allergies: string[];
    mealsPerDay: number;
    style: string;
  }
) {
  // Mapear datos del onboarding a UserPreferences
  const preferences: UserPreferences = {
    goal: onboardingData.goal as GoalType,
    daysPerWeek: onboardingData.daysPerWeek,
    sessionTime: onboardingData.sessionTime,
    equipment: onboardingData.equipment as EquipmentType,
    dietType: onboardingData.dietType as DietType,
    allergies: onboardingData.allergies,
    mealsPerDay: onboardingData.mealsPerDay,
    style: onboardingData.style as PlanStyle,
  };

  // Generar plan
  const plan = await generateWeeklyPlan(userId, preferences, 1, true);

  // Guardar en base de datos (Supabase)
  // const { data, error } = await supabase
  //   .from('weekly_plans')
  //   .insert(plan)
  //   .select()
  //   .single();

  return plan;
}

// ============================================================================
// EJEMPLO 4: Validación Manual
// ============================================================================

import { validatePlan, isPlanValid, defaultValidationRules } from "./validations";

export function exampleValidatePlan(plan: any, userWeight?: number) {
  const checks = validatePlan(plan, defaultValidationRules, userWeight);
  const isValid = isPlanValid(checks);

  console.log("Validación del plan:", {
    passed: isValid,
    errors: checks.filter(c => c.severity === "error" && !c.passed),
    warnings: checks.filter(c => c.severity === "warning" && !c.passed),
  });

  return { isValid, checks };
}

// ============================================================================
// EJEMPLO 5: Uso con React Query
// ============================================================================

/**
 * Hook de React Query para generar plan
 * 
 * import { useQuery } from "@tanstack/react-query";
 * import { generateWeeklyPlan } from "@/lib/plan-engine";
 * 
 * function useGeneratePlan(userId: string, preferences: UserPreferences) {
 *   return useQuery({
 *     queryKey: ['plan', userId, preferences],
 *     queryFn: () => generateWeeklyPlan(userId, preferences, 1, true),
 *     staleTime: 24 * 60 * 60 * 1000, // 24 horas
 *     retry: 2,
 *   });
 * }
 */

// ============================================================================
// EJEMPLO 6: Manejo de Errores y Fallback
// ============================================================================

export async function generatePlanWithFallback(
  userId: string,
  preferences: UserPreferences
) {
  try {
    // Intentar con IA
    const plan = await generateWeeklyPlan(userId, preferences, 1, true);
    
    // Si la validación falla, intentar solo con plantillas
    if (!plan.validation.passed && plan.metadata.generatedBy === "ai") {
      console.warn("Plan con IA falló validación, intentando con plantillas...");
      const templatePlan = await generateWeeklyPlan(userId, preferences, 1, false);
      
      if (templatePlan.validation.passed) {
        return templatePlan;
      }
    }

    return plan;
  } catch (error) {
    console.error("Error en generación con IA, usando solo plantillas:", error);
    
    // Fallback a plantillas
    return await generateWeeklyPlan(userId, preferences, 1, false);
  }
}
