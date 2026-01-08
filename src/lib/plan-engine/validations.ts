/**
 * Sistema de Validaciones y Reglas de Coherencia
 * Asegura que los planes generados sean seguros y fisiológicamente coherentes
 */

import {
  UserPreferences,
  ValidationCheck,
  ValidationRules,
  WeeklyPlan
} from "./types";

// ============================================================================
// REGLAS DE VALIDACIÓN POR DEFECTO
// ============================================================================

export const defaultValidationRules: ValidationRules = {
  // Nutrición
  minProteinPerKg: 1.6, // g/kg - mínimo basado en evidencia científica
  maxProteinPerKg: 2.5, // g/kg - máximo razonable
  minCalories: 1200, // mínimo absoluto para mujeres
  maxCalories: 4000, // máximo razonable
  macroBalance: {
    minProteinPercent: 20,
    maxProteinPercent: 40,
    minCarbsPercent: 25,
    maxCarbsPercent: 60,
    minFatPercent: 20,
    maxFatPercent: 40,
  },

  // Entrenamiento
  minSessionsPerWeek: 2,
  maxSessionsPerWeek: 6,
  minVolumePerMuscleGroup: 8, // series/semana mínimo
  maxVolumePerMuscleGroup: 25, // series/semana máximo
  maxSessionDuration: 120, // minutos
  restDaysPerWeek: {
    min: 1,
    max: 3,
  },
};

// ============================================================================
// VALIDACIONES DE NUTRICIÓN
// ============================================================================

function validateNutrition(
  plan: WeeklyPlan,
  rules: ValidationRules,
  userWeight?: number
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const { nutrition } = plan;

  // 1. Calorías totales
  if (nutrition.dailyCalories < rules.minCalories) {
    checks.push({
      name: "calorias_minimas",
      passed: false,
      message: `Las calorías diarias (${nutrition.dailyCalories}) están por debajo del mínimo recomendado (${rules.minCalories} kcal). Esto puede ser peligroso para la salud.`,
      severity: "error",
    });
  } else if (nutrition.dailyCalories > rules.maxCalories) {
    checks.push({
      name: "calorias_maximas",
      passed: false,
      message: `Las calorías diarias (${nutrition.dailyCalories}) exceden el máximo razonable (${rules.maxCalories} kcal).`,
      severity: "warning",
    });
  } else {
    checks.push({
      name: "calorias_rango",
      passed: true,
      message: `Calorías diarias (${nutrition.dailyCalories} kcal) dentro del rango seguro.`,
      severity: "info",
    });
  }

  // 2. Proteína por kg de peso
  if (userWeight) {
    const proteinPerKg = nutrition.macroTargets.protein / userWeight;
    if (proteinPerKg < rules.minProteinPerKg) {
      checks.push({
        name: "proteina_minima",
        passed: false,
        message: `La proteína (${proteinPerKg.toFixed(1)} g/kg) está por debajo del mínimo recomendado (${rules.minProteinPerKg} g/kg) para optimizar resultados.`,
        severity: "error",
      });
    } else if (proteinPerKg > rules.maxProteinPerKg) {
      checks.push({
        name: "proteina_maxima",
        passed: false,
        message: `La proteína (${proteinPerKg.toFixed(1)} g/kg) excede el máximo recomendado (${rules.maxProteinPerKg} g/kg). No hay beneficios adicionales.`,
        severity: "warning",
      });
    } else {
      checks.push({
        name: "proteina_optima",
        passed: true,
        message: `Proteína (${proteinPerKg.toFixed(1)} g/kg) dentro del rango óptimo.`,
        severity: "info",
      });
    }
  }

  // 3. Distribución de macros
  const totalMacros = nutrition.macroTargets.protein + nutrition.macroTargets.carbs + nutrition.macroTargets.fat;
  const totalCaloriesFromMacros = 
    nutrition.macroTargets.protein * 4 + 
    nutrition.macroTargets.carbs * 4 + 
    nutrition.macroTargets.fat * 9;

  const proteinPercent = (nutrition.macroTargets.protein * 4 / totalCaloriesFromMacros) * 100;
  const carbsPercent = (nutrition.macroTargets.carbs * 4 / totalCaloriesFromMacros) * 100;
  const fatPercent = (nutrition.macroTargets.fat * 9 / totalCaloriesFromMacros) * 100;

  if (proteinPercent < rules.macroBalance.minProteinPercent) {
    checks.push({
      name: "macro_proteina_min",
      passed: false,
      message: `La proteína representa solo el ${proteinPercent.toFixed(1)}% de las calorías. Mínimo recomendado: ${rules.macroBalance.minProteinPercent}%.`,
      severity: "error",
    });
  } else if (proteinPercent > rules.macroBalance.maxProteinPercent) {
    checks.push({
      name: "macro_proteina_max",
      passed: false,
      message: `La proteína representa el ${proteinPercent.toFixed(1)}% de las calorías. Máximo recomendado: ${rules.macroBalance.maxProteinPercent}%.`,
      severity: "warning",
    });
  }

  if (carbsPercent < rules.macroBalance.minCarbsPercent) {
    checks.push({
      name: "macro_carbs_min",
      passed: false,
      message: `Los carbohidratos representan solo el ${carbsPercent.toFixed(1)}% de las calorías. Mínimo recomendado: ${rules.macroBalance.minCarbsPercent}%.`,
      severity: "warning",
    });
  }

  if (fatPercent < rules.macroBalance.minFatPercent) {
    checks.push({
      name: "macro_grasa_min",
      passed: false,
      message: `Las grasas representan solo el ${fatPercent.toFixed(1)}% de las calorías. Mínimo recomendado: ${rules.macroBalance.minFatPercent}%.`,
      severity: "error",
    });
  }

  // 4. Consistencia del menú semanal
  const weeklyCalories = nutrition.weeklyMenu.reduce((sum, day) => sum + day.totalCalories, 0);
  const avgDailyCalories = weeklyCalories / nutrition.weeklyMenu.length;
  const caloriesVariance = Math.abs(avgDailyCalories - nutrition.dailyCalories);

  if (caloriesVariance > 200) {
    checks.push({
      name: "consistencia_calorias",
      passed: false,
      message: `Hay una variación significativa (${caloriesVariance.toFixed(0)} kcal) entre los días. Se recomienda mantener consistencia.`,
      severity: "warning",
    });
  }

  return checks;
}

