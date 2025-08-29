import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface StoryGridProps {
  onStorySelect: (story: Story) => void;
}

export const StoryGrid = ({ onStorySelect }: StoryGridProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    const filtered = stories.filter(story =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStories(filtered);
  }, [stories, searchTerm]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalRating = (story: Story) => {
    return story.fake_reads + story.fake_likes + story.fake_comments;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8">
          <div className="animate-pulse text-center">
            <div className="text-xl text-foreground">Loading Stories...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow-lg">VENOM Stories</h1>
          <p className="text-white/80 text-lg">Discover captivating stories and adventures</p>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-white/20"
            />
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-panel p-8">
              <h3 className="text-xl text-foreground mb-2">
                {searchTerm ? "No stories found" : "No stories available"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Check back later for new stories"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card
                key={story.id}
                className="story-cover glass-panel cursor-pointer group"
                onClick={() => onStorySelect(story)}
              >
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <div className="text-4xl font-bold text-white opacity-50">
                          {story.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    
                    {/* Rating Badge */}
                    <Badge 
                      className="absolute top-2 right-2 bg-accent text-accent-foreground font-semibold"
                    >
                      ⭐ {getTotalRating(story).toLocaleString()}
                    </Badge>
                  </div>

                  {/* Story Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {story.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {story.fake_reads.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {story.fake_likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {story.fake_comments.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};