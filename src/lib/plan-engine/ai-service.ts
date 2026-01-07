/**
 * Servicio de Generación con IA (OpenAI)
 * Maneja la personalización y regeneración de planes usando GPT
 */

import {
  AIResponse,
  DailyNutrition,
  RegenerationConstraints,
  UserPreferences,
  WeeklyPlan,
  WorkoutDay,
} from "./types";

const OPENAI_API_KEY = import.meta.env.VITE_OPEN_AI_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// ============================================================================
// CONSTRUCCIÓN DE PROMPTS
// ============================================================================

/**
 * Construye el prompt para generar un plan completo desde cero
 */
function buildGenerationPrompt(
  preferences: UserPreferences,
  baseTemplate?: {
    training?: WorkoutDay[];
    nutrition?: DailyNutrition[];
  }
): string {
  const goalDescriptions = {
    "fat-loss": "pérdida de grasa (déficit calórico moderado)",
    "muscle": "ganancia de masa muscular (superávit calórico)",
    "maintain": "mantenimiento del peso actual",
    "performance": "mejora del rendimiento deportivo",
  };

  const equipmentDescriptions = {
    none: "sin equipamiento (solo peso corporal)",
    basic: "equipamiento básico (mancuernas, bandas de resistencia)",
    gym: "gimnasio completo (barras, máquinas, pesas)",
  };

  const dietDescriptions = {
    omnivore: "omnívoro (incluye carnes, pescados, huevos, lácteos)",
    vegetarian: "vegetariano (sin carnes ni pescados, pero con huevos y lácteos)",
    pescatarian: "pescetariano (sin carnes, pero con pescados, huevos y lácteos)",
    keto: "ketogénico (muy bajo en carbohidratos, alto en grasas)",
  };

  let prompt = `Eres un experto en fitness y nutrición basada en evidencia científica. 

Tu tarea es generar un plan semanal completo de entrenamiento y nutrición con las siguientes especificaciones:

## OBJETIVO DEL USUARIO
- Objetivo: ${goalDescriptions[preferences.goal]}
- Días de entrenamiento por semana: ${preferences.daysPerWeek}
- Tiempo por sesión: ${preferences.sessionTime} minutos
- Equipamiento disponible: ${equipmentDescriptions[preferences.equipment]}
- Tipo de dieta: ${dietDescriptions[preferences.dietType]}
- Alergias/intolerancias: ${preferences.allergies.length > 0 ? preferences.allergies.join(", ") : "ninguna"}
- Comidas al día: ${preferences.mealsPerDay}
- Estilo: ${preferences.style === "simple" ? "rápido y simple (rutinas cortas, comidas fáciles)" : "estricto (seguimiento detallado)"}
`;

  if (baseTemplate) {
    prompt += `
## PLANTILLA BASE
Se te proporciona una plantilla base que debes usar como referencia, pero puedes personalizarla según las necesidades del usuario.
`;
  }

  prompt += `
## REQUISITOS TÉCNICOS

### ENTRENAMIENTO
- Genera ${preferences.daysPerWeek} días de entrenamiento por semana
- Cada sesión debe durar aproximadamente ${preferences.sessionTime} minutos
- Incluye ejercicios específicos con: nombre, series, repeticiones, descanso (segundos), grupos musculares trabajados
- Distribuye el volumen de entrenamiento de forma equilibrada
- Incluye días de descanso apropiados
- Para principiantes: enfócate en técnica y movimientos básicos
- Para intermedios/avanzados: puedes incluir ejercicios más complejos

### NUTRICIÓN
- Genera un menú para los 7 días de la semana
- Cada día debe tener ${preferences.mealsPerDay} comidas
- Calcula las calorías y macros (proteína, carbohidratos, grasas) para cada comida
- Asegúrate de que el total diario sea coherente con el objetivo
- Incluye descripciones de platos y listas de ingredientes
- Proporciona instrucciones de preparación cuando sea relevante
- Evita completamente los alimentos a los que el usuario es alérgico
- Respeta el tipo de dieta especificado

## RESTRICCIONES DE SEGURIDAD
- Proteína mínima: 1.6 g/kg de peso corporal (si no se proporciona peso, usa 1.6 g/kg para un peso estimado de 70kg)
- Calorías mínimas: 1200 kcal/día (nunca menos)
- Distribución de macros razonable: proteína 20-40%, carbos 25-60%, grasas 20-40%
- Volumen de entrenamiento: 8-25 series por grupo muscular por semana
- Días de descanso: mínimo 1-2 días por semana

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con un JSON válido en este formato exacto:

\`\`\`json
{
  "training": {
    "weeklyStructure": [
      {
        "day": "Lun",
        "name": "Nombre del entrenamiento",
        "duration": 45,
        "focus": "upper|lower|full|cardio|rest",
        "intensity": "low|medium|high",
        "exercises": [
          {
            "name": "Nombre del ejercicio",
            "sets": 3,
            "reps": "8-12",
            "rest": 60,
            "muscleGroups": ["pecho", "tríceps"],
            "equipment": ["barra", "banco"],
            "notes": "Opcional: notas adicionales"
          }
        ]
      }
    ],
    "progression": "Descripción de cómo progresar semana a semana"
  },
  "nutrition": {
    "weeklyMenu": [
      {
        "day": "Lun",
        "totalCalories": 1800,
        "protein": 158,
        "carbs": 158,
        "fat": 60,
        "meals": [
          {
            "name": "Desayuno",
            "calories": 450,
            "protein": 25,
            "carbs": 50,
            "fat": 15,
            "description": "Descripción del plato",
            "ingredients": ["ingrediente1", "ingrediente2"],
            "recipe": {
              "instructions": ["Paso 1", "Paso 2"],
              "prepTime": 5,
              "cookTime": 10
            }
          }
        ]
      }
    ],
    "mealPrepTips": ["Consejo 1", "Consejo 2"]
  },
  "reasoning": "Breve explicación de las decisiones tomadas"
}
\`\`\`

IMPORTANTE: 
- Responde SOLO con el JSON, sin texto adicional antes o después
- Asegúrate de que el JSON sea válido
- Completa los 7 días de la semana para nutrición
- Completa todos los días solicitados para entrenamiento
`;

  return prompt;
}

