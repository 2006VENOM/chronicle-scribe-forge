import { useState, useEffect } from "react";
import { Book, ChevronDown, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  story_id: string;
}

interface NavigationProps {
  onChapterSelect?: (chapterId: string) => void;
  onAdminClick?: () => void;
}

export function Navigation({ onChapterSelect, onAdminClick }: NavigationProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setStories(data);
        setCurrentStory(data[0]);
        loadChapters(data[0].id);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const loadChapters = async (storyId: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleStoryChange = (story: Story) => {
    setCurrentStory(story);
    loadChapters(story.id);
  };

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-primary story-link">
              Story Chronicle
            </span>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center gap-4">
            {/* Home */}
            <Button variant="ghost" size="sm" className="story-link">
              Home
            </Button>

            {/* Chapters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="story-link">
                  Chapters
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Story Selection */}
                {stories.length > 1 && (
                  <>
                    <div className="px-3 py-2 text-sm font-semibold text-primary border-b">
                      Select Story
                    </div>
                    {stories.map((story) => (
                      <DropdownMenuItem 
                        key={story.id}
                        onClick={() => handleStoryChange(story)}
                        className={currentStory?.id === story.id ? "bg-accent/50" : ""}
                      >
                        {story.title}
                      </DropdownMenuItem>
                    ))}
                    <div className="border-t my-1" />
                  </>
                )}
                
                {/* Chapter Selection */}
                <div className="px-3 py-2 text-sm font-semibold text-primary">
                  Chapters
                </div>
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <DropdownMenuItem 
                      key={chapter.id}
                      onClick={() => onChapterSelect?.(chapter.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          Chapter {chapter.chapter_number}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {chapter.title}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No chapters available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search (placeholder) */}
            <Button variant="ghost" size="sm" disabled className="story-link">
              <Search className="h-4 w-4" />
            </Button>

            {/* Admin Access */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAdminClick}
              className="story-link"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}