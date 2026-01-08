# Motor de Generación de Planes Inteligente

## 📋 Tabla de Contenidos

1. [Arquitectura del Motor de Planes](#1-arquitectura-del-motor-de-planes)
2. [Estructura de la Biblioteca de Plantillas](#2-estructura-de-la-biblioteca-de-plantillas)
3. [Generación del Plan Semanal](#3-generación-del-plan-semanal)
4. [Sistema de "Regenerar con IA"](#4-sistema-de-regenerar-con-ia)
5. [Validaciones y Reglas de Coherencia](#5-validaciones-y-reglas-de-coherencia)
6. [Output Final del Motor](#6-output-final-del-motor)
7. [Buenas Prácticas y Consideraciones](#7-buenas-prácticas-y-consideraciones)

---

## 1️⃣ Arquitectura del Motor de Planes

### Flujo General del Sistema

```
INPUT (UserPreferences)
    ↓
[1] Búsqueda de Plantillas Base
    ├─ TrainingTemplate (entrenamiento)
    └─ NutritionTemplate (nutrición)
    ↓
[2] Motor Determinístico
    ├─ Si plantilla completa existe → Usar plantilla
    └─ Si plantilla incompleta → Completar con IA
    ↓
[3] Motor Generativo (IA)
    ├─ Generación desde cero (si no hay plantilla)
    └─ Personalización de plantilla base
    ↓
[4] Sistema de Validaciones
    ├─ Validación de nutrición
    ├─ Validación de entrenamiento
    └─ Validación de coherencia
    ↓
[5] Ajuste Automático (si hay errores)
    ↓
OUTPUT (WeeklyPlan)
```

### Separación de Responsabilidades

#### Motor Determinístico (Plantillas)
- **Ubicación**: `src/lib/plan-engine/templates/`
- **Responsabilidad**: Proporcionar planes base seguros y probados
- **Ventajas**: 
  - Rapidez (sin llamadas a API)
  - Consistencia garantizada
  - Sin costos de API
- **Uso**: Cuando existe una plantilla que coincide exactamente con las preferencias del usuario

#### Motor Generativo (IA)
- **Ubicación**: `src/lib/plan-engine/ai-service.ts`
- **Responsabilidad**: Personalización, adaptación y regeneración
- **Ventajas**:
  - Flexibilidad total
  - Adaptación a restricciones complejas
  - Personalización avanzada
- **Uso**: 
  - Cuando no hay plantilla exacta
  - Para regeneración con restricciones dinámicas
  - Para personalización avanzada

### Uso de `OPEN_AI_KEY`

La variable de entorno `VITE_OPEN_AI_KEY` se utiliza exclusivamente en:

1. **`ai-service.ts`**: 
   - Función `generatePlanWithAI()`: Generación inicial con IA
   - Función `regeneratePlanWithAI()`: Regeneración con restricciones

2. **Configuración**:
   ```typescript
   const OPENAI_API_KEY = import.meta.env.VITE_OPEN_AI_KEY;
   ```

3. **Seguridad**:
   - La clave se lee desde variables de entorno (nunca hardcodeada)
   - Se valida antes de hacer llamadas a la API
   - Los errores se manejan gracefully (fallback a plantillas)

---

## 2️⃣ Estructura de la Biblioteca de Plantillas

### Modelo de Datos

#### TrainingTemplate

```typescript
interface TrainingTemplate {
  id: string;                    // Identificador único
  goal: GoalType;                 // fat-loss | muscle | maintain | performance
  level: ExperienceLevel;         // beginner | intermediate | advanced
  daysPerWeek: number;            // 3-6
  sessionTime: number;            // minutos: 20, 30, 45, 60
  equipment: EquipmentType;       // none | basic | gym
  weeklyStructure: WorkoutDay[];  // 7 días (incluye descansos)
  progression: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
  };
}
```

#### NutritionTemplate

```typescript
interface NutritionTemplate {
  id: string;
  goal: GoalType;
  dietType: DietType;            // omnivore | vegetarian | pescatarian | keto
  mealsPerDay: number;           // 3-5
  dailyCalories: number;
  macroDistribution: {
    protein: number;             // porcentaje
    carbs: number;
    fat: number;
  };
  weeklyMenu: DailyNutrition[]; // 7 días
  excludedAllergens: string[];
}
```

### Ejemplo de Plantilla de Entrenamiento

```typescript
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
        {
          name: "Press banca",
          sets: 3,
          reps: "10-12",
          rest: 60,
          muscleGroups: ["pecho", "tríceps"],
          equipment: ["barra", "banco"]
        },
        // ... más ejercicios
      ]
    },
    // ... otros días
  ],
  progression: {
    week1: "Familiarización con movimientos",
    week2: "Aumentar peso 2.5-5kg",
    week3: "Aumentar series o repeticiones",
    week4: "Aumentar intensidad en cardio"
  }
}
```

### Ejemplo de Plantilla de Nutrición

```typescript
{
  id: "fat-loss-omnivore-4",
  goal: GoalType.FAT_LOSS,
  dietType: DietType.OMNIVORE,
  mealsPerDay: 4,
  dailyCalories: 1800,
  macroDistribution: {
    protein: 35,
    carbs: 35,
    fat: 30
  },
  weeklyMenu: [
    {
      day: "Lun",
      totalCalories: 1800,
      protein: 158,
      carbs: 158,
      fat: 60,
      meals: [
        {
          name: "Desayuno",
          calories: 450,
          protein: 25,
          carbs: 50,
          fat: 15,
          description: "Avena con plátano, nueces y proteína",
          ingredients: ["avena", "plátano", "nueces", "proteína"],
          recipe: {
            instructions: ["Cocinar avena...", "Añadir fruta..."],
            prepTime: 5,
            cookTime: 5
          },
          substitutions: ["Quinoa en lugar de avena"]
        },
        // ... más comidas
      ]
    },
    // ... otros días
  ]
}
```

---

## 3️⃣ Generación del Plan Semanal

### 🏋️ Entrenamiento

El plan de entrenamiento incluye:

#### Estructura Semanal
- **Días de entrenamiento**: Según preferencias (3-6 días/semana)
- **Días de descanso**: Mínimo 1-2 días/semana
- **Distribución**: Upper/Lower, Push/Pull/Legs, Full Body, o Cardio

#### Ejercicios por Día
Cada ejercicio contiene:
- **Nombre**: Ejercicio específico
- **Series**: Número de series (3-5 típicamente)
- **Repeticiones**: Rango o valor específico ("8-12", "AMRAP", "30s")
- **Descanso**: Segundos entre series (45-180s)
- **Grupos musculares**: Array de músculos trabajados
- **Equipamiento**: Array de equipos necesarios
- **Notas opcionales**: Técnica, variaciones, etc.

#### Progresión Semanal
- **Semana 1**: Familiarización, técnica
- **Semana 2**: Aumento de peso/carga
- **Semana 3**: Aumento de volumen (series/repeticiones)
- **Semana 4**: Deload o aumento de intensidad

#### Ejemplo de Día de Entrenamiento

```typescript
{
  day: "Lun",
  name: "Tren superior + Cardio",
  duration: 45,
  focus: "upper",
  intensity: "medium",
  exercises: [
    {
      name: "Press banca",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroups: ["pecho", "tríceps"],
      equipment: ["barra", "banco"],
      notes: "Mantener espalda apoyada, controlar descenso"
    },
    {
      name: "Remo con barra",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroups: ["espalda", "bíceps"],
      equipment: ["barra"]
    },
    // ... más ejercicios
  ]
}
```

### 🥗 Nutrición

El plan de nutrición incluye:

#### Objetivo Calórico Diario
- **Cálculo**: Basado en TMB (Mifflin-St Jeor) × Factor de actividad × Multiplicador de objetivo
- **Ajustes por objetivo**:
  - Pérdida de grasa: -20% (déficit)
  - Ganancia muscular: +15% (superávit)
  - Mantenimiento: 0%
  - Rendimiento: +10%

#### Distribución de Macros
- **Proteína**: 20-40% de calorías (mínimo 1.6 g/kg)
- **Carbohidratos**: 25-60% de calorías
- **Grasas**: 20-40% de calorías (mínimo 20%)

#### Menú Semanal
Cada día incluye:
- **Total calórico**: Suma de todas las comidas
- **Macros totales**: Proteína, carbos, grasas en gramos
- **Comidas**: Array de `Meal` con:
  - Nombre de la comida
  - Calorías y macros individuales
  - Descripción del plato
  - Lista de ingredientes
  - Receta (instrucciones, tiempo de prep/cocción)
  - Sustituciones sugeridas

#### Ejemplo de Día de Nutrición

```typescript
{
  day: "Lun",
  totalCalories: 1800,
  protein: 158,
  carbs: 158,
  fat: 60,
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
      substitutions: [
        "Quinoa en lugar de avena",
        "Almendras en lugar de nueces"
      ]
    },
    // ... más comidas (Almuerzo, Merienda, Cena)
  ]
}
```

---

## 4️⃣ Sistema de "Regenerar con IA"

### Lógica de Regeneración

El sistema permite regenerar un plan existente aplicando **restricciones dinámicas** sin perder la estructura base.

#### Flujo de Regeneración

```
Plan Existente + Restricciones
    ↓
[1] Construcción de Prompt Dinámico
    ├─ Análisis de restricciones
    ├─ Identificación de cambios necesarios
    └─ Preservación de estructura base
    ↓
[2] Llamada a IA con Prompt Específico
    ↓
[3] Fusión de Resultados
    ├─ Mantener: Objetivo, días, tipo de dieta
    └─ Ajustar: Ejercicios, comidas, macros
    ↓
[4] Validación del Plan Regenerado
    ↓
Plan Regenerado (versión +1)
```

### Construcción del Prompt Dinámico

El prompt se construye incluyendo:

1. **Plan actual**: Objetivo, días, tipo de dieta, alergias
2. **Restricciones nuevas**: Todas las especificadas por el usuario
3. **Instrucciones**: Qué preservar y qué ajustar

#### Ejemplo de Prompt Generado

```
Eres un experto en fitness y nutrición. 

Necesitas REGENERAR y AJUSTAR un plan existente aplicando las siguientes restricciones:

## PLAN ACTUAL
- Objetivo: pérdida de grasa
- Días de entrenamiento: 4
- Tiempo por sesión: 45 minutos
- Tipo de dieta: omnívoro
- Alergias: ninguna

## RESTRICCIONES ADICIONALES A APLICAR
- EXCLUIR alimentos: lácteos, gluten
- Calorías máximas diarias: 1600 kcal
- Proteína mínima: 2.0 g/kg de peso
- Tiempo máximo por sesión: 30 minutos
- Métodos de cocción preferidos: sin horno, rápido
- Notas adicionales: Prefiero entrenamientos más cortos y comidas que no requieran horno

## INSTRUCCIONES
1. MANTÉN la estructura general del plan
2. AJUSTA solo lo necesario para cumplir las restricciones
3. PRESERVA la coherencia nutricional y de entrenamiento
```

### Qué se Regenera vs. Qué se Preserva

#### Se Preserva:
- ✅ Objetivo principal (pérdida de grasa, ganancia muscular, etc.)
- ✅ Número de días de entrenamiento
- ✅ Tipo de dieta base (omnívoro, vegetariano, etc.)
- ✅ Estructura general (días de descanso, distribución semanal)

#### Se Regenera:
- 🔄 Ejercicios específicos (si hay restricciones de tiempo/equipamiento)
- 🔄 Comidas y recetas (si hay exclusiones alimentarias)
- 🔄 Distribución de macros (si hay cambios en proteína/carbos)
- 🔄 Duración de sesiones (si se especifica tiempo máximo)
- 🔄 Métodos de cocción (si se especifican preferencias)

### Ejemplo de Uso

```typescript
import { regeneratePlan } from "@/lib/plan-engine";

const constraints: RegenerationConstraints = {
  excludeFoods: ["lácteos", "gluten"],
  maxSessionTime: 30,
  minProtein: 2.0,
  cookingMethods: ["sin horno", "rápido"],
  notes: "Entrenamientos más cortos, sin lácteos ni gluten"
};

const regeneratedPlan = await regeneratePlan(existingPlan, constraints);
```

---

## 5️⃣ Validaciones y Reglas de Coherencia (CRÍTICO)

### Sistema de Validación

El sistema valida **automáticamente** cada plan generado antes de entregarlo al usuario.

### Reglas de Nutrición

#### Proteína
- **Mínimo**: 1.6 g/kg de peso corporal (basado en evidencia científica)
- **Máximo**: 2.5 g/kg (sin beneficios adicionales)
- **Validación**: `proteinPerKg = totalProtein / userWeight`

#### Calorías
- **Mínimo absoluto**: 1200 kcal/día (nunca menos, peligroso para la salud)
- **Máximo razonable**: 4000 kcal/día
- **Validación por objetivo**:
  - Pérdida de grasa: 1200-2500 kcal
  - Ganancia muscular: 2000-4000 kcal
  - Mantenimiento: 1500-3000 kcal

#### Distribución de Macros
- **Proteína**: 20-40% de calorías totales
- **Carbohidratos**: 25-60% de calorías totales
- **Grasas**: 20-40% de calorías totales (mínimo 20% para salud hormonal)

#### Consistencia Semanal
- **Variación máxima**: ±200 kcal entre días
- **Validación**: Promedio semanal debe estar cerca del objetivo diario

### Reglas de Entrenamiento

#### Volumen por Grupo Muscular
- **Mínimo**: 8 series/semana (para mantener masa muscular)
- **Máximo**: 25 series/semana (para evitar sobreentrenamiento)
- **Óptimo**: 12-20 series/semana (depende del nivel)

#### Número de Sesiones
- **Mínimo**: 2 días/semana (para ver resultados)
- **Máximo**: 6 días/semana (para evitar sobreentrenamiento)
- **Validación**: Debe coincidir con preferencias del usuario

#### Días de Descanso
- **Mínimo**: 1 día/semana (recuperación esencial)
- **Máximo**: 3 días/semana (para mantener progreso)

#### Duración de Sesiones
- **Máximo**: 120 minutos (después de esto, rendimiento disminuye)
- **Coherencia**: Tiempo estimado vs. tiempo declarado (±15 min)

### Qué Ocurre si una Validación Falla

#### Errores Críticos (severity: "error")
1. **Ajuste automático**: El sistema intenta corregir el error
   - Ejemplo: Si calorías < 1200 → Aumentar a 1200
   - Ejemplo: Si proteína < 1.6 g/kg → Aumentar proteína
2. **Re-validación**: Después del ajuste, se valida nuevamente
3. **Si persiste el error**: Se marca el plan como inválido y se requiere regeneración

#### Advertencias (severity: "warning")
1. **Se registran**: Se añaden a `plan.validation.warnings`
2. **No bloquean**: El plan se entrega pero con advertencias
3. **Información al usuario**: Se muestran en el frontend

#### Ejemplo de Validación

```typescript
const checks = validatePlan(plan, defaultValidationRules, userWeight);

// checks = [
//   {
//     name: "proteina_minima",
//     passed: false,
//     message: "La proteína (1.2 g/kg) está por debajo del mínimo (1.6 g/kg)",
//     severity: "error"
//   },
//   {
//     name: "volumen_max_pecho",
//     passed: false,
//     message: "El pecho tiene 28 series/semana. Máximo recomendado: 25 series",
//     severity: "warning"
//   }
// ]

if (!isPlanValid(checks)) {
  plan = autoFixPlan(plan, checks); // Ajusta automáticamente
}
```

---

## 6️⃣ Output Final del Motor

### Formato JSON Estructurado

El plan final se entrega como un objeto `WeeklyPlan` con la siguiente estructura:

```typescript
interface WeeklyPlan {
  // Identificación
  id: string;                    // "plan-userId-weekNumber-timestamp"
  userId: string;
  weekNumber: number;
  createdAt: string;              // ISO date
  version: number;                // Incrementa con cada regeneración

  // Metadata de entrada
  preferences: UserPreferences;
  constraints?: RegenerationConstraints;

  // Contenido: Entrenamiento
  training: {
    weeklyStructure: WorkoutDay[];  // 7 días
    totalVolume: {                   // Series por grupo muscular
      [muscleGroup: string]: number;
    };
    progression: string;             // Descripción de progresión semanal
  };

  // Contenido: Nutrición
  nutrition: {
    dailyCalories: number;
    macroTargets: {
      protein: number;  // gramos
      carbs: number;
      fat: number;
    };
    weeklyMenu: DailyNutrition[];  // 7 días
    mealPrepTips?: string[];
  };

  // Validación
  validation: {
    passed: boolean;
    warnings: string[];
    errors: string[];
    checks: ValidationCheck[];
  };

  // Metadata técnica
  metadata: {
    generatedBy: "template" | "ai" | "hybrid";
    aiModel?: string;              // "gpt-4.1-mini"
    templateIds?: string[];         // IDs de plantillas usadas
    generationTime?: number;        // ms
  };
}
```

### Campos Obligatorios

- ✅ `id`, `userId`, `weekNumber`, `createdAt`
- ✅ `preferences`
- ✅ `training.weeklyStructure` (al menos días de entrenamiento)
- ✅ `nutrition.dailyCalories`, `nutrition.macroTargets`
- ✅ `nutrition.weeklyMenu` (7 días completos)
- ✅ `validation.passed`, `validation.checks`

### Flags de Validación

- `validation.passed`: `true` si no hay errores críticos
- `validation.errors`: Array de mensajes de errores
- `validation.warnings`: Array de mensajes de advertencias
- `validation.checks`: Array completo de validaciones realizadas

### Metadata

- `metadata.generatedBy`: Indica el método de generación
- `metadata.templateIds`: Plantillas usadas como base
- `metadata.generationTime`: Tiempo de generación en milisegundos
- `metadata.aiModel`: Modelo de IA usado (si aplica)

### Ejemplo de Output

```json
{
  "id": "plan-abc123-1-1704123456789",
  "userId": "abc123",
  "weekNumber": 1,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "version": 1,
  "preferences": {
    "goal": "fat-loss",
    "daysPerWeek": 4,
    "sessionTime": 45,
    "equipment": "gym",
    "dietType": "omnivore",
    "allergies": [],
    "mealsPerDay": 4,
    "style": "simple"
  },
  "training": {
    "weeklyStructure": [
      {
        "day": "Lun",
        "name": "Tren superior + Cardio",
        "duration": 45,
        "focus": "upper",
        "intensity": "medium",
        "exercises": [...]
      },
      // ... más días
    ],
    "totalVolume": {
      "pecho": 12,
      "espalda": 12,
      "piernas": 16,
      // ...
    },
    "progression": "Semana 1: Familiarización..."
  },
  "nutrition": {
    "dailyCalories": 1800,
    "macroTargets": {
      "protein": 158,
      "carbs": 158,
      "fat": 60
    },
    "weeklyMenu": [
      {
        "day": "Lun",
        "totalCalories": 1800,
        "protein": 158,
        "carbs": 158,
        "fat": 60,
        "meals": [...]
      },
      // ... más días
    ],
    "mealPrepTips": [
      "Prepara el arroz y las verduras el domingo",
      "Cocina el pollo en batch para la semana"
    ]
  },
  "validation": {
    "passed": true,
    "warnings": [],
    "errors": [],
    "checks": [
      {
        "name": "calorias_rango",
        "passed": true,
        "message": "Calorías diarias (1800 kcal) dentro del rango seguro.",
        "severity": "info"
      },
      // ... más checks
    ]
  },
  "metadata": {
    "generatedBy": "hybrid",
    "templateIds": ["fat-loss-beginner-4-gym", "fat-loss-omnivore-4"],
    "generationTime": 1250
  }
}
```

---

## 7️⃣ Buenas Prácticas y Consideraciones

### Seguridad y Uso de la API de OpenAI

#### 1. Manejo de Errores
- ✅ **Try-catch**: Todas las llamadas a IA están envueltas en try-catch
- ✅ **Fallback**: Si IA falla, se usa plantilla determinística
- ✅ **Validación de respuesta**: Se valida que la respuesta sea JSON válido

#### 2. Rate Limiting
- ⚠️ **Considerar límites**: OpenAI tiene límites de requests/minuto
- 💡 **Solución**: Implementar caché de resultados similares
- 💡 **Solución**: Usar `gpt-4.1-mini` para reducir costos y aumentar velocidad

#### 3. Costos
- 💰 **Optimización**: Usar plantillas cuando sea posible (sin costo)
- 💰 **Modelos**: `gpt-4.1-mini` es más económico que `gpt-4`
- 💰 **Tokens**: Limitar `max_tokens` a lo necesario (4000 es suficiente)

#### 4. Seguridad de Datos
- 🔒 **No enviar datos sensibles**: No incluir información médica privada en prompts
- 🔒 **Validación de input**: Validar todas las restricciones del usuario antes de enviar a IA

### Caching de Resultados

#### Estrategia de Caché

1. **Caché por preferencias exactas**:
   ```typescript
   const cacheKey = `${goal}-${daysPerWeek}-${sessionTime}-${equipment}-${dietType}`;
   ```

2. **Caché de regeneraciones similares**:
   - Si las restricciones son muy similares, reutilizar resultado

3. **TTL (Time To Live)**:
   - Caché válido por 24 horas
   - Invalidar si hay cambios en plantillas

#### Implementación Sugerida

```typescript
// Usar React Query o similar para caché automático
const { data: plan } = useQuery({
  queryKey: ['plan', preferences],
  queryFn: () => generateWeeklyPlan(userId, preferences),
  staleTime: 24 * 60 * 60 * 1000, // 24 horas
});
```

### Versionado de Plantillas

#### Estrategia

1. **IDs semánticos**: `fat-loss-beginner-4-gym-v1`
2. **Changelog**: Documentar cambios en plantillas
3. **Migración**: Si se actualiza una plantilla, versionar planes existentes

#### Ejemplo

```typescript
interface TemplateVersion {
  id: string;
  version: number;
  createdAt: string;
  changes: string[];
}

const templateVersions: TemplateVersion[] = [
  {
    id: "fat-loss-beginner-4-gym",
    version: 1,
    createdAt: "2024-01-01",
    changes: ["Versión inicial"]
  },
  {
    id: "fat-loss-beginner-4-gym",
    version: 2,
    createdAt: "2024-02-01",
    changes: ["Ajustado volumen de pecho", "Añadido ejercicio de core"]
  }
];
```

### Auditoría de Planes Generados

#### Qué Auditar

1. **Calidad de planes**:
   - Porcentaje de planes que pasan validación
   - Errores más comunes
   - Tiempo promedio de generación

2. **Uso de IA vs. Plantillas**:
   - Frecuencia de uso de cada método
   - Costos asociados

3. **Feedback de usuarios**:
   - Planes regenerados (indica insatisfacción)
   - Restricciones más comunes

#### Implementación

```typescript
interface PlanAudit {
  planId: string;
  generatedBy: "template" | "ai" | "hybrid";
  validationPassed: boolean;
  generationTime: number;
  regenerationCount: number;
  createdAt: string;
}

// Guardar en Supabase o base de datos
await supabase.from('plan_audits').insert(audit);
```

### Escalabilidad Futura

#### Nuevos Objetivos

1. **Añadir plantilla**: Crear nueva en `training-templates.ts` y `nutrition-templates.ts`
2. **Actualizar tipos**: Añadir nuevo `GoalType` si es necesario
3. **Ajustar validaciones**: Actualizar reglas si el nuevo objetivo requiere cambios

#### IA Externa

Para usar otros proveedores de IA (Claude, Gemini, etc.):

1. **Abstraer servicio**: Crear interfaz común
   ```typescript
   interface AIService {
     generatePlan(prompt: string): Promise<AIResponse>;
     regeneratePlan(prompt: string): Promise<AIResponse>;
   }
   ```

2. **Implementar adaptadores**:
   - `OpenAIService` (actual)
   - `ClaudeService` (futuro)
   - `GeminiService` (futuro)

3. **Factory pattern**: Seleccionar servicio según configuración

#### Nuevas Funcionalidades

- **Planificación multi-semana**: Extender a 4-12 semanas
- **Ajuste dinámico**: Ajustar plan según progreso del usuario
- **Integración con wearables**: Usar datos de actividad real
- **Recomendaciones de suplementos**: Añadir sección de suplementación

---

## 📝 Resumen de Archivos Creados

```
src/lib/plan-engine/
├── index.ts                    # Exportaciones principales
├── types.ts                    # Tipos TypeScript
├── plan-generator.ts           # Motor principal
├── ai-service.ts               # Servicio de IA (OpenAI)
├── validations.ts              # Sistema de validaciones
└── templates/
    ├── training-templates.ts   # Plantillas de entrenamiento
    └── nutrition-templates.ts  # Plantillas de nutrición
```

---

## 🚀 Uso Rápido

```typescript
import { generateWeeklyPlan, regeneratePlan } from "@/lib/plan-engine";

// Generar plan inicial
const plan = await generateWeeklyPlan(
  userId,
  {
    goal: GoalType.FAT_LOSS,
    daysPerWeek: 4,
    sessionTime: 45,
    equipment: EquipmentType.GYM,
    dietType: DietType.OMNIVORE,
    allergies: [],
    mealsPerDay: 4,
    style: PlanStyle.SIMPLE
  }
);

// Regenerar con restricciones
const regenerated = await regeneratePlan(plan, {
  excludeFoods: ["lácteos"],
  maxSessionTime: 30,
  minProtein: 2.0
});
```

---

**Fin del Documento**
