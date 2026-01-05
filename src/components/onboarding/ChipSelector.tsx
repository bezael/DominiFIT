interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  multiSelect?: boolean;
}

const ChipSelector = ({ options, selected, onToggle, multiSelect = true }: ChipSelectorProps) => {
  const handleClick = (option: string) => {
    if (!multiSelect) {
      onToggle(option);
    } else {
      onToggle(option);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            onClick={() => handleClick(option)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
