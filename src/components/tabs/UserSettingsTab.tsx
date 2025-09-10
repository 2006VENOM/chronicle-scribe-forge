import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Settings, Palette, Eye, Bell, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email?: string;
}

interface UserSettingsTabProps {
  user: User | null;
  onLogout: () => void;
}

export const UserSettingsTab = ({ user, onLogout }: UserSettingsTabProps) => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    whatsapp_link: ''
  });
  const [websiteSettings, setWebsiteSettings] = useState({
    animationsEnabled: true,
    readingSpeed: '1x',
    textColor: 'white',
    backgroundColor: 'black',
    commentsVisible: true,
    notificationsEnabled: true,
    autoSave: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, phone_number')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          username: data.username || '',
          email: data.email || '',
          whatsapp_link: data.phone_number || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          email: profile.email,
          phone_number: profile.whatsapp_link
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">You need to login to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Account Settings */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp Link</label>
              <Input
                value={profile.whatsapp_link}
                onChange={(e) => setProfile(prev => ({ ...prev, whatsapp_link: e.target.value }))}
                placeholder="+2349162635238"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Website Settings */}
        <Card className="glass-panel">
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
              <Switch 
                checked={websiteSettings.animationsEnabled} 
                onCheckedChange={(checked) => setWebsiteSettings(prev => ({ ...prev, animationsEnabled: checked }))}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="font-medium">Reading Speed</label>
              <Select 
                value={websiteSettings.readingSpeed} 
                onValueChange={(value) => setWebsiteSettings(prev => ({ ...prev, readingSpeed: value }))}
              >
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
              <Select 
                value={websiteSettings.textColor} 
                onValueChange={(value) => setWebsiteSettings(prev => ({ ...prev, textColor: value }))}
              >
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
              <Select 
                value={websiteSettings.backgroundColor} 
                onValueChange={(value) => setWebsiteSettings(prev => ({ ...prev, backgroundColor: value }))}
              >
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

        {/* Reading Experience */}
        <Card className="glass-panel">
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
              <Switch 
                checked={websiteSettings.commentsVisible} 
                onCheckedChange={(checked) => setWebsiteSettings(prev => ({ ...prev, commentsVisible: checked }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Auto Save Progress</label>
                <p className="text-sm text-muted-foreground">Automatically save reading position</p>
              </div>
              <Switch 
                checked={websiteSettings.autoSave} 
                onCheckedChange={(checked) => setWebsiteSettings(prev => ({ ...prev, autoSave: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-panel">
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
              <Switch 
                checked={websiteSettings.notificationsEnabled} 
                onCheckedChange={(checked) => setWebsiteSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};