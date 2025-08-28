import { useState, useEffect } from "react";
import { Lock, Plus, Eye, ArrowLeft, Book, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  title: string;
  description: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  story_id: string;
}

interface Page {
  id: string;
  page_number: number;
  title: string;
  content: string;
  image_url?: string;
  chapter_id: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentView, setCurrentView] = useState<'stories' | 'chapters' | 'pages' | 'add-chapter' | 'add-page' | 'preview'>('stories');
  
  // Data states
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  
  // Form states
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageContent, setNewPageContent] = useState("");
  const [newPageImage, setNewPageImage] = useState("");
  const [previewPage, setPreviewPage] = useState<Partial<Page> | null>(null);
  
  const { toast } = useToast();

  const handleLogin = () => {
    if (password === "@Mickloving2006") {
      setIsAuthenticated(true);
      loadStories();
      toast({
        title: "Welcome Admin",
        description: "You have successfully logged in to the admin panel."
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      toast({
        title: "Error",
        description: "Failed to load stories.",
        variant: "destructive"
      });
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

  const loadPages = async (chapterId: string) => {
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
    }
  };

  const createChapter = async () => {
    if (!selectedStory || !newChapterTitle.trim()) return;

    try {
      const nextChapterNumber = chapters.length + 1;
      
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          story_id: selectedStory.id,
          chapter_number: nextChapterNumber,
          title: newChapterTitle.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setNewChapterTitle("");
      loadChapters(selectedStory.id);
      setCurrentView('chapters');
      
      toast({
        title: "Chapter Created",
        description: `Chapter ${nextChapterNumber}: ${data.title} has been created.`
      });
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast({
        title: "Error",
        description: "Failed to create chapter.",
        variant: "destructive"
      });
    }
  };

  const createPage = async () => {
    if (!selectedChapter || !newPageTitle.trim() || !newPageContent.trim()) return;

    try {
      const nextPageNumber = pages.length + 1;
      
      const { data, error } = await supabase
        .from('pages')
        .insert({
          chapter_id: selectedChapter.id,
          page_number: nextPageNumber,
          title: newPageTitle.trim(),
          content: newPageContent.trim(),
          image_url: newPageImage.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setNewPageTitle("");
      setNewPageContent("");
      setNewPageImage("");
      loadPages(selectedChapter.id);
      setCurrentView('pages');
      
      toast({
        title: "Page Published",
        description: `Page ${nextPageNumber}: ${data.title} has been published.`
      });
    } catch (error) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: "Failed to create page.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = () => {
    if (!newPageTitle.trim() || !newPageContent.trim()) {
      toast({
        title: "Preview Error",
        description: "Please fill in the title and content before previewing.",
        variant: "destructive"
      });
      return;
    }

    const nextPageNumber = pages.length + 1;
    setPreviewPage({
      page_number: nextPageNumber,
      title: newPageTitle.trim(),
      content: newPageContent.trim(),
      image_url: newPageImage.trim() || undefined
    });
    setCurrentView('preview');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-literary">
        <Card className="w-full max-w-md story-shadow">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Back to Story
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-literary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="story-title text-3xl text-primary">Admin Panel</h1>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Story
          </Button>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentView('stories')}
            className={currentView === 'stories' ? 'text-primary' : ''}
          >
            Stories
          </Button>
          {selectedStory && (
            <>
              <span>/</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentView('chapters')}
                className={currentView === 'chapters' ? 'text-primary' : ''}
              >
                {selectedStory.title}
              </Button>
            </>
          )}
          {selectedChapter && (
            <>
              <span>/</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentView('pages')}
                className={currentView === 'pages' ? 'text-primary' : ''}
              >
                Chapter {selectedChapter.chapter_number}
              </Button>
            </>
          )}
        </div>

        {/* Content */}
        {currentView === 'stories' && (
          <div className="space-y-6">
            <Card className="story-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Select a Story to Manage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {stories.map((story) => (
                    <div 
                      key={story.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedStory(story);
                        loadChapters(story.id);
                        setCurrentView('chapters');
                      }}
                    >
                      <h3 className="font-semibold text-primary">{story.title}</h3>
                      <p className="text-sm text-muted-foreground">{story.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'chapters' && selectedStory && (
          <div className="space-y-6">
            <Card className="story-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Chapters in "{selectedStory.title}"</CardTitle>
                <Button onClick={() => setCurrentView('add-chapter')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Chapter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedChapter(chapter);
                        loadPages(chapter.id);
                        setCurrentView('pages');
                      }}
                    >
                      <h3 className="font-semibold text-primary">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No chapters yet. Create your first chapter to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'pages' && selectedChapter && (
          <div className="space-y-6">
            <Card className="story-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Pages in Chapter {selectedChapter.chapter_number}: {selectedChapter.title}
                </CardTitle>
                <Button onClick={() => setCurrentView('add-page')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Next Page
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pages.map((page) => (
                    <div key={page.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-primary">
                        Page {page.page_number}: {page.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {page.content.substring(0, 150)}...
                      </p>
                    </div>
                  ))}
                  {pages.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No pages yet. Add the first page to start this chapter!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'add-chapter' && (
          <Card className="story-shadow">
            <CardHeader>
              <CardTitle>Create New Chapter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chapter-title">Chapter Title</Label>
                <Input
                  id="chapter-title"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Enter chapter title"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be Chapter {chapters.length + 1}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={createChapter} disabled={!newChapterTitle.trim()}>
                  Create Chapter
                </Button>
                <Button variant="outline" onClick={() => setCurrentView('chapters')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentView === 'add-page' && (
          <Card className="story-shadow">
            <CardHeader>
              <CardTitle>Add Next Page (Page {pages.length + 1})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              
              <div>
                <Label htmlFor="page-image">Image URL (Optional)</Label>
                <Input
                  id="page-image"
                  value={newPageImage}
                  onChange={(e) => setNewPageImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="page-content">Page Content</Label>
                <Textarea
                  id="page-content"
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  placeholder="Write your story content here..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePreview} variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  onClick={createPage} 
                  disabled={!newPageTitle.trim() || !newPageContent.trim()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Post Now
                </Button>
                <Button variant="outline" onClick={() => setCurrentView('pages')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentView === 'preview' && previewPage && (
          <div className="space-y-6">
            <Card className="p-8 md:p-12 story-shadow animate-scale-in">
              <h2 className="story-title text-2xl md:text-3xl text-primary mb-6">
                {previewPage.title}
              </h2>
              
              {previewPage.image_url && (
                <div className="mb-6">
                  <img 
                    src={previewPage.image_url} 
                    alt={previewPage.title}
                    className="w-full rounded-lg shadow-md"
                  />
                </div>
              )}
              
              <div className="story-content text-foreground leading-relaxed">
                {previewPage.content}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button onClick={createPage}>
                <FileText className="mr-2 h-4 w-4" />
                Publish Page
              </Button>
              <Button variant="outline" onClick={() => setCurrentView('add-page')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}