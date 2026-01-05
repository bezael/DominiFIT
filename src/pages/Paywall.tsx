import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Zap, RefreshCw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileFrame from "@/components/MobileFrame";
import { toast } from "sonner";

const benefits = [
  { icon: RefreshCw, text: "Regeneraciones ilimitadas con IA" },
  { icon: Zap, text: "Ajustes semanales automáticos" },
  { icon: Sparkles, text: "Sustituciones avanzadas" },
  { icon: History, text: "Historial completo" },
];

const Paywall = () => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    toast.success("¡Modo demo!", {
      description: "En producción, aquí irías al checkout de pago."
    });
    navigate("/dashboard");
  };

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full px-6 pb-8">
        {/* Header */}
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground py-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="flex-1 flex flex-col justify-center animate-slide-up">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-premium flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-premium-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pasa a Premium</h1>
            <p className="text-muted-foreground">
              Desbloquea todo el potencial de tu plan
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-card rounded-2xl p-5 shadow-card mb-8">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">12,99€</span>
              <span className="text-muted-foreground">/mes</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cancela cuando quieras
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button 
            variant="premium" 
            size="full"
            onClick={handleSubscribe}
          >
            Probar Premium
          </Button>
          
          <Button 
            variant="ghost" 
            size="full"
            onClick={() => navigate("/dashboard")}
          >
            Seguir con Free
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Paywall;
