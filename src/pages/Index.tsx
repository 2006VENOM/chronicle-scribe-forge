import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";
import { HomeTab } from "@/components/tabs/HomeTab";
import { LoginTab } from "@/components/tabs/LoginTab";
import { UserSettingsTab } from "@/components/tabs/UserSettingsTab";
import { PrivacyPolicyTab } from "@/components/tabs/PrivacyPolicyTab";
import { AboutTab } from "@/components/tabs/AboutTab";
import { ContactUsTab } from "@/components/tabs/ContactUsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email?: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'splash' | 'main'>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashComplete = () => setCurrentView('main');
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('login');
  };

  if (currentView === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">VENOM</h1>
          <p className="text-muted-foreground">Stories & Chronicles</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-0">
            <HomeTab />
          </TabsContent>

          <TabsContent value="login" className="mt-0">
            <LoginTab onLogin={handleLogin} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <UserSettingsTab user={currentUser} onLogout={handleLogout} />
          </TabsContent>

          <TabsContent value="privacy" className="mt-0">
            <PrivacyPolicyTab />
          </TabsContent>

          <TabsContent value="about" className="mt-0">
            <AboutTab />
          </TabsContent>

          <TabsContent value="contact" className="mt-0">
            <ContactUsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;