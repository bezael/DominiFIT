import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (email) {
      navigate("/onboarding");
    }
  };

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full px-6 pb-8">
        {/* Back button */}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground py-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="flex-1 flex flex-col justify-center animate-slide-up">
          <h1 className="text-2xl font-bold mb-2">
            Empecemos
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Introduce tu email para crear tu plan personalizado
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 text-base rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <Button 
              size="full" 
              onClick={handleContinue}
              disabled={!email}
            >
              Continuar
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Modo demo – no se crea cuenta real
          </p>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Auth;
