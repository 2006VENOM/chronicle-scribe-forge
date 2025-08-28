import { useState } from "react";
import { StoryReader } from "@/components/story/StoryReader";
import { Navigation } from "@/components/navigation/Navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";

const Index = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation onAdminClick={() => setShowAdmin(true)} />
      <StoryReader />
    </div>
  );
};

export default Index;
