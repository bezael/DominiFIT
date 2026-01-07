/**
 * Biblioteca de Plantillas de Nutrición
 * Base determinística para generación de planes
 */

import { DietType, GoalType, NutritionTemplate } from "../types";

export const nutritionTemplates: NutritionTemplate[] = [
  // ============================================================================
  // PÉRDIDA DE GRASA - OMNÍVORO - 4 COMIDAS
  // ============================================================================
  {
    id: "fat-loss-omnivore-4",
    goal: GoalType.FAT_LOSS,
    dietType: DietType.OMNIVORE,
    mealsPerDay: 4,
    dailyCalories: 1800,
    macroDistribution: {
      protein: 35, // 35%
      carbs: 35,   // 35%
      fat: 30      // 30%
    },
    excludedAllergens: [],
    weeklyMenu: [
      {
        day: "Lun",
        totalCalories: 1800,
        protein: 158, // 35% de 1800 = 630 kcal / 4 = 157.5g
        carbs: 158,  // 35% de 1800 = 630 kcal / 4 = 157.5g
        fat: 60,     // 30% de 1800 = 540 kcal / 9 = 60g
        meals: [
          {
            name: "Desayuno",
            calories: 450,
            protein: 25,
            carbs: 50,
            fat: 15,
            description: "Avena con plátano, nueces y proteína en polvo",
            ingredients: ["avena", "plátano", "nueces", "proteína en polvo", "leche"],
            recipe: {
              instructions: [
                "Cocinar 50g de avena con 200ml de leche",
                "Añadir 1 plátano en rodajas",
                "Mezclar 30g de proteína en polvo",
                "Añadir 15g de nueces picadas"
              ],
              prepTime: 5,
              cookTime: 5
            },
            substitutions: ["Quinoa en lugar de avena", "Almendras en lugar de nueces"]
          },
          {
            name: "Almuerzo",
            calories: 550,
            protein: 45,
            carbs: 55,
            fat: 18,
            description: "Pollo a la plancha con arroz integral y verduras al vapor",
            ingredients: ["pollo pechuga", "arroz integral", "brócoli", "zanahoria", "aceite de oliva"],
            recipe: {
              instructions: [
                "Cocinar 150g de pechuga de pollo a la plancha",
                "Hervir 80g de arroz integral",
                "Cocinar al vapor brócoli y zanahoria",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 25
            },
            substitutions: ["Pavo en lugar de pollo", "Quinoa en lugar de arroz"]
          },
          {
            name: "Merienda",
            calories: 300,
            protein: 25,
            carbs: 30,
            fat: 12,
            description: "Yogur griego con frutos rojos y almendras",
            ingredients: ["yogur griego", "fresas", "arándanos", "almendras"],
            recipe: {
              instructions: [
                "Servir 200g de yogur griego",
                "Añadir 100g de frutos rojos",
                "Añadir 15g de almendras"
              ],
              prepTime: 2,
              cookTime: 0
            },
            substitutions: ["Requesón en lugar de yogur", "Nueces en lugar de almendras"]
          },
          {
            name: "Cena",
            calories: 500,
            protein: 40,
            carbs: 40,
            fat: 20,
            description: "Salmón al horno con batata y ensalada verde",
            ingredients: ["salmón", "batata", "lechuga", "tomate", "aceite de oliva"],
            recipe: {
              instructions: [
                "Hornear 150g de salmón a 180°C por 15 min",
                "Hornear 150g de batata cortada en rodajas",
                "Preparar ensalada con lechuga y tomate",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 20
            },
            substitutions: ["Atún en lugar de salmón", "Boniato en lugar de batata"]
          },
        ]
      },
      // ... (similar para otros días de la semana)
      // Por simplicidad, aquí solo mostramos el lunes como ejemplo
      // En producción, se completarían los 7 días
    ]
  },

  // ============================================================================
  // GANANCIA MUSCULAR - OMNÍVORO - 5 COMIDAS
  // ============================================================================
  {
    id: "muscle-omnivore-5",
    goal: GoalType.MUSCLE_GAIN,
    dietType: DietType.OMNIVORE,
    mealsPerDay: 5,
    dailyCalories: 2800,
    macroDistribution: {
      protein: 30, // 30%
      carbs: 45,   // 45%
      fat: 25       // 25%
    },
    excludedAllergens: [],
    weeklyMenu: [
      {
        day: "Lun",
        totalCalories: 2800,
        protein: 210, // 30% de 2800 = 840 kcal / 4 = 210g
        carbs: 315,   // 45% de 2800 = 1260 kcal / 4 = 315g
        fat: 78,      // 25% de 2800 = 700 kcal / 9 = 77.8g
        meals: [
          {
            name: "Desayuno",
            calories: 600,
            protein: 35,
            carbs: 70,
            fat: 20,
            description: "Tortilla de huevos con pan integral, aguacate y fruta",
            ingredients: ["huevos", "pan integral", "aguacate", "plátano"],
            recipe: {
              instructions: [
                "Hacer tortilla con 3 huevos",
                "Tostar 2 rebanadas de pan integral",
                "Añadir medio aguacate",
                "Acompañar con 1 plátano"
              ],
              prepTime: 5,
              cookTime: 10
            },
            substitutions: ["Claras de huevo adicionales", "Avena en lugar de pan"]
          },
          {
            name: "Media mañana",
            calories: 400,
            protein: 30,
            carbs: 50,
            fat: 12,
            description: "Batido de proteína con avena y plátano",
            ingredients: ["proteína en polvo", "avena", "plátano", "leche", "mantequilla de cacahuete"],
            recipe: {
              instructions: [
                "Mezclar 40g de proteína en polvo",
                "Añadir 50g de avena",
                "Añadir 1 plátano",
                "Añadir 200ml de leche",
                "Añadir 15g de mantequilla de cacahuete"
              ],
              prepTime: 3,
              cookTime: 0
            },
            substitutions: ["Leche de almendras", "Mantequilla de almendras"]
          },
          {
            name: "Almuerzo",
            calories: 700,
            protein: 55,
            carbs: 80,
            fat: 20,
            description: "Arroz con pollo, verduras y legumbres",
            ingredients: ["arroz", "pollo pechuga", "brócoli", "garbanzos", "aceite de oliva"],
            recipe: {
              instructions: [
                "Cocinar 150g de arroz",
                "Cocinar 200g de pechuga de pollo",
                "Cocinar brócoli al vapor",
                "Añadir 100g de garbanzos cocidos",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 30
            },
            substitutions: ["Quinoa en lugar de arroz", "Pavo en lugar de pollo"]
          },
          {
            name: "Merienda",
            calories: 500,
            protein: 40,
            carbs: 60,
            fat: 15,
            description: "Yogur griego con granola y frutos secos",
            ingredients: ["yogur griego", "granola", "nueces", "miel"],
            recipe: {
              instructions: [
                "Servir 250g de yogur griego",
                "Añadir 60g de granola",
                "Añadir 20g de nueces",
                "Endulzar con miel"
              ],
              prepTime: 2,
              cookTime: 0
            },
            substitutions: ["Requesón en lugar de yogur", "Almendras en lugar de nueces"]
          },
          {
            name: "Cena",
            calories: 600,
            protein: 50,
            carbs: 55,
            fat: 20,
            description: "Carne magra con patata y verduras",
            ingredients: ["ternera magra", "patata", "espinacas", "aceite de oliva"],
            recipe: {
              instructions: [
                "Cocinar 200g de ternera a la plancha",
                "Hornear 200g de patata",
                "Saltear espinacas",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 30
            },
            substitutions: ["Pollo en lugar de ternera", "Boniato en lugar de patata"]
          },
        ]
      },
    ]
  },

  // ============================================================================
  // VEGETARIANO - PÉRDIDA DE GRASA - 4 COMIDAS
  // ============================================================================
  {
    id: "fat-loss-vegetarian-4",
    goal: GoalType.FAT_LOSS,
    dietType: DietType.VEGETARIAN,
    mealsPerDay: 4,
    dailyCalories: 1700,
    macroDistribution: {
      protein: 30,
      carbs: 40,
      fat: 30
    },
    excludedAllergens: [],
    weeklyMenu: [
      {
        day: "Lun",
        totalCalories: 1700,
        protein: 128, // 30% de 1700 = 510 kcal / 4 = 127.5g
        carbs: 170,  // 40% de 1700 = 680 kcal / 4 = 170g
        fat: 57,     // 30% de 1700 = 510 kcal / 9 = 56.7g
        meals: [
          {
            name: "Desayuno",
            calories: 400,
            protein: 20,
            carbs: 55,
            fat: 12,
            description: "Avena con frutas, semillas de chía y proteína vegetal",
            ingredients: ["avena", "plátano", "semillas de chía", "proteína vegetal", "leche de almendras"],
            recipe: {
              instructions: [
                "Cocinar 50g de avena con leche de almendras",
                "Añadir 1 plátano",
                "Añadir 15g de semillas de chía",
                "Mezclar 25g de proteína vegetal"
              ],
              prepTime: 5,
              cookTime: 5
            },
            substitutions: ["Quinoa en lugar de avena", "Leche de soja"]
          },
          {
            name: "Almuerzo",
            calories: 500,
            protein: 35,
            carbs: 60,
            fat: 18,
            description: "Quinoa con garbanzos, verduras y aguacate",
            ingredients: ["quinoa", "garbanzos", "brócoli", "aguacate", "aceite de oliva"],
            recipe: {
              instructions: [
                "Cocinar 100g de quinoa",
                "Añadir 120g de garbanzos cocidos",
                "Cocinar brócoli al vapor",
                "Añadir medio aguacate",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 20
            },
            substitutions: ["Lentejas en lugar de garbanzos", "Arroz integral en lugar de quinoa"]
          },
          {
            name: "Merienda",
            calories: 300,
            protein: 25,
            carbs: 30,
            fat: 12,
            description: "Requesón con frutos rojos y nueces",
            ingredients: ["requesón", "fresas", "arándanos", "nueces"],
            recipe: {
              instructions: [
                "Servir 200g de requesón",
                "Añadir 100g de frutos rojos",
                "Añadir 15g de nueces"
              ],
              prepTime: 2,
              cookTime: 0
            },
            substitutions: ["Yogur griego vegetal", "Almendras en lugar de nueces"]
          },
          {
            name: "Cena",
            calories: 500,
            protein: 35,
            carbs: 40,
            fat: 18,
            description: "Tofu salteado con verduras y arroz integral",
            ingredients: ["tofu", "brócoli", "zanahoria", "arroz integral", "aceite de oliva"],
            recipe: {
              instructions: [
                "Saltear 150g de tofu",
                "Saltear brócoli y zanahoria",
                "Servir con 80g de arroz integral cocido",
                "Aliñar con aceite de oliva"
              ],
              prepTime: 10,
              cookTime: 15
            },
            substitutions: ["Tempeh en lugar de tofu", "Quinoa en lugar de arroz"]
          },
        ]
      },
    ]
  },
];

/**
 * Calcula las calorías diarias según objetivo y características del usuario
 */
export function calculateDailyCalories(
  goal: GoalType,
  weight?: number,
  height?: number,
  age?: number,
  gender?: "male" | "female",
  activityLevel?: string
): number {
  // Si no hay datos del usuario, usar valores por defecto según objetivo
  if (!weight || !height || !age || !gender || !activityLevel) {
    const defaults = {
      [GoalType.FAT_LOSS]: 1800,
      [GoalType.MUSCLE_GAIN]: 2800,
      [GoalType.MAINTENANCE]: 2200,
      [GoalType.PERFORMANCE]: 2500,
    };
    return defaults[goal] || 2000;
  }

  // Cálculo de TMB (Tasa Metabólica Basal) usando fórmula de Mifflin-St Jeor
  let tmb: number;
  if (gender === "male") {
    tmb = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    tmb = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Multiplicadores de actividad
  const activityMultipliers: { [key: string]: number } = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  };

  const tdee = tmb * (activityMultipliers[activityLevel] || 1.375);

  // Ajuste según objetivo
  const goalMultipliers = {
    [GoalType.FAT_LOSS]: 0.8,      // Déficit del 20%
    [GoalType.MUSCLE_GAIN]: 1.15,  // Superávit del 15%
    [GoalType.MAINTENANCE]: 1.0,
    [GoalType.PERFORMANCE]: 1.1,
  };

  return Math.round(tdee * (goalMultipliers[goal] || 1.0));
}

/**
 * Busca una plantilla que coincida con las preferencias del usuario
 */
export function findMatchingNutritionTemplate(
  goal: GoalType,
  dietType: DietType,
  mealsPerDay: number,
  allergies: string[] = []
): NutritionTemplate | null {
  return nutritionTemplates.find(
    template =>
      template.goal === goal &&
      template.dietType === dietType &&
      template.mealsPerDay === mealsPerDay &&
      !template.excludedAllergens.some(allergen => allergies.includes(allergen))
  ) || null;
}
