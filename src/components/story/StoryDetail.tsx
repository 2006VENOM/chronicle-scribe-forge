import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  story_id: string;
}

interface Page {
  id: string;
  title: string;
  content: string;
  page_number: number;
  chapter_id: string;
  image_url?: string;
}

interface StoryDetailProps {
  story: Story;
  onBack: () => void;
}

export const StoryDetail = ({ story, onBack }: StoryDetailProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState("1");
  const [animatedText, setAnimatedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Reading progress
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    loadChapters();
  }, [story.id]);

  useEffect(() => {
    if (currentPage) {
      animateText();
    }
  }, [currentPage, readingSpeed]);

  const loadChapters = async () => {
    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', story.id)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;
      
      setChapters(chaptersData || []);
      
      if (chaptersData && chaptersData.length > 0) {
        await loadPagesForChapter(chaptersData[0].id);
        setCurrentChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPagesForChapter = async (chapterId: string) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      
      setPages(data || []);
      if (data && data.length > 0) {
        setCurrentPage(data[0]);
        loadPageData(data[0].id);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const loadPageData = async (pageId: string) => {
    // Load likes and comments for the current page
    try {
      const [likesResponse, commentsResponse] = await Promise.all([
        supabase.from('page_likes').select('*').eq('page_id', pageId),
        supabase.from('page_comments').select('*').eq('page_id', pageId).order('created_at', { ascending: false })
      ]);

      setLikes(likesResponse.data?.length || 0);
      setComments(commentsResponse.data || []);
      
      // Check if user has liked (using localStorage for session tracking)
      const userSession = getUserSession();
      const userLike = likesResponse.data?.find(like => like.user_session === userSession);
      setHasLiked(!!userLike);
    } catch (error) {
      console.error('Error loading page data:', error);
    }
  };

  const getUserSession = () => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session', session);
    }
    return session;
  };

  const animateText = () => {
    if (!currentPage?.content) return;
    
    setIsAnimating(true);
    setAnimatedText("");
    
    const content = processContentWithImages(currentPage.content);
    const speed = parseFloat(readingSpeed);
    const baseDelay = 50 / speed; // Base delay between characters
    
    let index = 0;
    const animate = () => {
      if (index < content.length) {
        setAnimatedText(content.slice(0, index + 1));
        index++;
        setTimeout(animate, baseDelay);
      } else {
        setIsAnimating(false);
      }
    };
    
    animate();
  };

  const processContentWithImages = (content: string) => {
    // Process image links in content - convert URLs to img tags
    return content.replace(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi, 
      '<img src="$1" alt="Story image" class="w-full rounded-lg my-4 shadow-lg" />');
  };

  const handleLike = async () => {
    if (!currentPage) return;
    
    const userSession = getUserSession();
    
    try {
      if (hasLiked) {
        await supabase
          .from('page_likes')
          .delete()
          .eq('page_id', currentPage.id)
          .eq('user_session', userSession);
        
        setLikes(likes - 1);
        setHasLiked(false);
      } else {
        await supabase
          .from('page_likes')
          .insert({ page_id: currentPage.id, user_session: userSession });
        
        setLikes(likes + 1);
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPage || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('page_comments')
        .insert({
          page_id: currentPage.id,
          user_name: 'Reader',
          content: newComment.trim()
        })
        .select();

      if (error) throw error;

      setComments([data[0], ...comments]);
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const navigateToPage = (direction: 'next' | 'prev') => {
    if (!currentPage || !pages) return;

    const currentIndex = pages.findIndex(p => p.id === currentPage.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < pages.length) {
      const nextPage = pages[nextIndex];
      setCurrentPage(nextPage);
      loadPageData(nextPage.id);
    } else {
      // Navigate to next/prev chapter
      const currentChapterIndex = chapters.findIndex(c => c.id === currentChapter?.id);
      const nextChapterIndex = direction === 'next' ? currentChapterIndex + 1 : currentChapterIndex - 1;
      
      if (nextChapterIndex >= 0 && nextChapterIndex < chapters.length) {
        const nextChapter = chapters[nextChapterIndex];
        setCurrentChapter(nextChapter);
        loadPagesForChapter(nextChapter.id);
      }
    }
  };

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8">
          <div className="animate-pulse text-center">
            <div className="text-xl text-foreground">Loading Story...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8 text-center">
          <h3 className="text-xl text-foreground mb-4">No pages available</h3>
          <Button onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-panel p-4 mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stories
          </Button>
          
          <div className="flex items-center gap-4">
            <Select value={readingSpeed} onValueChange={setReadingSpeed}>
              <SelectTrigger className="w-24 bg-background/50 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="2.5">2.5x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Story Title & Chapter Info */}
        <div className="glass-panel p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{story.title}</h1>
          {currentChapter && (
            <h2 className="text-xl text-muted-foreground mb-4">
              Chapter {currentChapter.chapter_number}: {currentChapter.title}
            </h2>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {estimateReadingTime(currentPage.content)} min read
            </div>
            <Badge variant="secondary">
              Page {currentPage.page_number} of {pages.length}
            </Badge>
          </div>
        </div>

        {/* Page Content */}
        <Card className="glass-panel mb-6">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">{currentPage.title}</h3>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="story-content text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: isAnimating ? animatedText : processContentWithImages(currentPage.content)
                }}
              />
            </AnimatePresence>

            {currentPage.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-6"
              >
                <img 
                  src={currentPage.image_url} 
                  alt="Story illustration" 
                  className="w-full rounded-lg shadow-lg"
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Navigation & Interactions */}
        <div className="glass-panel p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigateToPage('prev')}
              disabled={pages.indexOf(currentPage) === 0 && chapters.indexOf(currentChapter!) === 0}
              className="text-white"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant={hasLiked ? "default" : "ghost"}
                onClick={handleLike}
                className={`like-button ${hasLiked ? 'text-red-500' : 'text-white'}`}
              >
                <Heart className={`mr-2 h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                {likes}
              </Button>

              <Button variant="ghost" className="text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                {comments.length}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigateToPage('next')}
              disabled={pages.indexOf(currentPage) === pages.length - 1 && chapters.indexOf(currentChapter!) === chapters.length - 1}
              className="text-white"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass-panel p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Comments</h4>
          
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-background/50 border border-white/20 rounded-lg text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" disabled={!newComment.trim()}>
                Post
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-primary pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-foreground">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};