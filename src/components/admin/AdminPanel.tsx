import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Eye, Trash2, Upload, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PDFUploader } from "./PDFUploader";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  created_at: string;
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

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentView, setCurrentView] = useState<'stories' | 'chapters' | 'pages' | 'add-story' | 'add-chapter' | 'add-page' | 'preview' | 'pdf-upload'>('stories');
  
  const [stories, setStories] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);
  
  // Form states
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDescription, setNewStoryDescription] = useState("");
  const [newStoryCover, setNewStoryCover] = useState<File | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageContent, setNewPageContent] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadStories();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "@Mickloving2006") {
      setIsAuthenticated(true);
      toast.success("Admin access granted!");
    } else {
      toast.error("Invalid password");
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
      toast.error("Failed to load stories");
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
      toast.error("Failed to load chapters");
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
      toast.error("Failed to load pages");
    }
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    const filePath = `covers/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const createStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle) return;

    try {
      let coverImageUrl = null;
      if (newStoryCover) {
        coverImageUrl = await uploadCoverImage(newStoryCover);
      }

      const { error } = await supabase
        .from('stories')
        .insert({
          title: newStoryTitle,
          description: newStoryDescription,
          cover_image_url: coverImageUrl
        });

      if (error) throw error;

      toast.success("Story created successfully!");
      setNewStoryTitle("");
      setNewStoryDescription("");
      setNewStoryCover(null);
      setCurrentView('stories');
      loadStories();
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error("Failed to create story");
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this entire story? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast.success("Story deleted successfully!");
      loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error("Failed to delete story");
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter and all its pages? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      toast.success("Chapter deleted successfully!");
      if (selectedStory) {
        loadChapters(selectedStory.id);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error("Failed to delete chapter");
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast.success("Page deleted successfully!");
      if (selectedChapter) {
        loadPages(selectedChapter.id);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error("Failed to delete page");
    }
  };

  const createChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle || !selectedStory) return;

    try {
      const nextChapterNumber = chapters.length + 1;
      
      const { error } = await supabase
        .from('chapters')
        .insert({
          story_id: selectedStory.id,
          title: newChapterTitle,
          chapter_number: nextChapterNumber
        });

      if (error) throw error;

      toast.success("Chapter created successfully!");
      setNewChapterTitle("");
      setCurrentView('chapters');
      loadChapters(selectedStory.id);
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error("Failed to create chapter");
    }
  };

  const createPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle || !newPageContent || !selectedChapter) return;

    try {
      const nextPageNumber = pages.length + 1;
      
      const { error } = await supabase
        .from('pages')
        .insert({
          chapter_id: selectedChapter.id,
          title: newPageTitle,
          content: newPageContent,
          page_number: nextPageNumber
        });

      if (error) throw error;

      toast.success("Page created successfully!");
      setNewPageTitle("");
      setNewPageContent("");
      setCurrentView('pages');
      loadPages(selectedChapter.id);
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error("Failed to create page");
    }
  };

  const handlePreview = (page: Page) => {
    setPreviewPage(page);
    setCurrentView('preview');
  };

  const processContentWithImages = (content: string) => {
    return content.replace(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi, 
      '<img src="$1" alt="Story image" class="w-full rounded-lg my-4 shadow-lg" />');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="bg-background/50 border-white/20"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-panel p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose} className="text-white">
              <X className="h-4 w-4 mr-2" />
              Close Admin
            </Button>
            
            {currentView !== 'stories' && (
              <Button variant="ghost" onClick={() => {
                if (currentView === 'chapters') setCurrentView('stories');
                else if (currentView === 'pages') setCurrentView('chapters');
                else setCurrentView('stories');
              }} className="text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>

        {/* Main Content */}
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="space-y-6">
          <TabsList className="glass-panel grid w-full grid-cols-4 p-1">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="add-story">Add Story</TabsTrigger>
            <TabsTrigger value="pdf-upload">PDF Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewPage}>Preview</TabsTrigger>
          </TabsList>

          {/* Stories List */}
          <TabsContent value="stories">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground">Manage Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg border-white/20">
                      <div className="flex items-center gap-4">
                        {story.cover_image_url && (
                          <img 
                            src={story.cover_image_url} 
                            alt={story.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{story.title}</h3>
                          <p className="text-sm text-muted-foreground">{story.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStory(story);
                            loadChapters(story.id);
                            setCurrentView('chapters');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteStory(story.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {stories.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No stories yet. Create your first story!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Story */}
          <TabsContent value="add-story">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground">Create New Story</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createStory} className="space-y-4">
                  <div>
                    <Label htmlFor="story-title" className="text-foreground">Story Title *</Label>
                    <Input
                      id="story-title"
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                      placeholder="Enter story title"
                      className="bg-background/50 border-white/20"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="story-description" className="text-foreground">Description</Label>
                    <Textarea
                      id="story-description"
                      value={newStoryDescription}
                      onChange={(e) => setNewStoryDescription(e.target.value)}
                      placeholder="Brief description of the story"
                      rows={3}
                      className="bg-background/50 border-white/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="story-cover" className="text-foreground">Cover Image</Label>
                    <Input
                      id="story-cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewStoryCover(e.target.files?.[0] || null)}
                      className="bg-background/50 border-white/20"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create Story
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDF Upload */}
          <TabsContent value="pdf-upload">
            <PDFUploader onStoryCreated={() => {
              loadStories();
              setCurrentView('stories');
            }} />
          </TabsContent>

          {/* Chapters Management */}
          <TabsContent value="chapters">
            {selectedStory && (
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Chapters for "{selectedStory.title}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => setCurrentView('add-chapter')}
                      className="mb-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter
                    </Button>

                     {chapters.map((chapter) => (
                       <div key={chapter.id} className="flex items-center justify-between p-4 border rounded-lg border-white/20">
                         <div>
                           <h3 className="font-semibold text-foreground">
                             Chapter {chapter.chapter_number}: {chapter.title}
                           </h3>
                         </div>
                         <div className="flex gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedChapter(chapter);
                               loadPages(chapter.id);
                               setCurrentView('pages');
                             }}
                           >
                             <Eye className="h-4 w-4 mr-2" />
                             Manage Pages
                           </Button>
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => deleteChapter(chapter.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Chapter */}
          <TabsContent value="add-chapter">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground">Add New Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createChapter} className="space-y-4">
                  <div>
                    <Label htmlFor="chapter-title" className="text-foreground">Chapter Title *</Label>
                    <Input
                      id="chapter-title"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="Enter chapter title"
                      className="bg-background/50 border-white/20"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create Chapter
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Management */}
          <TabsContent value="pages">
            {selectedChapter && (
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Pages for "{selectedChapter.title}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => setCurrentView('add-page')}
                      className="mb-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Page
                    </Button>

                     {pages.map((page) => (
                       <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg border-white/20">
                         <div>
                           <h3 className="font-semibold text-foreground">
                             Page {page.page_number}: {page.title}
                           </h3>
                           <p className="text-sm text-muted-foreground line-clamp-2">
                             {page.content.slice(0, 100)}...
                           </p>
                         </div>
                         <div className="flex gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handlePreview(page)}
                           >
                             <Eye className="h-4 w-4 mr-2" />
                             Preview
                           </Button>
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => deletePage(page.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Page */}
          <TabsContent value="add-page">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground">Add New Page</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createPage} className="space-y-4">
                  <div>
                    <Label htmlFor="page-title" className="text-foreground">Page Title *</Label>
                    <Input
                      id="page-title"
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      placeholder="Enter page title"
                      className="bg-background/50 border-white/20"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="page-content" className="text-foreground">Content *</Label>
                    <Textarea
                      id="page-content"
                      value={newPageContent}
                      onChange={(e) => setNewPageContent(e.target.value)}
                      placeholder="Enter page content (paste image URLs directly in text to embed images)"
                      rows={8}
                      className="bg-background/50 border-white/20"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tip: Paste image URLs directly in your text to embed images inline
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Page
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            {previewPage && (
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-foreground">Page Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">{previewPage.title}</h2>
                    <div 
                      className="story-content text-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: processContentWithImages(previewPage.content)
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};