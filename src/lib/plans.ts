/**
 * ============================================
 * GESTIÓN DE PLANES SEMANALES
 * ============================================
 * 
 * Funciones para guardar, obtener y gestionar planes semanales
 * de entrenamiento y nutrición en Supabase.
 */

import { supabase } from './supabase';
import type { WeeklyPlan, DailyNutrition, Meal } from './plan-engine/types';

/**
 * Guarda un plan semanal en Supabase
 * 
 * @param plan - Plan semanal completo a guardar
 * @returns Promise<{ data: WeeklyPlan | null, error: Error | null }>
 * 
 * @example
 * ```typescript
 * const plan = await generateWeeklyPlan(userId, preferences);
 * const { data, error } = await savePlan(plan);
 * if (error) {
 *   console.error('Error al guardar plan:', error);
 * }
 * ```
 */
export async function savePlan(plan: WeeklyPlan): Promise<{ data: WeeklyPlan | null; error: Error | null }> {
  try {
    console.log('💾 [savePlan] Guardando plan en Supabase...', {
      id: plan.id,
      userId: plan.userId,
      weekNumber: plan.weekNumber,
      version: plan.version,
    });

    // Verificar estructura del training antes de guardar
    console.log('💪 [savePlan] Estructura del training:', {
      hasTraining: !!plan.training,
      hasWeeklyStructure: !!plan.training?.weeklyStructure,
      weeklyStructureLength: plan.training?.weeklyStructure?.length || 0,
      weeklyStructure: plan.training?.weeklyStructure?.map(d => ({
        day: d.day,
        name: d.name,
        exercisesCount: d.exercises?.length || 0,
        focus: d.focus
      })) || [],
      hasTotalVolume: !!plan.training?.totalVolume,
      hasProgression: !!plan.training?.progression,
      trainingObject: plan.training
    });

    // Verificar estructura de la nutrición antes de guardar
    console.log('🥗 [savePlan] Estructura de la nutrición:', {
      hasNutrition: !!plan.nutrition,
      hasWeeklyMenu: !!plan.nutrition?.weeklyMenu,
      weeklyMenuLength: plan.nutrition?.weeklyMenu?.length || 0,
      weeklyMenuDays: plan.nutrition?.weeklyMenu?.map(d => ({
        day: d.day,
        totalCalories: d.totalCalories,
        mealsCount: d.meals?.length || 0
      })) || [],
      dailyCalories: plan.nutrition?.dailyCalories,
      macroTargets: plan.nutrition?.macroTargets,
      hasMealPrepTips: !!plan.nutrition?.mealPrepTips,
      nutritionObject: plan.nutrition
    });

    // Validar que training tenga la estructura correcta
    if (!plan.training || !plan.training.weeklyStructure || plan.training.weeklyStructure.length === 0) {
      console.warn('⚠️ [savePlan] El plan no tiene entrenos válidos:', {
        hasTraining: !!plan.training,
        weeklyStructureLength: plan.training?.weeklyStructure?.length || 0
      });
    }

    const { data, error } = await supabase
      .from('sass_weekly_plans')
      .insert({
        id: plan.id,
        user_id: plan.userId,
        week_number: plan.weekNumber,
        created_at: plan.createdAt,
        version: plan.version,
        preferences: plan.preferences,
        constraints: plan.constraints || null,
        training: plan.training,
        nutrition: plan.nutrition,
        validation: plan.validation,
        metadata: plan.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [savePlan] Error al guardar plan:', error);
      console.error('❌ [savePlan] Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { data: null, error: new Error(`Error al guardar plan: ${error.message}`) };
    }

    console.log('✅ [savePlan] Plan guardado exitosamente:', {
      id: data.id,
      version: data.version,
    });

    // Verificar qué se guardó realmente
    console.log('📊 [savePlan] Datos guardados en Supabase:', {
      hasTraining: !!data.training,
      trainingType: typeof data.training,
      trainingKeys: data.training ? Object.keys(data.training) : [],
      weeklyStructureLength: data.training?.weeklyStructure?.length || 0,
      hasNutrition: !!data.nutrition,
      nutritionType: typeof data.nutrition,
      nutritionKeys: data.nutrition ? Object.keys(data.nutrition) : [],
      nutritionWeeklyMenuLength: data.nutrition?.weeklyMenu?.length || 0,
      nutritionWeeklyMenuDays: data.nutrition?.weeklyMenu?.map(d => ({
        day: d.day,
        totalCalories: d.totalCalories,
        mealsCount: d.meals?.length || 0
      })) || []
    });

    // Convertir de vuelta a WeeklyPlan
    const savedPlan: WeeklyPlan = {
      id: data.id,
      userId: data.user_id,
      weekNumber: data.week_number,
      createdAt: data.created_at,
      version: data.version,
      preferences: data.preferences,
      constraints: data.constraints,
      training: data.training,
      nutrition: data.nutrition,
      validation: data.validation,
      metadata: data.metadata,
    };

    return { data: savedPlan, error: null };
  } catch (error) {
    console.error('❌ [savePlan] Error inesperado:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido al guardar plan'),
    };
  }
}

/**
 * Obtiene el plan más reciente de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Promise<{ data: WeeklyPlan | null, error: Error | null }>
 * 
 * @example
 * ```typescript
 * const { data: plan, error } = await getLatestPlan(userId);
 * if (plan) {
 *   console.log('Plan encontrado:', plan);
 * }
 * ```
 */
export async function getLatestPlan(userId: string): Promise<{ data: WeeklyPlan | null; error: Error | null }> {
  try {
    console.log('🔍 [getLatestPlan] Buscando plan más reciente...', { userId });

    const { data, error } = await supabase
      .from('sass_weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [getLatestPlan] Error al obtener plan:', error);
      return { data: null, error: new Error(`Error al obtener plan: ${error.message}`) };
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ [getLatestPlan] No se encontró ningún plan para el usuario');
      return { data: null, error: null };
    }

    // Tomar el primer resultado (ya está ordenado por created_at DESC)
    const planData = data[0];

    // Verificar qué datos vienen de Supabase
    console.log('📥 [getLatestPlan] Datos recibidos de Supabase:', {
      hasTraining: !!planData.training,
      trainingType: typeof planData.training,
      trainingKeys: planData.training ? Object.keys(planData.training) : [],
      weeklyStructureLength: planData.training?.weeklyStructure?.length || 0,
      hasNutrition: !!planData.nutrition,
      nutritionType: typeof planData.nutrition,
      nutritionKeys: planData.nutrition ? Object.keys(planData.nutrition) : [],
      nutritionWeeklyMenuLength: planData.nutrition?.weeklyMenu?.length || 0,
      nutritionData: planData.nutrition
    });

    // Asegurar que nutrition tenga la estructura correcta
    let nutrition = planData.nutrition;
    if (nutrition) {
      // Si nutrition es un string (JSONB sin parsear), parsearlo
      if (typeof nutrition === 'string') {
        try {
          nutrition = JSON.parse(nutrition);
        } catch (e) {
          console.warn('⚠️ [getLatestPlan] Error al parsear nutrition como JSON:', e);
        }
      }
      
      // Validar y normalizar estructura mínima
      if (!nutrition.weeklyMenu || !Array.isArray(nutrition.weeklyMenu)) {
        console.warn('⚠️ [getLatestPlan] nutrition.weeklyMenu no es un array válido:', {
          hasWeeklyMenu: !!nutrition.weeklyMenu,
          weeklyMenuType: typeof nutrition.weeklyMenu,
          nutritionKeys: Object.keys(nutrition)
        });
        // Asegurar que weeklyMenu sea un array
        nutrition = {
          ...nutrition,
          weeklyMenu: Array.isArray(nutrition.weeklyMenu) ? nutrition.weeklyMenu : []
        };
      } else {
        // Normalizar días y estructura de comidas si es necesario
        nutrition.weeklyMenu = nutrition.weeklyMenu.map((day: any) => {
          // Si el día está en inglés, normalizarlo
          const dayMap: { [key: string]: string } = {
            "Monday": "Lun", "Tuesday": "Mar", "Wednesday": "Mié",
            "Thursday": "Jue", "Friday": "Vie", "Saturday": "Sáb", "Sunday": "Dom"
          };
          
          if (dayMap[day.day]) {
            day.day = dayMap[day.day];
          }
          
          // Si las comidas tienen estructura diferente (meal/items), normalizarlas
          if (day.meals && Array.isArray(day.meals)) {
            const needsNormalization = day.meals.some((m: any) => m.meal && m.items);
            
            if (needsNormalization) {
              const mealMap: { [key: string]: string } = {
                "Breakfast": "Desayuno", "Lunch": "Almuerzo",
                "Dinner": "Cena", "Snack": "Merienda", "Snacks": "Merienda"
              };
              
              day.meals = day.meals.map((meal: any) => {
                if (meal.meal && meal.items) {
                  const mealName = mealMap[meal.meal] || meal.meal;
                  const items = Array.isArray(meal.items) ? meal.items : [String(meal.items)];
                  const description = items.join(", ");
                  
                  // Calcular valores aproximados si no existen
                  const caloriesPerMeal = day.totalCalories ? Math.round(day.totalCalories / day.meals.length) : 0;
                  const proteinPerMeal = day.protein ? Math.round(day.protein / day.meals.length) : 0;
                  const carbsPerMeal = day.carbs ? Math.round(day.carbs / day.meals.length) : 0;
                  const fatPerMeal = day.fat ? Math.round(day.fat / day.meals.length) : 0;
                  
                  return {
                    name: mealName,
                    calories: meal.calories || caloriesPerMeal,
                    protein: meal.protein || proteinPerMeal,
                    carbs: meal.carbs || carbsPerMeal,
                    fat: meal.fat || fatPerMeal,
                    description: meal.description || description,
                    ingredients: meal.ingredients || items
                  };
                }
                return meal;
              });
            }
          }
          
          return day;
        });
      }
    }

    // Convertir a WeeklyPlan
    const plan: WeeklyPlan = {
      id: planData.id,
      userId: planData.user_id,
      weekNumber: planData.week_number,
      createdAt: planData.created_at,
      version: planData.version,
      preferences: planData.preferences,
      constraints: planData.constraints,
      training: planData.training,
      nutrition: nutrition,
      validation: planData.validation,
      metadata: planData.metadata,
    };

    console.log('✅ [getLatestPlan] Plan encontrado:', {
      id: plan.id,
      version: plan.version,
      weekNumber: plan.weekNumber,
      hasTraining: !!plan.training,
      trainingDays: plan.training?.weeklyStructure?.length || 0,
      trainingStructure: plan.training?.weeklyStructure?.map(d => ({
        day: d.day,
        name: d.name,
        exercisesCount: d.exercises?.length || 0
      })) || [],
      hasNutrition: !!plan.nutrition,
      nutritionType: typeof plan.nutrition,
      nutritionKeys: plan.nutrition ? Object.keys(plan.nutrition) : [],
      nutritionDays: plan.nutrition?.weeklyMenu?.length || 0,
      nutritionStructure: plan.nutrition?.weeklyMenu?.map(d => ({
        day: d.day,
        totalCalories: d.totalCalories,
        mealsCount: d.meals?.length || 0,
        hasMeals: !!d.meals,
        mealsType: typeof d.meals
      })) || [],
      dailyCalories: plan.nutrition?.dailyCalories,
      macroTargets: plan.nutrition?.macroTargets,
      fullNutrition: plan.nutrition
    });

    return { data: plan, error: null };
  } catch (error) {
    console.error('❌ [getLatestPlan] Error inesperado:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido al obtener plan'),
    };
  }
}

