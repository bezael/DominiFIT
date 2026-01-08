import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";
import { useAuth } from "@/hooks/use-auth";
import { generateWeeklyPlan } from "@/lib/plan-engine";
import { savePlan } from "@/lib/plans";
import { toast } from "sonner";
import type { UserPreferences, GoalType, EquipmentType, DietType, PlanStyle } from "@/lib/plan-engine/types";

const steps = [
  "Analizando perfil",
  "Ajustando calorías y macros",
  "Construyendo entrenamientos",
  "Finalizando plan"
];

const Loading = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generatePlan = async () => {
      if (!user?.id) {
        console.error("No hay usuario autenticado");
        navigate("/auth");
        return;
      }

      // Obtener preferencias del localStorage
      const preferencesStr = localStorage.getItem('onboarding_preferences');
      if (!preferencesStr) {
        console.error("No se encontraron preferencias de onboarding");
        navigate("/onboarding");
        return;
      }

      try {
        setIsGenerating(true);
        const onboardingData = JSON.parse(preferencesStr);
        
        // Mapear datos del onboarding a UserPreferences
        const preferences: UserPreferences = {
          goal: onboardingData.goal as GoalType,
          daysPerWeek: onboardingData.daysPerWeek,
          sessionTime: onboardingData.sessionTime,
          equipment: onboardingData.equipment as EquipmentType,
          dietType: onboardingData.dietType as DietType,
          allergies: onboardingData.allergies || [],
          mealsPerDay: onboardingData.mealsPerDay,
          style: onboardingData.style as PlanStyle,
        };

        console.log("🤖 Generando plan con OpenAI...", { userId: user.id, preferences });

        // Generar plan con IA
        const plan = await generateWeeklyPlan(user.id, preferences, 1, true);

        console.log("✅ Plan generado:", {
          id: plan.id,
          validationPassed: plan.validation.passed,
          generatedBy: plan.metadata.generatedBy,
        });

        // Guardar plan en Supabase
        const { data: savedPlan, error: saveError } = await savePlan(plan);

        if (saveError) {
          console.error("❌ Error al guardar plan:", saveError);
          toast.error("Error al guardar el plan", {
            description: "El plan se generó pero no se pudo guardar. Intenta de nuevo.",
          });
        } else {
          console.log("✅ Plan guardado exitosamente en Supabase");
          // Limpiar preferencias del localStorage
          localStorage.removeItem('onboarding_preferences');
        }

        // Navegar al dashboard después de un breve delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } catch (error) {
        console.error("❌ Error al generar plan:", error);
        toast.error("Error al generar tu plan", {
          description: error instanceof Error ? error.message : "Intenta de nuevo más tarde",
        });
        // Navegar al dashboard de todas formas
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } finally {
        setIsGenerating(false);
      }
    };

    // Iniciar generación después de un pequeño delay para mostrar la UI
    const generateTimeout = setTimeout(() => {
      generatePlan();
    }, 500);

    // Animar los pasos
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(generateTimeout);
    };
  }, [user?.id, navigate]);

  return (
    <MobileFrame>
      <div className="flex flex-col items-center justify-center min-h-full px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
            <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Creando tu plan...</h1>
          <p className="text-muted-foreground">Esto solo tomará unos segundos</p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step}
              className={`flex items-center gap-3 transition-all duration-500 ${
                index <= currentStep ? "opacity-100" : "opacity-30"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep 
                  ? "bg-primary text-primary-foreground" 
                  : index === currentStep 
                    ? "bg-accent border-2 border-primary" 
                    : "bg-secondary"
              }`}>
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : index === currentStep ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                )}
              </div>
              <span className={`font-medium ${
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
};

export default Loading;
