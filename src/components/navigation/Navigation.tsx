import { Button } from "@/components/ui/button";
import { Home, Settings } from "lucide-react";

interface NavigationProps {
  onAdminClick: () => void;
  onHomeClick: () => void;
  currentView: 'home' | 'story' | 'admin';
}

export const Navigation = ({ onAdminClick, onHomeClick, currentView }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-panel m-4 p-3 flex justify-center items-center gap-8">
        <Button 
          onClick={onHomeClick} 
          variant={currentView === 'home' ? "default" : "ghost"} 
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Button>
        
        <Button 
          onClick={onAdminClick} 
          variant={currentView === 'admin' ? "default" : "ghost"} 
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Admin</span>
        </Button>
      </div>
    </nav>
  );
};