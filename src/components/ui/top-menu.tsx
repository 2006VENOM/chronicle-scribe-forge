import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Search, Bell, Menu, Home } from "lucide-react";

interface TopMenuProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
}

export const TopMenu = ({ onSettingsClick, onHomeClick }: TopMenuProps) => {
  const [notificationCount] = useState(3);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between p-4">
        {/* App Title */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={onHomeClick}
            variant="ghost" 
            size="sm"
            className="p-2"
          >
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Stories</h1>
        </div>

        {/* Right Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* Main Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onHomeClick}>
                <Home className="mr-2 h-4 w-4" />
                <span>Home</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSettingsClick}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search Stories</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};