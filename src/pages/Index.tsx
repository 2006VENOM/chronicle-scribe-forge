import { useState } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";
import { StoryGrid } from "@/components/story/StoryGrid";
import { StoryDetail } from "@/components/story/StoryDetail";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { TopMenu } from "@/components/ui/top-menu";

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
  const [currentView, setCurrentView] = useState<'splash' | 'home' | 'story' | 'settings'>('splash');
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

  if (currentView === 'settings') {
    return <SettingsPanel onClose={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen">
      <TopMenu 
        onSettingsClick={() => setCurrentView('settings')}
        onHomeClick={handleBackToHome}
      />
      
      <div className="pt-16 pb-4">
        {currentView === 'home' && (
          <StoryGrid onStorySelect={handleStorySelect} />
        )}
        
        {currentView === 'story' && selectedStory && (
          <StoryDetail story={selectedStory} onBack={handleBackToHome} />
        )}
      </div>
    </div>
  );
};

export default Index;