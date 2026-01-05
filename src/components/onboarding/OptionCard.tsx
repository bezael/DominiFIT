import { ReactNode } from "react";
import { Check } from "lucide-react";

interface OptionCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

const OptionCard = ({ icon, title, description, selected, onClick }: OptionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
        selected 
          ? "border-primary bg-accent shadow-card" 
          : "border-border bg-card hover:border-primary/30 hover:shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selected ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}>
              {icon}
            </div>
          )}
          <div>
            <p className="font-semibold">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        
        {selected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};

export default OptionCard;
