import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, ChevronRight, Book } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoryLikes } from "./StoryLikes";
import { StoryComments } from "./StoryComments";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  fake_reads: number;
  fake_likes: number;
  fake_comments: number;
  created_at: string;
  is_pinned?: boolean;
  auto_generated?: boolean;
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
  const [currentView, setCurrentView] = useState<'overview' | 'chapters' | 'pages' | 'reading'>('overview');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'overview') {
      loadChapters();
    }
  }, [currentView, story.id]);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', story.id)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async (chapterId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentView('pages');
    loadPages(chapter.id);
  };

  const handlePageClick = (page: Page) => {
    setSelectedPage(page);
    setCurrentView('reading');
  };

  const processContentWithImages = (content: string) => {
    return content.replace(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi, 
      '<img src="$1" alt="Story image" class="w-full rounded-lg my-4 shadow-lg" />');
  };

  const renderBackButton = () => {
    if (currentView === 'reading') {
      return (
        <Button variant="ghost" onClick={() => setCurrentView('pages')} className="text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pages
        </Button>
      );
    } else if (currentView === 'pages') {
      return (
        <Button variant="ghost" onClick={() => setCurrentView('overview')} className="text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chapters
        </Button>
      );
    } else {
      return (
        <Button variant="ghost" onClick={onBack} className="text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stories
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-xl text-foreground animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {renderBackButton()}

        {currentView === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Story Header */}
            <Card className="glass-panel">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {story.cover_image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-32 h-40 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{story.title}</h1>
                    <p className="text-muted-foreground mb-4">{story.description}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {story.fake_reads.toLocaleString()} reads
                      </div>
                      <StoryLikes storyId={story.id} initialLikes={story.fake_likes} />
                      <StoryComments storyId={story.id} initialComments={story.fake_comments} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapters List */}
            <Card className="glass-panel">
              <CardHeader>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Book className="h-6 w-6" />
                  Chapters ({chapters.length})
                </h2>
              </CardHeader>
              <CardContent>
                {chapters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No chapters available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((chapter, index) => (
                      <Card
                        key={chapter.id}
                        className="glass-panel cursor-pointer hover:bg-white/10 transition-all duration-200 group animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => handleChapterClick(chapter)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                Chapter {chapter.chapter_number}: {chapter.title}
                              </h3>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'pages' && selectedChapter && (
          <div className="space-y-6 animate-fade-in">
            {/* Chapter Header */}
            <Card className="glass-panel">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Chapter {selectedChapter.chapter_number}: {selectedChapter.title}
                </h1>
                <p className="text-muted-foreground">
                  From "{story.title}"
                </p>
              </CardContent>
            </Card>

            {/* Pages List */}
            <Card className="glass-panel">
              <CardHeader>
                <h2 className="text-2xl font-bold text-foreground">
                  Pages ({pages.length})
                </h2>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No pages available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pages.map((page, index) => (
                      <Card
                        key={page.id}
                        className="glass-panel cursor-pointer hover:bg-white/10 transition-all duration-200 group animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => handlePageClick(page)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-2">
                                Page {page.page_number}: {page.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {page.content.slice(0, 150)}...
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors ml-4 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'reading' && selectedPage && (
          <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <Card className="glass-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {selectedPage.title}
                    </h1>
                    <p className="text-muted-foreground">
                      {selectedChapter?.title} • Page {selectedPage.page_number}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Page {selectedPage.page_number} of {pages.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Page Content */}
            <Card className="glass-panel">
              <CardContent className="p-8">
                <div 
                  className="story-content text-foreground leading-relaxed text-lg animate-fade-in"
                  dangerouslySetInnerHTML={{ 
                    __html: processContentWithImages(selectedPage.content)
                  }}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = pages.findIndex(p => p.id === selectedPage.id);
                  if (currentIndex > 0) {
                    handlePageClick(pages[currentIndex - 1]);
                  }
                }}
                disabled={pages.findIndex(p => p.id === selectedPage.id) === 0}
                className="glass-panel"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous Page
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = pages.findIndex(p => p.id === selectedPage.id);
                  if (currentIndex < pages.length - 1) {
                    handlePageClick(pages[currentIndex + 1]);
                  }
                }}
                disabled={pages.findIndex(p => p.id === selectedPage.id) === pages.length - 1}
                className="glass-panel"
              >
                Next Page
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};