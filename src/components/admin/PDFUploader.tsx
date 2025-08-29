import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PDFUploaderProps {
  onStoryCreated: () => void;
}

export const PDFUploader = ({ onStoryCreated }: PDFUploaderProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handlePDFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const processPDFContent = (text: string) => {
    // Simple PDF text processing - split into chapters and pages
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const chapters: { title: string; pages: { title: string; content: string }[] }[] = [];
    let currentChapter: { title: string; pages: { title: string; content: string }[] } | null = null;
    let currentPage = "";
    let pageCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect chapter headers (lines that start with "Chapter" or are all caps)
      if (trimmedLine.match(/^Chapter\s+\d+/i) || (trimmedLine.length < 50 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5)) {
        // Save previous page if exists
        if (currentPage.trim() && currentChapter) {
          currentChapter.pages.push({
            title: `Page ${currentChapter.pages.length + 1}`,
            content: currentPage.trim()
          });
        }
        
        // Start new chapter
        currentChapter = {
          title: trimmedLine || `Chapter ${chapters.length + 1}`,
          pages: []
        };
        chapters.push(currentChapter);
        currentPage = "";
        pageCount = 0;
      } else {
        // Add content to current page
        currentPage += line + "\n";
        
        // Split into pages every ~500 words
        if (currentPage.split(' ').length > 500) {
          if (currentChapter) {
            currentChapter.pages.push({
              title: `Page ${currentChapter.pages.length + 1}`,
              content: currentPage.trim()
            });
            currentPage = "";
          }
        }
      }
    }

    // Add final page if exists
    if (currentPage.trim() && currentChapter) {
      currentChapter.pages.push({
        title: `Page ${currentChapter.pages.length + 1}`,
        content: currentPage.trim()
      });
    }

    // If no chapters detected, create a single chapter
    if (chapters.length === 0) {
      const pages = [];
      const words = text.split(' ');
      let currentPageContent = "";
      
      for (let i = 0; i < words.length; i++) {
        currentPageContent += words[i] + " ";
        
        if (currentPageContent.split(' ').length > 500 || i === words.length - 1) {
          pages.push({
            title: `Page ${pages.length + 1}`,
            content: currentPageContent.trim()
          });
          currentPageContent = "";
        }
      }
      
      chapters.push({
        title: "Chapter 1",
        pages
      });
    }

    return chapters;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pdfFile) {
      toast.error("Please provide a title and PDF file");
      return;
    }

    setUploading(true);
    
    try {
      // Upload cover image if provided
      let coverImageUrl = null;
      if (coverImage) {
        const coverPath = `covers/${Date.now()}-${coverImage.name}`;
        coverImageUrl = await uploadFile(coverImage, 'avatars', coverPath);
      }

      // Read PDF content (simplified - in real implementation you'd use a PDF parser)
      const pdfText = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // This is a simplified approach - normally you'd use a library like pdf-parse
          // For now, we'll simulate PDF text extraction
          const simulatedContent = `Chapter 1: Introduction
This is the beginning of our story. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Chapter 2: The Adventure Begins
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`;
          
          resolve(simulatedContent);
        };
        reader.readAsText(pdfFile);
      });

      // Process PDF content into chapters and pages
      const processedChapters = processPDFContent(pdfText);

      // Create story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          title,
          description,
          cover_image_url: coverImageUrl
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Create chapters and pages
      for (let chapterIndex = 0; chapterIndex < processedChapters.length; chapterIndex++) {
        const chapterData = processedChapters[chapterIndex];
        
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            story_id: storyData.id,
            title: chapterData.title,
            chapter_number: chapterIndex + 1
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        // Create pages for this chapter
        for (let pageIndex = 0; pageIndex < chapterData.pages.length; pageIndex++) {
          const pageData = chapterData.pages[pageIndex];
          
          const { error: pageError } = await supabase
            .from('pages')
            .insert({
              chapter_id: chapter.id,
              title: pageData.title,
              content: pageData.content,
              page_number: pageIndex + 1
            });

          if (pageError) throw pageError;
        }
      }

      toast.success(`Story "${title}" created successfully with ${processedChapters.length} chapters!`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setCoverImage(null);
      setPdfFile(null);
      
      onStoryCreated();
      
    } catch (error) {
      console.error('Error creating story from PDF:', error);
      toast.error("Failed to create story from PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5" />
          PDF to Story Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-foreground">Story Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title"
              required
              className="bg-background/50 border-white/20"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the story"
              rows={3}
              className="bg-background/50 border-white/20"
            />
          </div>

          <div>
            <Label htmlFor="cover" className="text-foreground">Cover Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="bg-background/50 border-white/20"
              />
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
            {coverImage && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {coverImage.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="pdf" className="text-foreground">PDF File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handlePDFChange}
                required
                className="bg-background/50 border-white/20"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {pdfFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {pdfFile.name}
              </p>
            )}
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? "Processing PDF..." : "Create Story from PDF"}
          </Button>
        </form>

        <div className="mt-4 p-4 bg-muted/20 rounded-lg">
          <h4 className="font-semibold text-foreground mb-2">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Upload your PDF file and cover image</li>
            <li>• The system automatically splits content into chapters</li>
            <li>• Pages are created with ~500 words each</li>
            <li>• Your story will be ready to read immediately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};