import MobileFrame from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (!result) {
          throw new Error("No se recibió respuesta del servidor");
        }
        
        const { data, error } = result;
        if (error) throw error;
        
        // Si el registro requiere confirmación de email
        if (data?.user && !data?.session) {
          toast.success("¡Cuenta creada! Por favor, verifica tu email para continuar.");
          setIsLoading(false);
          return;
        }
        
        if (!data?.user) {
          throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
        }
        
        toast.success("¡Bienvenido! Redirigiendo...");
        navigate("/onboarding");
      } else {
        const result = await signIn(email, password);
        if (!result) {
          throw new Error("No se recibió respuesta del servidor");
        }
        
        const { data, error } = result;
        if (error) throw error;
        
        if (!data?.user) {
          throw new Error("No se pudo iniciar sesión. Verifica tus credenciales.");
        }
        
        toast.success("¡Bienvenido de nuevo!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      toast.error(
        error.message || 
        (mode === "login" 
          ? "Error al iniciar sesión. Verifica tus credenciales." 
          : "Error al crear la cuenta. Intenta de nuevo.")
      );
    } finally {
      setIsLoading(false);
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
            {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {mode === "login" 
              ? "Inicia sesión para continuar con tu plan" 
              : "Crea tu cuenta para empezar tu plan personalizado"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 text-base rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 pr-12 text-base rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary"
                disabled={isLoading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button 
              type="submit"
              size="full" 
              disabled={!email || !password || isLoading}
              className="h-14 text-base"
            >
              {isLoading 
                ? "Procesando..." 
                : mode === "login" 
                  ? "Iniciar sesión" 
                  : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setPassword("");
                setShowPassword(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {mode === "login" 
                ? "¿No tienes cuenta? " 
                : "¿Ya tienes cuenta? "}
              <span className="font-semibold text-primary">
                {mode === "login" ? "Regístrate" : "Inicia sesión"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Auth;
