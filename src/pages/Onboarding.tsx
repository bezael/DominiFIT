import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Flame, Scale, Dumbbell, Clock, Home, Building2, Utensils, Leaf, Fish, Apple, Zap, ListChecks } from "lucide-react";
import MobileFrame from "@/components/MobileFrame";
import StepIndicator from "@/components/onboarding/StepIndicator";
import OptionCard from "@/components/onboarding/OptionCard";
import ChipSelector from "@/components/onboarding/ChipSelector";

const TOTAL_STEPS = 5;

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  
  // Step 1: Goal
  const [goal, setGoal] = useState("");
  
  // Step 2: Training
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [sessionTime, setSessionTime] = useState<number>(45);
  const [equipment, setEquipment] = useState("");
  
  // Step 3: Nutrition
  const [dietType, setDietType] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  
  // Step 4: Style
  const [style, setStyle] = useState("");

  const goals = [
    { id: "fat-loss", title: "Perder grasa", icon: <Flame className="w-5 h-5" /> },
    { id: "muscle", title: "Ganar músculo", icon: <Target className="w-5 h-5" /> },
    { id: "maintain", title: "Mantener", icon: <Scale className="w-5 h-5" /> },
  ];

  const equipmentOptions = [
    { id: "none", title: "Sin equipamiento", icon: <Home className="w-5 h-5" /> },
    { id: "basic", title: "Básico", icon: <Dumbbell className="w-5 h-5" /> },
    { id: "gym", title: "Gimnasio", icon: <Building2 className="w-5 h-5" /> },
  ];

  const dietTypes = [
    { id: "omnivore", title: "Omnívoro", icon: <Utensils className="w-5 h-5" /> },
    { id: "vegetarian", title: "Vegetariano", icon: <Leaf className="w-5 h-5" /> },
    { id: "pescatarian", title: "Pescetariano", icon: <Fish className="w-5 h-5" /> },
    { id: "keto", title: "Keto", icon: <Apple className="w-5 h-5" /> },
  ];

  const allergyOptions = ["Gluten", "Lácteos", "Frutos secos", "Huevo", "Soja", "Mariscos"];

  const styles = [
    { 
      id: "simple", 
      title: "Rápido y simple", 
      description: "Rutinas cortas, comidas fáciles de preparar",
      icon: <Zap className="w-5 h-5" />
    },
    { 
      id: "strict", 
      title: "Más estricto", 
      description: "Seguimiento detallado, máximo control",
      icon: <ListChecks className="w-5 h-5" />
    },
  ];

  const canContinue = () => {
    switch (step) {
      case 0: return !!goal;
      case 1: return !!equipment;
      case 2: return !!dietType;
      case 3: return !!style;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      navigate("/loading");
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate("/auth");
    }
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-2xl font-bold mb-2">¿Cuál es tu objetivo?</h2>
            <p className="text-muted-foreground mb-6">Elige el que más se ajuste a ti</p>
            <div className="space-y-3">
              {goals.map((g) => (
                <OptionCard
                  key={g.id}
                  icon={g.icon}
                  title={g.title}
                  selected={goal === g.id}
                  onClick={() => setGoal(g.id)}
                />
              ))}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tu entrenamiento</h2>
              <p className="text-muted-foreground">Cuéntanos cómo quieres entrenar</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Días por semana: {daysPerWeek}</label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                      daysPerWeek === d 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Tiempo por sesión</label>
              <div className="flex gap-2">
                {[20, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSessionTime(t)}
                    className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                      sessionTime === t 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {t}'
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Equipamiento disponible</label>
              <div className="space-y-3">
                {equipmentOptions.map((e) => (
                  <OptionCard
                    key={e.id}
                    icon={e.icon}
                    title={e.title}
                    selected={equipment === e.id}
                    onClick={() => setEquipment(e.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tu alimentación</h2>
              <p className="text-muted-foreground">Personalizamos tus comidas</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Tipo de dieta</label>
              <div className="grid grid-cols-2 gap-3">
                {dietTypes.map((d) => (
                  <OptionCard
                    key={d.id}
                    icon={d.icon}
                    title={d.title}
                    selected={dietType === d.id}
                    onClick={() => setDietType(d.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Alergias o intolerancias</label>
              <ChipSelector
                options={allergyOptions}
                selected={allergies}
                onToggle={toggleAllergy}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Comidas al día: {mealsPerDay}</label>
              <div className="flex gap-2">
                {[3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMealsPerDay(m)}
                    className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                      mealsPerDay === m 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-2xl font-bold mb-2">Tu estilo</h2>
            <p className="text-muted-foreground mb-6">¿Cómo prefieres seguir el plan?</p>
            <div className="space-y-3">
              {styles.map((s) => (
                <OptionCard
                  key={s.id}
                  icon={s.icon}
                  title={s.title}
                  description={s.description}
                  selected={style === s.id}
                  onClick={() => setStyle(s.id)}
                />
              ))}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">¡Todo listo!</h2>
              <p className="text-muted-foreground">Revisa tu configuración</p>
            </div>

            <div className="bg-secondary rounded-xl p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objetivo</span>
                <span className="font-medium">{goals.find(g => g.id === goal)?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrenamiento</span>
                <span className="font-medium">{daysPerWeek} días/semana, {sessionTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipamiento</span>
                <span className="font-medium">{equipmentOptions.find(e => e.id === equipment)?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dieta</span>
                <span className="font-medium">{dietTypes.find(d => d.id === dietType)?.title}</span>
              </div>
              {allergies.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alergias</span>
                  <span className="font-medium">{allergies.join(", ")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comidas</span>
                <span className="font-medium">{mealsPerDay} al día</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estilo</span>
                <span className="font-medium">{styles.find(s => s.id === style)?.title}</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <MobileFrame>
      <div className="flex flex-col min-h-full px-6 pb-8">
        {/* Header */}
        <div className="py-4 space-y-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Atrás</span>
          </button>
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Content */}
        <div className="flex-1 py-4">
          {renderStep()}
        </div>

        {/* CTA */}
        <Button 
          size="full" 
          onClick={handleNext}
          disabled={!canContinue()}
        >
          {step === TOTAL_STEPS - 1 ? "Generar mi semana 1" : "Continuar"}
        </Button>
      </div>
    </MobileFrame>
  );
};

export default Onboarding;
