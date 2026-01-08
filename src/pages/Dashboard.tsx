import MobileFrame from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { syncSubscriptionWithStripe } from "@/lib/membership";
import { regeneratePlan } from "@/lib/plan-engine";
import type { DietType, EquipmentType, GoalType, PlanStyle, RegenerationConstraints, WeeklyPlan } from "@/lib/plan-engine/types";
import { savePlan } from "@/lib/plans";
import { ChevronRight, Clock, Dumbbell, Lock, LogOut, Sparkles, TrendingUp, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type TabType = "training" | "nutrition" | "progress";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const mockWorkouts = [
  { day: "Lun", name: "Tren superior", duration: 45, done: true },
  { day: "Mar", name: "Cardio + Core", duration: 30, done: true },
  { day: "Mié", name: "Descanso activo", duration: 20, done: false },
  { day: "Jue", name: "Tren inferior", duration: 45, done: false },
  { day: "Vie", name: "Full body", duration: 40, done: false },
  { day: "Sáb", name: "Cardio HIIT", duration: 25, done: false },
  { day: "Dom", name: "Descanso", duration: 0, done: false },
];

const mockMeals = [
  { name: "Desayuno", calories: 450, description: "Avena con frutas y nueces" },
  { name: "Almuerzo", calories: 650, description: "Pollo a la plancha con arroz y verduras" },
  { name: "Merienda", calories: 200, description: "Yogur griego con miel" },
  { name: "Cena", calories: 500, description: "Salmón con ensalada mediterránea" },
];

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
      
      // Crear un plan temporal desde los datos mock para poder regenerarlo
      // En producción, esto vendría de Supabase
      const currentPlan: WeeklyPlan = {
        id: `plan-${user.id}-1-${Date.now()}`,
        userId: user.id,
        weekNumber: 1,
        createdAt: new Date().toISOString(),
        version: 1,
        preferences: {
          goal: "fat-loss" as GoalType,
          daysPerWeek: 4,
          sessionTime: 45,
          equipment: "gym" as EquipmentType,
          dietType: "omnivore" as DietType,
          allergies: [],
          mealsPerDay: 4,
          style: "simple" as PlanStyle,
          weight: 70,
          height: 175,
          age: 30,
          gender: "male",
          activityLevel: "moderate",
        },
        training: {
          weeklyStructure: mockWorkouts.map((w, idx) => ({
            day: w.day,
            name: w.name,
            duration: w.duration,
            focus: idx === 0 ? "upper" : idx === 3 ? "lower" : idx === 4 ? "full" : idx === 1 || idx === 5 ? "cardio" : "rest",
            intensity: w.duration > 40 ? "high" : w.duration > 20 ? "medium" : "low",
            exercises: [],
          })),
          totalVolume: {},
          progression: "Progresión semanal estándar",
        },
        nutrition: {
          dailyCalories: totalCalories,
          macroTargets: {
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
          },
          weeklyMenu: weekDays.map((day) => ({
            day,
            totalCalories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            meals: mockMeals.map((m) => ({
              name: m.name,
              calories: m.calories,
              protein: macros.protein / mockMeals.length,
              carbs: macros.carbs / mockMeals.length,
              fat: macros.fat / mockMeals.length,
              description: m.description,
              ingredients: [],
            })),
          })),
        },
        validation: {
          passed: true,
          warnings: [],
          errors: [],
          checks: [],
        },
        metadata: {
          generatedBy: "template",
        },
      };

      console.log("🔄 Iniciando regeneración de plan...", { userId: user.id });
      
      // Restricciones mínimas para regenerar (puedes personalizar esto)
      const constraints: RegenerationConstraints = {
        notes: "Regenerar plan con variaciones frescas manteniendo el mismo objetivo",
      };

      console.log("📤 Llamando a regeneratePlan con OpenAI...");
      const regeneratedPlan = await regeneratePlan(currentPlan, constraints);
      
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
  ];

  const totalCalories = mockMeals.reduce((sum, m) => sum + m.calories, 0);
  const macros = { protein: 140, carbs: 180, fat: 65 };

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Semana 1</p>
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
          {activeTab === "training" && (
            <div className="space-y-3 animate-fade-in">
              {mockWorkouts.map((workout, index) => (
                <button
                  key={index}
                  onClick={() => navigate("/workout", { state: { workout } })}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    workout.done 
                      ? "bg-accent/50 border-primary/30" 
                      : "bg-card border-border hover:border-primary/30 hover:shadow-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        workout.done 
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
                    {workout.done ? (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        Hecho
                      </span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-6 animate-fade-in">
              {/* Daily summary */}
              <div className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Hoy</span>
                  <span className="text-xl font-bold">{totalCalories} kcal</span>
                </div>
                
                <div className="space-y-3">
                  <MacroBar label="Proteína" value={macros.protein} max={150} unit="g" color="bg-primary" />
                  <MacroBar label="Carbos" value={macros.carbs} max={220} unit="g" color="bg-warning" />
                  <MacroBar label="Grasas" value={macros.fat} max={80} unit="g" color="bg-accent-foreground" />
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-3">
                <h3 className="font-semibold">Menú del día</h3>
                {mockMeals.map((meal, index) => (
                  <div key={index} className="bg-card rounded-xl p-4 shadow-card">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{meal.name}</span>
                      <span className="text-sm text-muted-foreground">{meal.calories} kcal</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meal.description}</p>
                  </div>
                ))}
              </div>

              {/* Locked feature */}
              <button 
                onClick={() => navigate("/paywall")}
                className="w-full p-4 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground"
              >
                <Lock className="w-4 h-4" />
                <span>Ver sustituciones</span>
              </button>
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
                    <div className="space-y-2">
                      <MacroBar label="Proteína" value={120} max={150} unit="g" color="bg-primary" />
                      <MacroBar label="Carbos" value={160} max={220} unit="g" color="bg-warning" />
                      <MacroBar label="Grasas" value={55} max={80} unit="g" color="bg-accent-foreground" />
                    </div>
                  </div>

                  <Button size="full" variant="success">
                    Guardar check-in
                  </Button>
                </div>
              </div>
            </div>
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
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}{unit}</span>
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

export default Dashboard;