// ============================================================================
// VALIDACIONES DE ENTRENAMIENTO
// ============================================================================

function validateTraining(
  plan: WeeklyPlan,
  rules: ValidationRules,
  preferences: UserPreferences
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const { training } = plan;

  // 1. Número de sesiones
  const trainingDays = training.weeklyStructure.filter(day => day.focus !== "rest").length;
  
  if (trainingDays < rules.minSessionsPerWeek) {
    checks.push({
      name: "sesiones_minimas",
      passed: false,
      message: `Solo hay ${trainingDays} días de entrenamiento. Mínimo recomendado: ${rules.minSessionsPerWeek} días/semana.`,
      severity: "error",
    });
  } else if (trainingDays > rules.maxSessionsPerWeek) {
    checks.push({
      name: "sesiones_maximas",
      passed: false,
      message: `Hay ${trainingDays} días de entrenamiento. Máximo recomendado: ${rules.maxSessionsPerWeek} días/semana para evitar sobreentrenamiento.`,
      severity: "warning",
    });
  } else {
    checks.push({
      name: "sesiones_optimas",
      passed: true,
      message: `Número de sesiones (${trainingDays}) dentro del rango óptimo.`,
      severity: "info",
    });
  }

  // 2. Días de descanso
  const restDays = training.weeklyStructure.filter(day => day.focus === "rest").length;
  if (restDays < rules.restDaysPerWeek.min) {
    checks.push({
      name: "descanso_minimo",
      passed: false,
      message: `Solo hay ${restDays} día(s) de descanso. Mínimo recomendado: ${rules.restDaysPerWeek.min} día(s) para recuperación.`,
      severity: "error",
    });
  } else if (restDays > rules.restDaysPerWeek.max) {
    checks.push({
      name: "descanso_maximo",
      passed: false,
      message: `Hay ${restDays} días de descanso. Esto puede ser excesivo para alcanzar objetivos.`,
      severity: "warning",
    });
  }

  // 3. Volumen por grupo muscular
  const muscleGroupVolume: { [key: string]: number } = {};
  
  training.weeklyStructure.forEach(day => {
    // Validar que exercises existe y es un array
    if (!day.exercises || !Array.isArray(day.exercises)) {
      return; // Saltar días sin ejercicios o con estructura inválida
    }
    
    day.exercises.forEach(exercise => {
      // Validar que exercise tiene las propiedades necesarias
      if (!exercise || !exercise.muscleGroups || !Array.isArray(exercise.muscleGroups)) {
        return; // Saltar ejercicios sin grupos musculares
      }
      
      exercise.muscleGroups.forEach(muscle => {
        if (!muscleGroupVolume[muscle]) {
          muscleGroupVolume[muscle] = 0;
        }
        muscleGroupVolume[muscle] += exercise.sets || 0;
      });
    });
  });

  Object.entries(muscleGroupVolume).forEach(([muscle, volume]) => {
    if (volume < rules.minVolumePerMuscleGroup) {
      checks.push({
        name: `volumen_min_${muscle}`,
        passed: false,
        message: `El grupo muscular "${muscle}" tiene solo ${volume} series/semana. Mínimo recomendado: ${rules.minVolumePerMuscleGroup} series.`,
        severity: "warning",
      });
    } else if (volume > rules.maxVolumePerMuscleGroup) {
      checks.push({
        name: `volumen_max_${muscle}`,
        passed: false,
        message: `El grupo muscular "${muscle}" tiene ${volume} series/semana. Máximo recomendado: ${rules.maxVolumePerMuscleGroup} series para evitar sobreentrenamiento.`,
        severity: "error",
      });
    }
  });

  // 4. Duración de sesiones
  training.weeklyStructure.forEach(day => {
    if (day.duration > rules.maxSessionDuration) {
      checks.push({
        name: `duracion_max_${day.day}`,
        passed: false,
        message: `La sesión del ${day.day} dura ${day.duration} minutos. Máximo recomendado: ${rules.maxSessionDuration} minutos.`,
        severity: "warning",
      });
    }

    // Validar coherencia entre duración estimada y ejercicios
    if (!day.exercises || !Array.isArray(day.exercises) || day.exercises.length === 0) {
      // Si no hay ejercicios, no validar tiempo estimado
      return;
    }
    
    const estimatedTime = day.exercises.reduce((total, ex) => {
      if (!ex) return total;
      const setsTime = (ex.sets || 0) * (parseInt(ex.reps) || 30); // segundos aproximados
      const restTime = (ex.sets || 0) * (ex.rest || 60);
      return total + setsTime + restTime;
    }, 0) / 60; // convertir a minutos

    if (Math.abs(estimatedTime - day.duration) > 15) {
      checks.push({
        name: `coherencia_tiempo_${day.day}`,
        passed: false,
        message: `La duración estimada (${estimatedTime.toFixed(0)} min) no coincide con la duración declarada (${day.duration} min) para el ${day.day}.`,
        severity: "warning",
      });
    }
  });

  // 5. Coherencia con preferencias del usuario
  if (trainingDays !== preferences.daysPerWeek) {
    checks.push({
      name: "coherencia_dias",
      passed: false,
      message: `El plan tiene ${trainingDays} días de entrenamiento, pero el usuario solicitó ${preferences.daysPerWeek} días.`,
      severity: "error",
    });
  }

  const avgSessionTime = training.weeklyStructure
    .filter(day => day.duration > 0)
    .reduce((sum, day) => sum + day.duration, 0) / trainingDays;

  if (Math.abs(avgSessionTime - preferences.sessionTime) > 10) {
    checks.push({
      name: "coherencia_tiempo",
      passed: false,
      message: `El tiempo promedio de sesión (${avgSessionTime.toFixed(0)} min) no coincide con lo solicitado (${preferences.sessionTime} min).`,
      severity: "warning",
    });
  }

  return checks;
}

