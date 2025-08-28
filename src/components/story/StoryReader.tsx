import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
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
          content: newComment.trim()
        })
        .select();

      if (error) throw error;

      if (data) {
        setComments(prev => [data[0], ...prev]);
        setNewComment("");
        toast({
          title: "Comment Added",
          description: "Your comment has been posted successfully."
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

        {/* Main Content */}
        <Card className="p-8 md:p-12 mb-8 story-shadow animate-scale-in">
          <h2 className="story-title text-2xl md:text-3xl text-primary mb-6">
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
          
          <div className="story-content text-foreground leading-relaxed">
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
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigateToPage('next')}
            disabled={loading}
            className="page-transition"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
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
              <div className="flex gap-3">
                <Input
                  placeholder="Your name"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Textarea
                placeholder="Share your thoughts about this page..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={!newComment.trim() || !commenterName.trim()}
              >
                Post Comment
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-card border rounded-lg animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-primary">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
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