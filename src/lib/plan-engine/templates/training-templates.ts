/**
 * Biblioteca de Plantillas de Entrenamiento
 * Base determinística para generación de planes
 */

import { EquipmentType, ExperienceLevel, GoalType, TrainingTemplate } from "../types";

export const trainingTemplates: TrainingTemplate[] = [
  // ============================================================================
  // PÉRDIDA DE GRASA - PRINCIPIANTE
  // ============================================================================
  {
    id: "fat-loss-beginner-4-gym",
    goal: GoalType.FAT_LOSS,
    level: ExperienceLevel.BEGINNER,
    daysPerWeek: 4,
    sessionTime: 45,
    equipment: EquipmentType.GYM,
    weeklyStructure: [
      {
        day: "Lun",
        name: "Tren superior + Cardio",
        duration: 45,
        focus: "upper",
        intensity: "medium",
        exercises: [
          { name: "Press banca", sets: 3, reps: "10-12", rest: 60, muscleGroups: ["pecho", "tríceps"], equipment: ["barra", "banco"] },
          { name: "Remo con barra", sets: 3, reps: "10-12", rest: 60, muscleGroups: ["espalda", "bíceps"], equipment: ["barra"] },
          { name: "Press hombro", sets: 3, reps: "10-12", rest: 45, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Curl bíceps", sets: 2, reps: "12-15", rest: 45, muscleGroups: ["bíceps"], equipment: ["mancuernas"] },
          { name: "Cinta caminadora", sets: 1, reps: "20 min", rest: 0, muscleGroups: ["cardio"], equipment: ["cinta"] },
        ]
      },
      {
        day: "Mar",
        name: "Tren inferior + Core",
        duration: 45,
        focus: "lower",
        intensity: "medium",
        exercises: [
          { name: "Sentadillas", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["cuádriceps", "glúteos"], equipment: ["barra"] },
          { name: "Peso muerto rumano", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["isquios", "glúteos"], equipment: ["barra"] },
          { name: "Prensa pierna", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["cuádriceps"], equipment: ["máquina"] },
          { name: "Extensiones pierna", sets: 2, reps: "12-15", rest: 45, muscleGroups: ["cuádriceps"], equipment: ["máquina"] },
          { name: "Plancha", sets: 3, reps: "30-45s", rest: 30, muscleGroups: ["core"], equipment: [] },
        ]
      },
      {
        day: "Mié",
        name: "Descanso activo",
        duration: 20,
        focus: "rest",
        intensity: "low",
        exercises: [
          { name: "Caminata ligera", sets: 1, reps: "20 min", rest: 0, muscleGroups: ["cardio"], equipment: [] },
          { name: "Estiramientos", sets: 1, reps: "10 min", rest: 0, muscleGroups: ["flexibilidad"], equipment: [] },
        ]
      },
      {
        day: "Jue",
        name: "Full body",
        duration: 45,
        focus: "full",
        intensity: "medium",
        exercises: [
          { name: "Sentadillas", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["cuádriceps", "glúteos"], equipment: ["barra"] },
          { name: "Press banca", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["pecho", "tríceps"], equipment: ["barra", "banco"] },
          { name: "Remo con barra", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["espalda", "bíceps"], equipment: ["barra"] },
          { name: "Press hombro", sets: 2, reps: "10-12", rest: 60, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Plancha", sets: 3, reps: "30-45s", rest: 30, muscleGroups: ["core"], equipment: [] },
        ]
      },
      {
        day: "Vie",
        name: "Cardio HIIT",
        duration: 30,
        focus: "cardio",
        intensity: "high",
        exercises: [
          { name: "Burpees", sets: 4, reps: "10", rest: 60, muscleGroups: ["cardio", "full"], equipment: [] },
          { name: "Mountain climbers", sets: 4, reps: "20", rest: 45, muscleGroups: ["cardio", "core"], equipment: [] },
          { name: "Jumping jacks", sets: 4, reps: "30", rest: 30, muscleGroups: ["cardio"], equipment: [] },
          { name: "High knees", sets: 4, reps: "30s", rest: 30, muscleGroups: ["cardio"], equipment: [] },
        ]
      },
      {
        day: "Sáb",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
      {
        day: "Dom",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
    ],
    progression: {
      week1: "Familiarización con movimientos, técnica correcta",
      week2: "Aumentar peso 2.5-5kg en ejercicios principales",
      week3: "Aumentar series o repeticiones",
      week4: "Aumentar intensidad en cardio HIIT"
    }
  },

  // ============================================================================
  // GANANCIA MUSCULAR - INTERMEDIO
  // ============================================================================
  {
    id: "muscle-intermediate-5-gym",
    goal: GoalType.MUSCLE_GAIN,
    level: ExperienceLevel.INTERMEDIATE,
    daysPerWeek: 5,
    sessionTime: 60,
    equipment: EquipmentType.GYM,
    weeklyStructure: [
      {
        day: "Lun",
        name: "Push (Pecho/Hombros/Tríceps)",
        duration: 60,
        focus: "upper",
        intensity: "high",
        exercises: [
          { name: "Press banca plano", sets: 4, reps: "6-8", rest: 120, muscleGroups: ["pecho", "tríceps"], equipment: ["barra", "banco"] },
          { name: "Press inclinado con mancuernas", sets: 3, reps: "8-10", rest: 90, muscleGroups: ["pecho", "tríceps"], equipment: ["mancuernas", "banco"] },
          { name: "Press hombro sentado", sets: 4, reps: "8-10", rest: 90, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Vuelos laterales", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Extensiones tríceps", sets: 3, reps: "10-12", rest: 60, muscleGroups: ["tríceps"], equipment: ["mancuernas"] },
        ]
      },
      {
        day: "Mar",
        name: "Pull (Espalda/Bíceps)",
        duration: 60,
        focus: "upper",
        intensity: "high",
        exercises: [
          { name: "Peso muerto", sets: 4, reps: "5-6", rest: 180, muscleGroups: ["espalda", "isquios", "glúteos"], equipment: ["barra"] },
          { name: "Dominadas o jalones", sets: 4, reps: "8-10", rest: 120, muscleGroups: ["espalda", "bíceps"], equipment: ["barra", "máquina"] },
          { name: "Remo con barra", sets: 4, reps: "8-10", rest: 90, muscleGroups: ["espalda", "bíceps"], equipment: ["barra"] },
          { name: "Curl bíceps", sets: 3, reps: "10-12", rest: 60, muscleGroups: ["bíceps"], equipment: ["mancuernas"] },
          { name: "Curl martillo", sets: 3, reps: "10-12", rest: 60, muscleGroups: ["bíceps"], equipment: ["mancuernas"] },
        ]
      },
      {
        day: "Mié",
        name: "Legs (Piernas/Glúteos)",
        duration: 60,
        focus: "lower",
        intensity: "high",
        exercises: [
          { name: "Sentadillas", sets: 4, reps: "6-8", rest: 180, muscleGroups: ["cuádriceps", "glúteos"], equipment: ["barra"] },
          { name: "Prensa pierna", sets: 4, reps: "10-12", rest: 120, muscleGroups: ["cuádriceps"], equipment: ["máquina"] },
          { name: "Peso muerto rumano", sets: 3, reps: "8-10", rest: 120, muscleGroups: ["isquios", "glúteos"], equipment: ["barra"] },
          { name: "Extensiones pierna", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["cuádriceps"], equipment: ["máquina"] },
          { name: "Curl femoral", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["isquios"], equipment: ["máquina"] },
        ]
      },
      {
        day: "Jue",
        name: "Push (Pecho/Hombros/Tríceps)",
        duration: 60,
        focus: "upper",
        intensity: "medium",
        exercises: [
          { name: "Press banca inclinado", sets: 4, reps: "8-10", rest: 90, muscleGroups: ["pecho", "tríceps"], equipment: ["barra", "banco"] },
          { name: "Aperturas con mancuernas", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["pecho"], equipment: ["mancuernas", "banco"] },
          { name: "Elevaciones laterales", sets: 4, reps: "12-15", rest: 45, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Elevaciones frontales", sets: 3, reps: "12-15", rest: 45, muscleGroups: ["hombros"], equipment: ["mancuernas"] },
          { name: "Fondos en paralelas", sets: 3, reps: "8-12", rest: 90, muscleGroups: ["tríceps", "pecho"], equipment: ["paralelas"] },
        ]
      },
      {
        day: "Vie",
        name: "Pull (Espalda/Bíceps)",
        duration: 60,
        focus: "upper",
        intensity: "medium",
        exercises: [
          { name: "Remo con mancuernas", sets: 4, reps: "10-12", rest: 90, muscleGroups: ["espalda", "bíceps"], equipment: ["mancuernas", "banco"] },
          { name: "Jalones al pecho", sets: 4, reps: "10-12", rest: 90, muscleGroups: ["espalda", "bíceps"], equipment: ["máquina"] },
          { name: "Remo T", sets: 3, reps: "10-12", rest: 90, muscleGroups: ["espalda"], equipment: ["barra"] },
          { name: "Curl concentrado", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["bíceps"], equipment: ["mancuernas"] },
        ]
      },
      {
        day: "Sáb",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
      {
        day: "Dom",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
    ],
    progression: {
      week1: "Volumen base, técnica perfecta",
      week2: "Aumentar peso 2.5-5kg en ejercicios principales",
      week3: "Aumentar una serie en ejercicios principales",
      week4: "Deload: reducir peso 10-15%, mantener volumen"
    }
  },

  // ============================================================================
  // SIN EQUIPAMIENTO - PRINCIPIANTE
  // ============================================================================
  {
    id: "fat-loss-beginner-4-none",
    goal: GoalType.FAT_LOSS,
    level: ExperienceLevel.BEGINNER,
    daysPerWeek: 4,
    sessionTime: 30,
    equipment: EquipmentType.NONE,
    weeklyStructure: [
      {
        day: "Lun",
        name: "Full body",
        duration: 30,
        focus: "full",
        intensity: "medium",
        exercises: [
          { name: "Sentadillas", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["cuádriceps", "glúteos"], equipment: [] },
          { name: "Flexiones", sets: 3, reps: "8-12", rest: 60, muscleGroups: ["pecho", "tríceps"], equipment: [] },
          { name: "Plancha", sets: 3, reps: "30-45s", rest: 45, muscleGroups: ["core"], equipment: [] },
          { name: "Burpees", sets: 3, reps: "8-10", rest: 90, muscleGroups: ["cardio", "full"], equipment: [] },
        ]
      },
      {
        day: "Mar",
        name: "Cardio HIIT",
        duration: 20,
        focus: "cardio",
        intensity: "high",
        exercises: [
          { name: "Jumping jacks", sets: 4, reps: "30", rest: 30, muscleGroups: ["cardio"], equipment: [] },
          { name: "Mountain climbers", sets: 4, reps: "20", rest: 30, muscleGroups: ["cardio", "core"], equipment: [] },
          { name: "High knees", sets: 4, reps: "30s", rest: 30, muscleGroups: ["cardio"], equipment: [] },
        ]
      },
      {
        day: "Mié",
        name: "Descanso activo",
        duration: 20,
        focus: "rest",
        intensity: "low",
        exercises: [
          { name: "Caminata", sets: 1, reps: "20 min", rest: 0, muscleGroups: ["cardio"], equipment: [] },
        ]
      },
      {
        day: "Jue",
        name: "Full body",
        duration: 30,
        focus: "full",
        intensity: "medium",
        exercises: [
          { name: "Sentadillas", sets: 3, reps: "12-15", rest: 60, muscleGroups: ["cuádriceps", "glúteos"], equipment: [] },
          { name: "Flexiones", sets: 3, reps: "8-12", rest: 60, muscleGroups: ["pecho", "tríceps"], equipment: [] },
          { name: "Plancha", sets: 3, reps: "30-45s", rest: 45, muscleGroups: ["core"], equipment: [] },
          { name: "Burpees", sets: 3, reps: "8-10", rest: 90, muscleGroups: ["cardio", "full"], equipment: [] },
        ]
      },
      {
        day: "Vie",
        name: "Cardio HIIT",
        duration: 20,
        focus: "cardio",
        intensity: "high",
        exercises: [
          { name: "Jumping jacks", sets: 4, reps: "30", rest: 30, muscleGroups: ["cardio"], equipment: [] },
          { name: "Mountain climbers", sets: 4, reps: "20", rest: 30, muscleGroups: ["cardio", "core"], equipment: [] },
          { name: "High knees", sets: 4, reps: "30s", rest: 30, muscleGroups: ["cardio"], equipment: [] },
        ]
      },
      {
        day: "Sáb",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
      {
        day: "Dom",
        name: "Descanso",
        duration: 0,
        focus: "rest",
        intensity: "low",
        exercises: []
      },
    ],
    progression: {
      week1: "Familiarización, técnica correcta",
      week2: "Aumentar repeticiones o tiempo",
      week3: "Aumentar series",
      week4: "Aumentar intensidad en ejercicios"
    }
  },
];

/**
 * Busca una plantilla que coincida con las preferencias del usuario
 */
export function findMatchingTrainingTemplate(
  goal: GoalType,
  daysPerWeek: number,
  sessionTime: number,
  equipment: EquipmentType,
  level: ExperienceLevel = ExperienceLevel.BEGINNER
): TrainingTemplate | null {
  return trainingTemplates.find(
    template =>
      template.goal === goal &&
      template.daysPerWeek === daysPerWeek &&
      template.sessionTime === sessionTime &&
      template.equipment === equipment &&
      template.level === level
  ) || null;
}