/**
 * Construye el prompt para regenerar un plan con restricciones adicionales
 */
function buildRegenerationPrompt(
  existingPlan: WeeklyPlan,
  constraints: RegenerationConstraints
): string {
  let prompt = `Eres un experto en fitness y nutrición. 

Necesitas REGENERAR y AJUSTAR un plan existente aplicando las siguientes restricciones adicionales del usuario:

## PLAN ACTUAL
El usuario ya tiene un plan con estas características:
- Objetivo: ${existingPlan.preferences.goal}
- Días de entrenamiento: ${existingPlan.preferences.daysPerWeek}
- Tiempo por sesión: ${existingPlan.preferences.sessionTime} minutos
- Tipo de dieta: ${existingPlan.preferences.dietType}
- Alergias: ${existingPlan.preferences.allergies.join(", ") || "ninguna"}

## RESTRICCIONES ADICIONALES A APLICAR
`;

  if (constraints.excludeFoods && constraints.excludeFoods.length > 0) {
    prompt += `- EXCLUIR alimentos: ${constraints.excludeFoods.join(", ")}\n`;
  }

  if (constraints.maxCalories) {
    prompt += `- Calorías máximas diarias: ${constraints.maxCalories} kcal\n`;
  }

  if (constraints.minProtein) {
    prompt += `- Proteína mínima: ${constraints.minProtein} g/kg de peso\n`;
  }

  if (constraints.maxCarbs) {
    prompt += `- Carbohidratos máximos: ${constraints.maxCarbs} g/día\n`;
  }

  if (constraints.cookingMethods && constraints.cookingMethods.length > 0) {
    prompt += `- Métodos de cocción preferidos: ${constraints.cookingMethods.join(", ")}\n`;
  }

  if (constraints.maxSessionTime) {
    prompt += `- Tiempo máximo por sesión: ${constraints.maxSessionTime} minutos\n`;
  }

  if (constraints.preferredExercises && constraints.preferredExercises.length > 0) {
    prompt += `- Ejercicios preferidos: ${constraints.preferredExercises.join(", ")}\n`;
  }

  if (constraints.avoidExercises && constraints.avoidExercises.length > 0) {
    prompt += `- Evitar ejercicios: ${constraints.avoidExercises.join(", ")}\n`;
  }

  if (constraints.focusAreas && constraints.focusAreas.length > 0) {
    prompt += `- Áreas de enfoque: ${constraints.focusAreas.join(", ")}\n`;
  }

  if (constraints.notes) {
    prompt += `- Notas adicionales: ${constraints.notes}\n`;
  }

  prompt += `
## INSTRUCCIONES
1. MANTÉN la estructura general del plan (objetivo, días, tipo de dieta)
2. AJUSTA solo lo necesario para cumplir las restricciones
3. PRESERVA la coherencia nutricional y de entrenamiento
4. Si una restricción es incompatible con el objetivo, prioriza la seguridad y salud del usuario

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con un JSON válido en el mismo formato que el plan original, pero con los ajustes aplicados.

\`\`\`json
{
  "training": {
    "weeklyStructure": [...],
    "progression": "..."
  },
  "nutrition": {
    "weeklyMenu": [...],
    "mealPrepTips": [...]
  },
  "reasoning": "Explicación de los cambios realizados y por qué"
}
\`\`\`
`;

  return prompt;
}

// ============================================================================
// LLAMADAS A LA API
// ============================================================================

/**
 * Genera un plan completo usando IA
 */
export async function generatePlanWithAI(
  preferences: UserPreferences,
  baseTemplate?: {
    training?: WorkoutDay[];
    nutrition?: DailyNutrition[];
  }
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPEN_AI_KEY no está configurada. Por favor, añade VITE_OPEN_AI_KEY a tu archivo .env"
    );
  }

  const prompt = buildGenerationPrompt(preferences, baseTemplate);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // o "gpt-4" para mejor calidad
        messages: [
          {
            role: "system",
            content: "Eres un experto en fitness y nutrición basada en evidencia científica. Siempre respondes con JSON válido y estructurado.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }, // Fuerza respuesta JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error en API de OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió contenido de la API");
    }

    // Extraer JSON del contenido (por si viene con markdown)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const aiResponse: AIResponse = JSON.parse(jsonString);

    return aiResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error al parsear la respuesta de IA: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Regenera un plan existente aplicando restricciones adicionales
 */
export async function regeneratePlanWithAI(
  existingPlan: WeeklyPlan,
  constraints: RegenerationConstraints
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPEN_AI_KEY no está configurada. Por favor, añade VITE_OPEN_AI_KEY a tu archivo .env"
    );
  }

  const prompt = buildRegenerationPrompt(existingPlan, constraints);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un experto en fitness y nutrición. Ajustas planes existentes aplicando restricciones específicas del usuario.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error en API de OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió contenido de la API");
    }

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const aiResponse: AIResponse = JSON.parse(jsonString);

    return aiResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error al parsear la respuesta de IA: ${error.message}`);
    }
    throw error;
  }
}
