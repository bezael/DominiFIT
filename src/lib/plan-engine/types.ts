/**
 * Tipos y estructuras de datos para el Motor de Generación de Planes
 */

// ============================================================================
// ENUMS Y CONSTANTES
// ============================================================================

export enum GoalType {
  FAT_LOSS = "fat-loss",
  MUSCLE_GAIN = "muscle",
  MAINTENANCE = "maintain",
  PERFORMANCE = "performance"
}

export enum ExperienceLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

export enum EquipmentType {
  NONE = "none",
  BASIC = "basic",
  GYM = "gym"
}

export enum DietType {
  OMNIVORE = "omnivore",
  VEGETARIAN = "vegetarian",
  PESCATARIAN = "pescatarian",
  KETO = "keto"
}

export enum PlanStyle {
  SIMPLE = "simple",
  STRICT = "strict"
}

// ============================================================================
// INPUT DEL USUARIO (Desde Onboarding)
// ============================================================================

export interface UserPreferences {
  goal: GoalType;
  daysPerWeek: number; // 3-6
  sessionTime: number; // minutos: 20, 30, 45, 60
  equipment: EquipmentType;
  dietType: DietType;
  allergies: string[]; // ["Gluten", "Lácteos", "Frutos secos", etc.]
  mealsPerDay: number; // 3-5
  style: PlanStyle;
  // Opcionales para cálculo de macros
  weight?: number; // kg
  height?: number; // cm
  age?: number;
  gender?: "male" | "female";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very-active";
}

// ============================================================================
// RESTRICCIONES DINÁMICAS (Para regeneración)
// ============================================================================

export interface RegenerationConstraints {
  // Nutrición
  excludeFoods?: string[]; // ["lácteos", "gluten", "huevo"]
  maxCalories?: number;
  minProtein?: number; // g/kg
  maxCarbs?: number; // g
  cookingMethods?: string[]; // ["sin horno", "rápido", "batch cooking"]
  
  // Entrenamiento
  maxSessionTime?: number; // minutos
  preferredExercises?: string[];
  avoidExercises?: string[];
  focusAreas?: string[]; // ["core", "glúteos", "brazos"]
  
  // General
  notes?: string; // texto libre con restricciones adicionales
}

// ============================================================================
// PLANTILLAS DE ENTRENAMIENTO
// ============================================================================

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // "8-12" o "AMRAP" o "30s"
  rest: number; // segundos
  notes?: string;
  muscleGroups: string[]; // ["pecho", "tríceps"]
  equipment?: string[];
}

export interface WorkoutDay {
  day: string; // "Lun", "Mar", etc.
  name: string; // "Tren superior", "Cardio HIIT"
  duration: number; // minutos estimados
  exercises: Exercise[];
  focus: string; // "upper", "lower", "full", "cardio", "rest"
  intensity: "low" | "medium" | "high";
}

export interface TrainingTemplate {
  id: string;
  goal: GoalType;
  level: ExperienceLevel;
  daysPerWeek: number;
  sessionTime: number;
  equipment: EquipmentType;
  weeklyStructure: WorkoutDay[];
  progression: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
  };
}

// ============================================================================
// PLANTILLAS DE NUTRICIÓN
// ============================================================================

export interface Meal {
  name: string; // "Desayuno", "Almuerzo", etc.
  calories: number;
  protein: number; // gramos
  carbs: number; // gramos
  fat: number; // gramos
  description: string; // "Avena con frutas y nueces"
  ingredients: string[];
  recipe?: {
    instructions: string[];
    prepTime: number; // minutos
    cookTime: number; // minutos
  };
  substitutions?: string[]; // alternativas
}

export interface DailyNutrition {
  day: string; // "Lun", "Mar", etc.
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
}

export interface NutritionTemplate {
  id: string;
  goal: GoalType;
  dietType: DietType;
  mealsPerDay: number;
  dailyCalories: number;
  macroDistribution: {
    protein: number; // porcentaje
    carbs: number;
    fat: number;
  };
  weeklyMenu: DailyNutrition[];
  excludedAllergens: string[];
}

// ============================================================================
// PLAN COMPLETO GENERADO
// ============================================================================

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekNumber: number;
  createdAt: string; // ISO date
  version: number; // para versionado de regeneraciones
  
  // Metadata
  preferences: UserPreferences;
  constraints?: RegenerationConstraints;
  
  // Contenido
  training: {
    weeklyStructure: WorkoutDay[];
    totalVolume: {
      [muscleGroup: string]: number; // series totales por grupo muscular
    };
    progression: string;
  };
  
  nutrition: {
    dailyCalories: number;
    macroTargets: {
      protein: number; // gramos
      carbs: number;
      fat: number;
    };
    weeklyMenu: DailyNutrition[];
    mealPrepTips?: string[];
  };
  
  // Validación
  validation: {
    passed: boolean;
    warnings: string[];
    errors: string[];
    checks: ValidationCheck[];
  };
  
  // Metadata adicional
  metadata: {
    generatedBy: "template" | "ai" | "hybrid";
    aiModel?: string;
    templateIds?: string[];
    generationTime?: number; // ms
  };
}

// ============================================================================
// VALIDACIONES
// ============================================================================

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationRules {
  // Nutrición
  minProteinPerKg: number; // default: 1.6 g/kg
  maxProteinPerKg: number; // default: 2.5 g/kg
  minCalories: number; // según objetivo
  maxCalories: number;
  macroBalance: {
    minProteinPercent: number;
    maxProteinPercent: number;
    minCarbsPercent: number;
    maxCarbsPercent: number;
    minFatPercent: number;
    maxFatPercent: number;
  };
  
  // Entrenamiento
  minSessionsPerWeek: number; // según nivel
  maxSessionsPerWeek: number;
  minVolumePerMuscleGroup: number; // series/semana
  maxVolumePerMuscleGroup: number;
  maxSessionDuration: number; // minutos
  restDaysPerWeek: {
    min: number;
    max: number;
  };
}

// ============================================================================
// RESPUESTA DE IA
// ============================================================================

export interface AIResponse {
  training?: {
    weeklyStructure: WorkoutDay[];
    progression: string;
  };
  nutrition?: {
    weeklyMenu: DailyNutrition[];
    mealPrepTips?: string[];
  };
  reasoning?: string; // explicación de decisiones
}
