import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoryLikesProps {
  storyId: string;
  initialLikes?: number;
}

export const StoryLikes = ({ storyId, initialLikes = 0 }: StoryLikesProps) => {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Generate a session ID for anonymous users
  const [userSession] = useState(() => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('user_session', session);
    }
    return session;
  });

  useEffect(() => {
    loadLikesData();
  }, [storyId]);

  const loadLikesData = async () => {
    try {
      // Get total likes count
      const { data: likesData, error: likesError } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId);

      if (likesError) throw likesError;

      // Check if current user has liked
      const { data: userLike, error: userLikeError } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_session', userSession)
        .single();

      if (userLikeError && userLikeError.code !== 'PGRST116') throw userLikeError;

      setLikesCount((likesData?.length || 0) + initialLikes);
      setIsLiked(!!userLike);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const toggleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_session', userSession);

        if (error) throw error;

        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        toast.success('Like removed');
      } else {
        // Add like
        const { error } = await supabase
          .from('story_likes')
          .insert({
            story_id: storyId,
            user_session: userSession
          });

        if (error) throw error;

        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        toast.success('Story liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={loading}
      className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      {likesCount.toLocaleString()}
    </Button>
  );
};