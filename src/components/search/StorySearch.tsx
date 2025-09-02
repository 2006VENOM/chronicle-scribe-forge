import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Heart, MessageCircle, Eye } from "lucide-react";

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

export const StorySearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadStories();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = stories.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Sort alphabetically like TikTok
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      setFilteredStories(filtered);
      
      // Generate suggestions
      const titleSuggestions = stories
        .filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(story => story.title)
        .slice(0, 5);
      setSuggestions(titleSuggestions);
    } else {
      setFilteredStories([]);
      setSuggestions([]);
    }
  }, [searchTerm, stories]);

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
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      saveSearch(term);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Suggestions</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!searchTerm && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
              <Button 
                onClick={clearRecentSearches}
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div className="p-4">
            <h3 className="text-sm font-medium mb-4 text-muted-foreground">
              {filteredStories.length} result{filteredStories.length !== 1 ? 's' : ''} for "{searchTerm}"
            </h3>
            
            {filteredStories.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredStories.map((story) => (
                  <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Cover Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {story.cover_image_url ? (
                            <img 
                              src={story.cover_image_url} 
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Story Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate mb-1">{story.title}</h3>
                          {story.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {story.description}
                            </p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{story.fake_reads}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{story.fake_likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{story.fake_comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No stories found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}

        {/* No search term */}
        {!searchTerm && recentSearches.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Search for stories by title or description</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};