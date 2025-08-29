import { useState } from "react";
import { StoryReader } from "@/components/story/StoryReader";
import { Navigation } from "@/components/navigation/Navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SplashScreen } from "@/components/ui/splash-screen";

const Index = () => {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <Navigation onAdminClick={() => setShowAdmin(true)} />
      <StoryReader />
    </div>
  );
};

export default Index;
