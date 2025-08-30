import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageSquare, User, Plus, Minus, Settings2, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface Page {
  id: string;
  page_number: number;
  title: string;
  content: string;
  image_url?: string;
  chapter_id: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  story_id: string;
}

interface Story {
  id: string;
  title: string;
  description: string;
}

interface PageLike {
  id: string;
  page_id: string;
  user_session: string;
}

interface PageComment {
  id: string;
  page_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id?: string;
  likes?: number;
  isLiked?: boolean;
  replies?: PageComment[];
}

export function StoryReader() {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<PageComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [textSize, setTextSize] = useState(16);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const getUserSession = () => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session', session);
    }
    return session;
  };

  useEffect(() => {
    loadLatestPage();
  }, []);

  const loadLatestPage = async () => {
    try {
      setLoading(true);
      
      // Get the latest page across all stories
      const { data: pages, error } = await supabase
        .from('pages')
        .select(`
          *,
          chapters:chapter_id (
            *,
            stories:story_id (*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (pages && pages.length > 0) {
        const page = pages[0];
        setCurrentPage(page);
        setCurrentChapter(page.chapters);
        setCurrentStory(page.chapters.stories);
        
        await loadPageData(page.id);
      }
    } catch (error) {
      console.error('Error loading latest page:', error);
      toast({
        title: "Error",
        description: "Failed to load story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPageData = async (pageId: string) => {
    await Promise.all([
      loadLikes(pageId),
      loadComments(pageId)
    ]);
  };

  const loadLikes = async (pageId: string) => {
    try {
      const { count, error } = await supabase
        .from('page_likes')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', pageId);

      if (error) throw error;
      setLikes(count || 0);

      // Check if current user has liked
      const userSession = getUserSession();
      const { data, error: checkError } = await supabase
        .from('page_likes')
        .select('id')
        .eq('page_id', pageId)
        .eq('user_session', userSession);

      if (checkError) throw checkError;
      setIsLiked(data && data.length > 0);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const loadComments = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('page_comments')
        .select('*')
        .eq('page_id', pageId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const commentsWithExtras = await Promise.all((data || []).map(async (comment) => {
        const [likesData, repliesData] = await Promise.all([
          loadCommentLikes(comment.id),
          loadCommentReplies(comment.id)
        ]);
        
        return {
          ...comment,
          likes: likesData.count,
          isLiked: likesData.isLiked,
          replies: repliesData
        };
      }));
      
      setComments(commentsWithExtras);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadCommentLikes = async (commentId: string) => {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (error) throw error;

      const userSession = getUserSession();
      const { data, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_session', userSession);

      if (checkError) throw checkError;
      
      return { count: count || 0, isLiked: data && data.length > 0 };
    } catch (error) {
      console.error('Error loading comment likes:', error);
      return { count: 0, isLiked: false };
    }
  };

  const loadCommentReplies = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('page_comments')
        .select('*')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const repliesWithExtras = await Promise.all((data || []).map(async (reply) => {
        const likesData = await loadCommentLikes(reply.id);
        return {
          ...reply,
          likes: likesData.count,
          isLiked: likesData.isLiked
        };
      }));
      
      return repliesWithExtras;
    } catch (error) {
      console.error('Error loading replies:', error);
      return [];
    }
  };

  const handleLike = async () => {
    if (!currentPage) return;
    
    const userSession = getUserSession();
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('page_likes')
          .delete()
          .eq('page_id', currentPage.id)
          .eq('user_session', userSession);

        if (error) throw error;
        
        setIsLiked(false);
        setLikes(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('page_likes')
          .insert({
            page_id: currentPage.id,
            user_session: userSession
          });

        if (error) throw error;
        
        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPage || !newComment.trim() || !commenterName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('page_comments')
        .insert({
          page_id: currentPage.id,
          user_name: commenterName.trim(),
          content: newComment.trim(),
          parent_comment_id: replyingTo
        })
        .select();

      if (error) throw error;

      if (data) {
        setNewComment("");
        setReplyingTo(null);
        await loadComments(currentPage.id); // Reload to get updated structure
        toast({
          title: replyingTo ? "Reply Added" : "Comment Added",
          description: `Your ${replyingTo ? 'reply' : 'comment'} has been posted successfully.`
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCommentLike = async (commentId: string) => {
    const userSession = getUserSession();
    
    try {
      const comment = findCommentById(commentId, comments);
      if (!comment) return;

      if (comment.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_session', userSession);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_session: userSession
          });

        if (error) throw error;
      }
      
      // Reload comments to update like counts
      if (currentPage) {
        await loadComments(currentPage.id);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const findCommentById = (id: string, commentList: PageComment[]): PageComment | null => {
    for (const comment of commentList) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = findCommentById(id, comment.replies);
        if (found) return found;
      }
    }
    return null;
  };

  const navigateToPage = async (direction: 'prev' | 'next') => {
    if (!currentPage || !currentChapter) return;

    try {
      setLoading(true);
      
      const targetPageNumber = direction === 'next' 
        ? currentPage.page_number + 1 
        : currentPage.page_number - 1;

      // First try to find page in current chapter
      let { data: page, error } = await supabase
        .from('pages')
        .select(`
          *,
          chapters:chapter_id (
            *,
            stories:story_id (*)
          )
        `)
        .eq('chapter_id', currentChapter.id)
        .eq('page_number', targetPageNumber)
        .single();

      if (error || !page) {
        // If no page found in current chapter, try next/prev chapter
        const targetChapterNumber = direction === 'next' 
          ? currentChapter.chapter_number + 1 
          : currentChapter.chapter_number - 1;

        const { data: nextChapter, error: chapterError } = await supabase
          .from('chapters')
          .select('id')
          .eq('story_id', currentChapter.story_id)
          .eq('chapter_number', targetChapterNumber)
          .single();

        if (chapterError || !nextChapter) {
          toast({
            title: "End of Story",
            description: direction === 'next' ? "No more pages available." : "This is the first page.",
          });
          return;
        }

        // Get first/last page of next/prev chapter
        const pageNumber = direction === 'next' ? 1 : 999; // We'll order and limit to get the last page
        const { data: chapterPage, error: pageError } = await supabase
          .from('pages')
          .select(`
            *,
            chapters:chapter_id (
              *,
              stories:story_id (*)
            )
          `)
          .eq('chapter_id', nextChapter.id)
          .order('page_number', { ascending: direction === 'next' })
          .limit(1);

        if (pageError || !chapterPage || chapterPage.length === 0) {
          toast({
            title: "No Pages Found",
            description: "No pages available in the target chapter.",
          });
          return;
        }

        page = chapterPage[0];
      }

      setCurrentPage(page);
      setCurrentChapter(page.chapters);
      setCurrentStory(page.chapters.stories);
      
      await loadPageData(page.id);
      
    } catch (error) {
      console.error('Error navigating:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-literary">
        <div className="text-center">
          <div className="animate-scale-in">
            <h2 className="text-2xl font-semibold text-primary mb-2">Loading Story...</h2>
            <p className="text-muted-foreground">Please wait while we prepare your reading experience</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPage || !currentChapter || !currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-literary">
        <Card className="p-8 text-center story-shadow">
          <h2 className="text-2xl font-semibold text-primary mb-2">No Stories Available</h2>
          <p className="text-muted-foreground">Check back soon for new stories to read!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-literary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Story Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="story-title text-3xl md:text-4xl text-primary mb-2">
            {currentStory.title}
          </h1>
          <p className="text-muted-foreground mb-4">
            Chapter {currentChapter.chapter_number}: {currentChapter.title}
          </p>
          <p className="text-sm text-muted-foreground">
            Page {currentPage.page_number}
          </p>
        </div>

        {/* Reading Controls */}
        <Card className="p-6 mb-8 story-shadow">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Speed:</span>
              <div className="flex items-center gap-2">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    size="sm"
                    variant={readingSpeed === speed ? "default" : "outline"}
                    onClick={() => setReadingSpeed(speed)}
                    className="text-xs px-2 py-1"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Text Size:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTextSize(Math.max(12, textSize - 2))}
                disabled={textSize <= 12}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm min-w-[3rem] text-center">{textSize}px</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTextSize(Math.min(24, textSize + 2))}
                disabled={textSize >= 24}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Card className="p-8 md:p-12 mb-8 story-shadow animate-scale-in">
          <h2 className="story-title text-2xl md:text-3xl text-black mb-6">
            {currentPage.title}
          </h2>
          
          {currentPage.image_url && (
            <div className="mb-6">
              <img 
                src={currentPage.image_url} 
                alt={currentPage.title}
                className="w-full rounded-lg shadow-md"
              />
            </div>
          )}
          
          <div 
            className="story-content text-black leading-relaxed"
            style={{ 
              fontSize: `${textSize}px`,
              animationDuration: `${3 / readingSpeed}s`
            }}
          >
            {currentPage.content}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigateToPage('prev')}
            disabled={loading}
            className="page-transition"
          >
            <span className="mr-2 text-lg">⬅️</span>
            Previous
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigateToPage('next')}
            disabled={loading}
            className="page-transition"
          >
            Next
            <span className="ml-2 text-lg">➡️</span>
          </Button>
        </div>

        {/* Interactions */}
        <Card className="p-6 story-shadow">
          {/* Likes */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLike}
              className={`like-button ${isLiked ? 'text-accent' : 'text-muted-foreground'}`}
            >
              <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current animate-like-bounce' : ''}`} />
              {likes} {likes === 1 ? 'Like' : 'Likes'}
            </Button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-primary">Comments ({comments.length})</h3>
            </div>

            {/* Add Comment */}
            <form onSubmit={handleComment} className="space-y-3 p-4 bg-secondary/50 rounded-lg">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  <span>Replying to comment</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="h-6 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex gap-3">
                <Input
                  placeholder="Your name"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Textarea
                placeholder={replyingTo ? "Write your reply..." : "Share your thoughts about this page..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={!newComment.trim() || !commenterName.trim()}
              >
                {replyingTo ? 'Post Reply' : 'Post Comment'}
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  onLike={handleCommentLike}
                  onReply={setReplyingTo}
                />
              ))}
              
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const CommentCard = ({ 
  comment, 
  onLike, 
  onReply, 
  depth = 0 
}: { 
  comment: PageComment; 
  onLike: (id: string) => void; 
  onReply: (id: string) => void;
  depth?: number;
}) => {
  return (
    <div className={`animate-fade-in ${depth > 0 ? 'ml-8 border-l-2 border-primary/20 pl-4' : ''}`}>
      <div className="p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-black">{comment.user_name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-black mb-3">{comment.content}</p>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onLike(comment.id)}
            className={`text-xs h-auto py-1 px-2 ${comment.isLiked ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Heart className={`mr-1 h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
            {comment.likes || 0}
          </Button>
          
          {depth < 2 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onReply(comment.id)}
              className="text-xs h-auto py-1 px-2 text-muted-foreground"
            >
              <Reply className="mr-1 h-3 w-3" />
              Reply
            </Button>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard 
              key={reply.id} 
              comment={reply} 
              onLike={onLike}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};