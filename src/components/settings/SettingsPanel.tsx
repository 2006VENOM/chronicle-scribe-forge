import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StorySearch } from "@/components/search/StorySearch";
import { X, Settings, Shield, Search, Palette, Eye, Bell } from "lucide-react";

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const [currentTab, setCurrentTab] = useState<'general' | 'admin' | 'search'>('general');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Settings state
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState('1x');
  const [textColor, setTextColor] = useState('white');
  const [backgroundColor, setBackgroundColor] = useState('black');
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setCurrentTab('admin');
    } else {
      alert('Invalid admin password');
    }
  };

  // Early returns for specific tabs
  if (currentTab === 'admin' && isAdminAuthenticated) {
    return <AdminPanel onClose={onClose} />;
  }

  if (currentTab === 'search') {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-2xl font-bold">Search Stories</h2>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1">
            <StorySearch />
          </div>
          <div className="p-4 border-t">
            <Button onClick={() => setCurrentTab('general')} variant="outline" className="w-full">
              Back to Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4">
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setCurrentTab('general')}
              variant={currentTab === 'general' ? 'default' : 'outline'}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              General
            </Button>
            <Button
              onClick={() => setCurrentTab('search')}
              variant={'outline'}
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              onClick={() => {
                if (isAdminAuthenticated) {
                  setCurrentTab('admin');
                } else {
                  setShowAdminLogin(true);
                }
              }}
              variant={'outline'}
              size="sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>

            {/* Admin Login Modal */}
            {showAdminLogin && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-96">
                  <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full p-3 rounded-lg border bg-card text-foreground"
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAdminLogin} className="flex-1">Login</Button>
                      <Button onClick={() => setShowAdminLogin(false)} variant="outline">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {/* General Settings */}
          <div className="space-y-6">
            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Animations</label>
                    <p className="text-sm text-muted-foreground">Enable smooth animations and transitions</p>
                  </div>
                  <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <label className="font-medium">Reading Speed</label>
                  <Select value={readingSpeed} onValueChange={setReadingSpeed}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5x">0.5x Slow</SelectItem>
                      <SelectItem value="1x">1x Normal</SelectItem>
                      <SelectItem value="1.5x">1.5x Fast</SelectItem>
                      <SelectItem value="2x">2x Very Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="font-medium">Text Color</label>
                  <Select value={textColor} onValueChange={setTextColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Background Color</label>
                  <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="dark-gray">Dark Gray</SelectItem>
                      <SelectItem value="blue">Dark Blue</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reading Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Reading Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Show Comments</label>
                    <p className="text-sm text-muted-foreground">Display comment sections on stories</p>
                  </div>
                  <Switch checked={commentsVisible} onCheckedChange={setCommentsVisible} />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Auto Save Progress</label>
                    <p className="text-sm text-muted-foreground">Automatically save reading position</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Push Notifications</label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new stories</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
              </CardContent>
            </Card>

            {/* Legal */}
            <Card>
              <CardHeader>
                <CardTitle>Legal & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Privacy Policy
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Terms of Service
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Data Protection
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Cookie Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};