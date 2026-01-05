import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, User, Zap } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";

const Landing = () => {
  const navigate = useNavigate();

  const trustBadges = [
    { icon: Zap, label: "Simple" },
    { icon: User, label: "Personalizado" },
    { icon: Sparkles, label: "Sin complicaciones" },
  ];

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full px-6 pb-8 pt-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">FitFlow</span>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center animate-slide-up">
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Tu plan de entrenamiento y nutrición, adaptado a ti
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Entrena mejor. Come sin pensar. Ajustes automáticos cada semana.
          </p>

          {/* Trust badges */}
          <div className="flex gap-3 mb-10">
            {trustBadges.map((badge) => (
              <div 
                key={badge.label}
                className="flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-full"
              >
                <badge.icon className="w-4 h-4 text-accent-foreground" />
                <span className="text-sm font-medium text-accent-foreground">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button 
            size="full" 
            onClick={() => navigate("/auth")}
          >
            Crear mi plan
          </Button>
          
          <Button 
            variant="outline" 
            size="full"
            onClick={() => navigate("/dashboard")}
          >
            Ver ejemplo
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Landing;
