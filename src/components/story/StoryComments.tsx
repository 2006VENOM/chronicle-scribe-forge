import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id?: string;
}

interface StoryCommentsProps {
  storyId: string;
  initialComments?: number;
}

export const StoryComments = ({ storyId, initialComments = 0 }: StoryCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  // Get or set user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('user_name');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, storyId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data || []);
      setCommentsCount((data?.length || 0) + initialComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !userName.trim()) {
      toast.error('Please enter both your name and comment');
      return;
    }

    setLoading(true);
    try {
      // Save user name to localStorage
      localStorage.setItem('user_name', userName);

      const { error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_name: userName.trim(),
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      toast.success('Comment added!');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {commentsCount.toLocaleString()} {commentsCount === 1 ? 'comment' : 'comments'}
      </Button>

      {showComments && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment Form */}
            <div className="space-y-3 p-4 bg-background/20 rounded-lg">
              <Input
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-background/50 border-white/20"
              />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-background/50 border-white/20 min-h-[80px]"
                />
                <Button
                  onClick={submitComment}
                  disabled={loading || !newComment.trim() || !userName.trim()}
                  size="sm"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-background/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {comment.user_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};