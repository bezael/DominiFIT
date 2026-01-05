import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, MessageCircle } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";

const Reminder = () => {
  const navigate = useNavigate();

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full bg-[#1a1a2e]">
        {/* Fake Telegram header */}
        <div className="px-4 py-3 border-b border-border/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-primary-foreground/90">FitFlow Bot</p>
            <p className="text-xs text-primary-foreground/50">en línea</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Bot message */}
            <div className="flex gap-2 mb-4">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-[#2d2d44] rounded-2xl rounded-tl-none px-4 py-3">
                <p className="text-primary-foreground/90">
                  ¡Hola! 👋
                </p>
                <p className="text-primary-foreground/90 mt-2">
                  ¿Entrenaste hoy?
                </p>
                <p className="text-xs text-primary-foreground/40 mt-2">
                  14:32
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="p-6">
          <Button 
            size="full" 
            onClick={() => navigate("/dashboard")}
            className="bg-[#5288c1] hover:bg-[#5288c1]/90 text-primary-foreground"
          >
            Abrir app
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Reminder;
