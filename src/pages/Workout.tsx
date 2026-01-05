import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileFrame from "@/components/MobileFrame";
import { toast } from "sonner";

const mockExercises = [
  { name: "Press de banca", sets: 4, reps: "8-10", rest: "90s" },
  { name: "Remo con mancuerna", sets: 4, reps: "10-12", rest: "60s" },
  { name: "Press militar", sets: 3, reps: "10-12", rest: "60s" },
  { name: "Curl de bíceps", sets: 3, reps: "12-15", rest: "45s" },
  { name: "Extensión de tríceps", sets: 3, reps: "12-15", rest: "45s" },
  { name: "Plancha", sets: 3, reps: "30-45s", rest: "30s" },
];

const Workout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const workout = location.state?.workout || { name: "Tren superior", duration: 45 };
  
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const toggleExercise = (index: number) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleMarkDone = () => {
    toast.success("¡Entrenamiento completado!", {
      description: "Buen trabajo. Tu progreso ha sido guardado."
    });
    navigate("/dashboard");
  };

  const allDone = completedExercises.size === mockExercises.length;

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{workout.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {workout.duration} minutos
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {completedExercises.size}/{mockExercises.length}
              </p>
              <p className="text-xs text-muted-foreground">ejercicios</p>
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {mockExercises.map((exercise, index) => {
              const isDone = completedExercises.has(index);
              return (
                <button
                  key={index}
                  onClick={() => toggleExercise(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    isDone 
                      ? "bg-accent/50 border-primary/30" 
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary"
                    }`}>
                      {isDone ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-semibold ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {exercise.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} series × {exercise.reps} reps · {exercise.rest} descanso
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="p-6 border-t border-border">
          <Button 
            size="full" 
            variant={allDone ? "success" : "default"}
            onClick={handleMarkDone}
          >
            {allDone ? "Completar entrenamiento" : "Marcar como hecho"}
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
};

export default Workout;
