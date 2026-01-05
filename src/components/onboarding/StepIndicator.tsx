interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            index < currentStep 
              ? "bg-primary" 
              : index === currentStep 
                ? "bg-primary/50" 
                : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
