import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";

const steps = [
  "Analizando perfil",
  "Ajustando calorías y macros",
  "Construyendo entrenamientos",
  "Finalizando plan"
];

const Loading = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      navigate("/dashboard");
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

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
