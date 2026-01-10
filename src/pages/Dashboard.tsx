import MobileFrame from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { syncSubscriptionWithStripe } from "@/lib/membership";
import { regeneratePlan } from "@/lib/plan-engine";
import type { RegenerationConstraints, WeeklyPlan } from "@/lib/plan-engine/types";
import { getLatestPlan, savePlan } from "@/lib/plans";
import { getRecommendedSupplements, type Supplement } from "@/lib/supplements";
import { ChevronRight, Clock, Dumbbell, Lock, LogOut, Pill, Sparkles, TrendingUp, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type TabType = "training" | "nutrition" | "progress" | "supplements";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { 
    hasActiveMembership: isPremium, 
    membershipStatus, 
    subscription,
    refresh: refreshMembership,
    loading: membershipLoading 
  } = useMembership();
  const [activeTab, setActiveTab] = useState<TabType>("training");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Cargar el plan más reciente del usuario
  useEffect(() => {
    const loadPlan = async () => {
      if (!user?.id) {
        setPlanLoading(false);
        return;
      }

      try {
        setPlanLoading(true);
        const { data: plan, error } = await getLatestPlan(user.id);
        
        if (error) {
          console.error("Error al cargar plan:", error);
          toast.error("Error al cargar tu plan", {
            description: "Intenta recargar la página",
          });
        } else if (plan) {
          setCurrentPlan(plan);
        } else {
          // No hay plan aún
          console.log("No se encontró plan para el usuario");
        }
      } catch (error) {
        console.error("Error inesperado al cargar plan:", error);
        toast.error("Error al cargar tu plan");
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlan();
  }, [user?.id]);

  // Verificar si hay session_id en la URL (viene de Stripe después del pago)
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Pago exitoso - esperar a que el webhook procese y luego refrescar
      handlePaymentSuccess(sessionId);
      // Limpiar el parámetro de la URL
      setSearchParams({});
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      // Esperar un momento para que el webhook procese el evento
      // En producción, podrías hacer polling o usar Supabase Realtime
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refrescar el estado de membresía
      await refreshMembership();

      // Si ahora tiene membresía activa, mostrar éxito
      if (isPremium || membershipStatus?.hasActiveMembership) {
        toast.success("¡Pago exitoso! Ya eres Premium", {
          description: "Disfruta de todas las funciones premium",
          duration: 5000,
        });
      } else {
        // Si aún no tiene membresía, intentar sincronizar manualmente
        if (subscription?.stripe_subscription_id) {
          const synced = await syncSubscriptionWithStripe(subscription.stripe_subscription_id);
          if (synced) {
            await refreshMembership();
            toast.success("¡Pago exitoso! Ya eres Premium", {
              description: "Disfruta de todas las funciones premium",
              duration: 5000,
            });
          } else {
            toast.info("Pago procesado", {
              description: "Tu membresía se activará en unos momentos. Si el problema persiste, contacta al soporte.",
              duration: 5000,
            });
          }
        } else {
          toast.info("Pago procesado", {
            description: "Tu membresía se activará en unos momentos. Si el problema persiste, contacta al soporte.",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Error al verificar pago:", error);
      toast.error("Error al verificar el pago", {
        description: "Por favor, contacta al soporte si el problema persiste",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    if (isRegenerating) return;

    if (!user?.id) {
      toast.error("No se pudo identificar el usuario");
      return;
    }

    try {
      setIsRegenerating(true);
      
      // Usar el plan actual cargado desde Supabase
      if (!currentPlan) {
        toast.error("No hay plan para regenerar", {
          description: "Primero necesitas tener un plan activo",
        });
        return;
      }

      console.log("🔄 Iniciando regeneración de plan...", { userId: user.id });
      
      // Restricciones mínimas para regenerar (puedes personalizar esto)
      const constraints: RegenerationConstraints = {
        notes: "Regenerar plan con variaciones frescas manteniendo el mismo objetivo",
      };

      console.log("📤 Llamando a regeneratePlan con OpenAI...");
      const regeneratedPlan = await regeneratePlan(currentPlan, constraints);
      
      // Actualizar el plan actual después de regenerar
      setCurrentPlan(regeneratedPlan);
      
      console.log("✅ Plan regenerado exitosamente:", {
        id: regeneratedPlan.id,
        version: regeneratedPlan.version,
        generatedBy: regeneratedPlan.metadata.generatedBy,
        aiModel: regeneratedPlan.metadata.aiModel,
        validationPassed: regeneratedPlan.validation.passed,
      });

      // Guardar el plan regenerado en Supabase
      console.log("💾 Guardando plan regenerado en Supabase...");
      const { data: savedPlan, error: saveError } = await savePlan(regeneratedPlan);
      
      if (saveError) {
        console.error("⚠️ Error al guardar plan:", saveError);
        toast.warning("Plan regenerado pero no se pudo guardar", {
          description: "El plan se regeneró correctamente pero hubo un problema al guardarlo. Intenta de nuevo.",
        });
      } else {
        console.log("✅ Plan guardado exitosamente en Supabase");
        // Actualizar con el plan guardado (puede tener campos actualizados por la BD)
        if (savedPlan) {
          setCurrentPlan(savedPlan);
        }
        toast.success("Plan regenerado y guardado", {
          description: `Tu plan se ha actualizado con nuevas recomendaciones (v${regeneratedPlan.version}).`,
        });
      }
    } catch (error) {
      console.error("❌ Error al regenerar plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error("No se pudo regenerar el plan", {
        description: errorMessage,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Error al cerrar sesión: " + (error.message || "Intenta de nuevo"));
    }
  };

  const tabs = [
    { id: "training" as TabType, label: "Entreno", icon: Dumbbell },
    { id: "nutrition" as TabType, label: "Nutrición", icon: Utensils },
    { id: "progress" as TabType, label: "Progreso", icon: TrendingUp },
    { id: "supplements" as TabType, label: "Suplementos", icon: Pill },
  ];

  // Obtener suplementos recomendados según el objetivo del usuario
  const recommendedSupplements = currentPlan?.preferences?.goal 
    ? getRecommendedSupplements(currentPlan.preferences.goal as "fat-loss" | "muscle" | "maintain" | "performance")
    : [];

  // Extraer datos del plan actual
  // Filtrar solo días con entrenos (excluir días de descanso sin ejercicios)
  const allWorkouts = currentPlan?.training.weeklyStructure || [];
  const workouts = allWorkouts.filter(workout => 
    workout.focus !== "rest" || (workout.exercises && workout.exercises.length > 0)
  );
  
  // Calcular día actual
  const todayIndex = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Convertir a índice de semana (Lun=0, Dom=6)
  const todayDay = weekDays[adjustedIndex];
  
  // Obtener nutrición del día actual o el primer día disponible
  const weeklyMenu = currentPlan?.nutrition?.weeklyMenu || [];
  
  console.log("🔍 [Dashboard] Buscando nutrición:", {
    hasNutrition: !!currentPlan?.nutrition,
    hasWeeklyMenu: !!currentPlan?.nutrition?.weeklyMenu,
    weeklyMenuLength: weeklyMenu.length,
    weeklyMenuDays: weeklyMenu.map(d => d.day),
    todayDay,
    weeklyMenuFull: weeklyMenu
  });
  
  let todayNutrition = weeklyMenu.find(day => day.day === todayDay) || null;
  
  // Si no hay datos para hoy, usar el primer día disponible
  if (!todayNutrition && weeklyMenu.length > 0) {
    todayNutrition = weeklyMenu[0];
    console.log("ℹ️ [Dashboard] No se encontró nutrición para hoy, usando:", todayNutrition?.day);
  }
  
  const meals = todayNutrition?.meals || [];
  const totalCalories = todayNutrition?.totalCalories || currentPlan?.nutrition?.dailyCalories || 0;
  const macros = currentPlan?.nutrition?.macroTargets || { protein: 0, carbs: 0, fat: 0 };
  
  console.log("🍽️ [Dashboard] Nutrición del día:", {
    todayNutrition: todayNutrition ? {
      day: todayNutrition.day,
      totalCalories: todayNutrition.totalCalories,
      hasMeals: !!todayNutrition.meals,
      mealsType: typeof todayNutrition.meals,
      mealsLength: todayNutrition.meals?.length || 0,
      meals: todayNutrition.meals
    } : null,
    mealsCount: meals.length,
    totalCalories,
    macros
  });
  
  // Debug: Log para verificar datos
  useEffect(() => {
    if (currentPlan) {
      console.log("📊 Plan cargado:", {
        hasNutrition: !!currentPlan.nutrition,
        hasWeeklyMenu: !!currentPlan.nutrition?.weeklyMenu,
        weeklyMenuLength: weeklyMenu.length,
        weeklyMenuDays: weeklyMenu.map(d => d.day),
        todayDay,
        todayNutrition: todayNutrition ? todayNutrition.day : "no encontrado",
        mealsCount: meals.length,
        totalCalories,
        macros,
        // Entrenos
        hasTraining: !!currentPlan.training,
        hasWeeklyStructure: !!currentPlan.training?.weeklyStructure,
        workoutsLength: workouts.length,
        workouts: workouts.map(w => ({ day: w.day, name: w.name, exercisesCount: w.exercises?.length || 0 })),
        trainingStructure: currentPlan.training?.weeklyStructure
      });
    }
  }, [currentPlan, weeklyMenu, todayDay, todayNutrition, meals.length, totalCalories, macros, workouts]);

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {currentPlan ? `Semana ${currentPlan.weekNumber}` : "Sin plan"}
              </p>
              <h1 className="text-xl font-bold">Tu plan</h1>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {membershipLoading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isPremium ? (
                <Button 
                  variant="premium" 
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isRegenerating ? "Regenerando..." : "Regenerar"}
                </Button>
              ) : (
                <Button 
                  variant="premium" 
                  size="sm"
                  onClick={() => setShowPremiumModal(true)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerar
                </Button>
              )}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
                {showLogoutMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[150px] z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-secondary rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? "bg-card shadow-card text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {planLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !currentPlan ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">No tienes un plan activo</p>
              <Button onClick={() => navigate("/onboarding")}>
                Crear mi plan
              </Button>
            </div>
          ) : (
            <>
              {activeTab === "training" && (
                <div className="space-y-3 animate-fade-in">
                  {workouts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay entrenamientos programados
                    </p>
                  ) : (
                    workouts.map((workout, index) => (
                      <button
                        key={index}
                        onClick={() => navigate("/workout", { state: { workout } })}
                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                          false // TODO: Implementar tracking de entrenamientos completados
                            ? "bg-accent/50 border-primary/30" 
                            : "bg-card border-border hover:border-primary/30 hover:shadow-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                              false // TODO: Implementar tracking de entrenamientos completados
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary"
                            }`}>
                              {workout.day}
                            </div>
                            <div>
                              <p className="font-semibold">{workout.name}</p>
                              {workout.duration > 0 && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {workout.duration} min
                                </p>
                              )}
                            </div>
                          </div>
                          {false ? ( // TODO: Implementar tracking de entrenamientos completados
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                              Hecho
                            </span>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === "nutrition" && (
                <div className="space-y-6 animate-fade-in">
                  {!currentPlan?.nutrition ? (
                    <div className="bg-card rounded-xl p-4 shadow-card text-center py-8">
                      <p className="text-muted-foreground mb-4">No hay datos de nutrición disponibles</p>
                      <p className="text-sm text-muted-foreground">El plan no incluye información nutricional</p>
                    </div>
                  ) : weeklyMenu.length === 0 ? (
                    <div className="bg-card rounded-xl p-4 shadow-card text-center py-8">
                      <p className="text-muted-foreground mb-4">No hay menú semanal disponible</p>
                      <p className="text-sm text-muted-foreground">El plan no tiene comidas programadas</p>
                    </div>
                  ) : (
                    <>
                      {/* Daily summary */}
                      <div className="bg-card rounded-xl p-4 shadow-card">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">
                            {todayNutrition?.day === todayDay ? `Hoy (${todayDay})` : `${todayNutrition?.day || todayDay}`}
                          </span>
                          <span className="text-xl font-bold">{totalCalories} kcal</span>
                        </div>
                        
                        {macros.protein > 0 || macros.carbs > 0 || macros.fat > 0 ? (
                          <div className="space-y-3">
                            <MacroBar label="Proteína" value={macros.protein} max={macros.protein * 1.2} unit="g" color="bg-primary" />
                            <MacroBar label="Carbos" value={macros.carbs} max={macros.carbs * 1.2} unit="g" color="bg-warning" />
                            <MacroBar label="Grasas" value={macros.fat} max={macros.fat * 1.2} unit="g" color="bg-accent-foreground" />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No hay información de macros disponible</p>
                        )}
                      </div>

                      {/* Meals */}
                      <div className="space-y-3">
                        <h3 className="font-semibold">Menú del día</h3>
                        {meals.length === 0 ? (
                          <div className="bg-card rounded-xl p-4 shadow-card text-center py-6">
                            <p className="text-muted-foreground">
                              No hay comidas programadas para {todayNutrition?.day || "este día"}
                            </p>
                          </div>
                        ) : (
                          meals.map((meal, index) => (
                            <div key={index} className="bg-card rounded-xl p-4 shadow-card">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium">{meal.name}</span>
                                <span className="text-sm text-muted-foreground">{meal.calories} kcal</span>
                              </div>
                              {meal.description && (
                                <p className="text-sm text-muted-foreground">{meal.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Locked feature - Solo mostrar si hay datos */}
                      {meals.length > 0 && (
                        <button 
                          onClick={() => navigate("/paywall")}
                          className="w-full p-4 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Ver sustituciones</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "progress" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-card rounded-xl p-5 shadow-card">
                    <h3 className="font-semibold mb-4">Check-in de hoy</h3>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">¿Entrenaste hoy?</label>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">Sí</Button>
                          <Button variant="outline" className="flex-1">No</Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Esfuerzo percibido (RPE)</label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                            <button
                              key={n}
                              className="flex-1 h-10 rounded-md bg-secondary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Macros aproximados</label>
                        {macros.protein > 0 || macros.carbs > 0 || macros.fat > 0 ? (
                          <div className="space-y-2">
                            <MacroBar 
                              label="Proteína" 
                              value={macros.protein || 0} 
                              max={Math.max(macros.protein * 1.2, macros.protein || 100)} 
                              unit="g" 
                              color="bg-primary" 
                            />
                            <MacroBar 
                              label="Carbos" 
                              value={macros.carbs || 0} 
                              max={Math.max(macros.carbs * 1.2, macros.carbs || 100)} 
                              unit="g" 
                              color="bg-warning" 
                            />
                            <MacroBar 
                              label="Grasas" 
                              value={macros.fat || 0} 
                              max={Math.max(macros.fat * 1.2, macros.fat || 100)} 
                              unit="g" 
                              color="bg-accent-foreground" 
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            Completa tu plan para ver tus macros objetivo
                          </p>
                        )}
                      </div>

                      <Button size="full" variant="success">
                        Guardar check-in
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "supplements" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-card rounded-xl p-4 shadow-card">
                    <h3 className="font-semibold mb-2">Suplementos recomendados</h3>
                    <p className="text-sm text-muted-foreground">
                      Basados en tu objetivo: {currentPlan?.preferences?.goal === "fat-loss" ? "Pérdida de grasa" : 
                        currentPlan?.preferences?.goal === "muscle" ? "Ganancia muscular" :
                        currentPlan?.preferences?.goal === "maintain" ? "Mantenimiento" : "Rendimiento"}
                    </p>
                  </div>

                  {recommendedSupplements.length === 0 ? (
                    <div className="bg-card rounded-xl p-4 shadow-card text-center py-8">
                      <p className="text-muted-foreground mb-4">No hay suplementos recomendados disponibles</p>
                      <p className="text-sm text-muted-foreground">Completa tu plan para obtener recomendaciones personalizadas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendedSupplements.map((supplement) => (
                        <SupplementCard key={supplement.id} supplement={supplement} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Click outside to close logout menu */}
        {showLogoutMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowLogoutMenu(false)}
          />
        )}

        {/* Premium Modal */}
        {showPremiumModal && !isPremium && (
          <div className="absolute inset-0 bg-foreground/50 flex items-end z-50">
            <div className="w-full bg-card rounded-t-3xl p-6 animate-slide-up">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-premium flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-premium-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Personaliza tu plan</h2>
                <p className="text-muted-foreground">
                  Ajusta el plan a tu situación: menos tiempo, sin lácteos, más proteína...
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="premium" 
                  size="full"
                  onClick={() => {
                    setShowPremiumModal(false);
                    navigate("/paywall");
                  }}
                >
                  Desbloquear Premium
                </Button>
                <Button 
                  variant="ghost" 
                  size="full"
                  onClick={() => setShowPremiumModal(false)}
                >
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Premium Success Modal - Se muestra después del pago exitoso */}
        {showPremiumModal && isPremium && (
          <div className="absolute inset-0 bg-foreground/50 flex items-end z-50">
            <div className="w-full bg-card rounded-t-3xl p-6 animate-slide-up">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-premium flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-premium-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">¡Ya eres Premium!</h2>
                <p className="text-muted-foreground">
                  Ahora puedes personalizar tu plan: menos tiempo, sin lácteos, más proteína...
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="premium" 
                  size="full"
                  onClick={() => {
                    setShowPremiumModal(false);
                    toast.info("Función de personalización disponible próximamente");
                  }}
                >
                  Personalizar plan
                </Button>
                <Button 
                  variant="ghost" 
                  size="full"
                  onClick={() => setShowPremiumModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileFrame>
  );
};

const MacroBar = ({ label, value, max, unit, color }: { 
  label: string; 
  value: number; 
  max: number; 
  unit: string;
  color: string;
}) => {
  // Asegurar que max nunca sea 0 para evitar división por cero
  const safeMax = max > 0 ? max : 100;
  const safeValue = value || 0;
  const percentage = Math.min((safeValue / safeMax) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {safeValue.toFixed(0)}/{safeMax.toFixed(0)}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const SupplementCard = ({ supplement }: { supplement: Supplement }) => {
  const categoryLabels: { [key: string]: string } = {
    "protein": "Proteína",
    "creatine": "Creatina",
    "vitamins": "Vitaminas",
    "pre-workout": "Pre-entrenamiento",
    "recovery": "Recuperación",
    "other": "Otros"
  };

  const categoryColors: { [key: string]: string } = {
    "protein": "bg-blue-500/10 text-blue-500",
    "creatine": "bg-purple-500/10 text-purple-500",
    "vitamins": "bg-green-500/10 text-green-500",
    "pre-workout": "bg-orange-500/10 text-orange-500",
    "recovery": "bg-pink-500/10 text-pink-500",
    "other": "bg-gray-500/10 text-gray-500"
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[supplement.category] || categoryColors.other}`}>
              {categoryLabels[supplement.category] || "Otros"}
            </span>
            {supplement.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>⭐</span>
                <span>{supplement.rating}</span>
              </div>
            )}
          </div>
          <h4 className="font-semibold text-lg mb-1">{supplement.name}</h4>
          <p className="text-sm text-muted-foreground mb-3">{supplement.description}</p>
        </div>
      </div>

      {supplement.benefits && supplement.benefits.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Beneficios:</p>
          <ul className="space-y-1">
            {supplement.benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={supplement.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <Button 
          variant="premium" 
          size="full"
          className="gap-2"
        >
          Ver en Amazon
          <ChevronRight className="w-4 h-4" />
        </Button>
      </a>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        Enlace de afiliado - Apoyas el proyecto sin costo adicional
      </p>
    </div>
  );
};

export default Dashboard;
