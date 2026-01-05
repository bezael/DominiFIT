import { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
}

const MobileFrame = ({ children }: MobileFrameProps) => {
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] min-h-[85vh] bg-background rounded-[2.5rem] shadow-lg overflow-hidden relative border border-border/50">
        {/* Status bar simulation */}
        <div className="h-12 bg-background flex items-center justify-center px-6 relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-6 bg-foreground/10 rounded-full" />
        </div>
        
        {/* Content area */}
        <div className="h-[calc(85vh-3rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileFrame;