/**
 * Obtiene todos los planes de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Promise<{ data: WeeklyPlan[] | null, error: Error | null }>
 */
export async function getUserPlans(userId: string): Promise<{ data: WeeklyPlan[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('sass_weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [getUserPlans] Error al obtener planes:', error);
      return { data: null, error: new Error(`Error al obtener planes: ${error.message}`) };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Convertir a WeeklyPlan[]
    const plans: WeeklyPlan[] = data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      weekNumber: item.week_number,
      createdAt: item.created_at,
      version: item.version,
      preferences: item.preferences,
      constraints: item.constraints,
      training: item.training,
      nutrition: item.nutrition,
      validation: item.validation,
      metadata: item.metadata,
    }));

    return { data: plans, error: null };
  } catch (error) {
    console.error('❌ [getUserPlans] Error inesperado:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido al obtener planes'),
    };
  }
}

/**
 * Actualiza un plan existente
 * 
 * @param plan - Plan actualizado
 * @returns Promise<{ data: WeeklyPlan | null, error: Error | null }>
 */
export async function updatePlan(plan: WeeklyPlan): Promise<{ data: WeeklyPlan | null; error: Error | null }> {
  try {
    console.log('🔄 [updatePlan] Actualizando plan...', {
      id: plan.id,
      version: plan.version,
    });

    const { data, error } = await supabase
      .from('sass_weekly_plans')
      .update({
        version: plan.version,
        preferences: plan.preferences,
        constraints: plan.constraints || null,
        training: plan.training,
        nutrition: plan.nutrition,
        validation: plan.validation,
        metadata: plan.metadata,
      })
      .eq('id', plan.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [updatePlan] Error al actualizar plan:', error);
      return { data: null, error: new Error(`Error al actualizar plan: ${error.message}`) };
    }

    // Convertir de vuelta a WeeklyPlan
    const updatedPlan: WeeklyPlan = {
      id: data.id,
      userId: data.user_id,
      weekNumber: data.week_number,
      createdAt: data.created_at,
      version: data.version,
      preferences: data.preferences,
      constraints: data.constraints,
      training: data.training,
      nutrition: data.nutrition,
      validation: data.validation,
      metadata: data.metadata,
    };

    console.log('✅ [updatePlan] Plan actualizado exitosamente');
    return { data: updatedPlan, error: null };
  } catch (error) {
    console.error('❌ [updatePlan] Error inesperado:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido al actualizar plan'),
    };
  }
}
