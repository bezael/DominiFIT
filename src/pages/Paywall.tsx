import MobileFrame from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, redirectToCheckout } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, History, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const benefits = [
  { icon: RefreshCw, text: "Regeneraciones ilimitadas con IA" },
  { icon: Zap, text: "Ajustes semanales automáticos" },
  { icon: Sparkles, text: "Sustituciones avanzadas" },
  { icon: History, text: "Historial completo" },
];

const Paywall = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // ID del precio de Stripe - reemplázalo con tu Price ID real
  const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID || "price_1234567890";

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      // Obtener el usuario actual de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Crear sesión de checkout y obtener la URL
      console.log("Creating checkout session with:", {
        priceId: STRIPE_PRICE_ID,
        userId,
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/paywall`,
      });

      const checkoutUrl = await createCheckoutSession({
        priceId: STRIPE_PRICE_ID,
        userId,
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/paywall`,
      });

      console.log("Checkout URL received:", checkoutUrl);

      // Validar que la URL sea válida antes de redirigir
      if (!checkoutUrl || !checkoutUrl.startsWith('https://checkout.stripe.com/')) {
        throw new Error(`URL de checkout inválida: ${checkoutUrl}`);
      }

      // Redirigir a Stripe Checkout usando redirección manual
      redirectToCheckout(checkoutUrl);
    } catch (error) {
      console.error("Error en checkout:", error);
      toast.error("Error al procesar el pago", {
        description: error instanceof Error ? error.message : "Por favor, intenta de nuevo más tarde.",
      });
      setIsLoading(false);
    }
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
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : "Probar Premium"}
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