// ============================================================================
// VALIDACIÓN COMPLETA
// ============================================================================

export function validatePlan(
  plan: WeeklyPlan,
  rules: ValidationRules = defaultValidationRules,
  userWeight?: number
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Validaciones de nutrición
  checks.push(...validateNutrition(plan, rules, userWeight));

  // Validaciones de entrenamiento
  checks.push(...validateTraining(plan, rules, plan.preferences));

  return checks;
}

/**
 * Determina si un plan es válido (sin errores críticos)
 */
export function isPlanValid(checks: ValidationCheck[]): boolean {
  return !checks.some(check => check.severity === "error" && !check.passed);
}

/**
 * Ajusta automáticamente un plan para corregir errores de validación
 */
export function autoFixPlan(
  plan: WeeklyPlan,
  checks: ValidationCheck[],
  rules: ValidationRules = defaultValidationRules
): WeeklyPlan {
  const fixedPlan = { ...plan };
  const errors = checks.filter(c => c.severity === "error" && !c.passed);

  errors.forEach(error => {
    // Ajustes automáticos según el tipo de error
    switch (error.name) {
      case "calorias_minimas":
        // Aumentar calorías al mínimo
        fixedPlan.nutrition.dailyCalories = Math.max(
          fixedPlan.nutrition.dailyCalories,
          rules.minCalories
        );
        break;

      case "proteina_minima":
        // Aumentar proteína al mínimo
        if (plan.preferences.weight) {
          const minProtein = plan.preferences.weight * rules.minProteinPerKg;
          fixedPlan.nutrition.macroTargets.protein = Math.max(
            fixedPlan.nutrition.macroTargets.protein,
            minProtein
          );
        }
        break;

      case "sesiones_minimas":
        // Añadir días de entrenamiento adicionales
        // (esto requeriría lógica más compleja, por ahora solo marcamos)
        break;

      // ... más casos de ajuste automático
    }
  });

  return fixedPlan;
}
