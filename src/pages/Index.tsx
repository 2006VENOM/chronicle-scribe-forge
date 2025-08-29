import { useState } from "react";
import { Navigation } from "@/components/navigation/Navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SplashScreen } from "@/components/ui/splash-screen";
import { StoryGrid } from "@/components/story/StoryGrid";
import { StoryDetail } from "@/components/story/StoryDetail";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  fake_reads: number;
  fake_likes: number;
  fake_comments: number;
  created_at: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'splash' | 'home' | 'story' | 'admin'>('splash');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleSplashComplete = () => setCurrentView('home');
  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setCurrentView('story');
  };
  const handleBackToHome = () => {
    setSelectedStory(null);
    setCurrentView('home');
  };

  if (currentView === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (currentView === 'admin') {
    return <AdminPanel onClose={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <StoryGrid onStorySelect={handleStorySelect} />
      )}
      
      {currentView === 'story' && selectedStory && (
        <StoryDetail story={selectedStory} onBack={handleBackToHome} />
      )}

      <Navigation 
        onAdminClick={() => setCurrentView('admin')}
        onHomeClick={handleBackToHome}
        currentView={
          currentView === 'admin' ? 'admin' : 
          currentView === 'story' ? 'story' : 
          'home'
        }
      />
    </div>
  );
};

export default Index;