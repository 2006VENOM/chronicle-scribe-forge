-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, chapter_number)
);

-- Create pages table
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, page_number)
);

-- Create page_likes table
CREATE TABLE public.page_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_session)
);

-- Create page_comments table
CREATE TABLE public.page_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (stories are public)
CREATE POLICY "Everyone can read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Everyone can read chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Everyone can read pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Everyone can read page_likes" ON public.page_likes FOR SELECT USING (true);
CREATE POLICY "Everyone can read page_comments" ON public.page_comments FOR SELECT USING (true);

-- Create policies for likes and comments (users can create)
CREATE POLICY "Users can create likes" ON public.page_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create comments" ON public.page_comments FOR INSERT WITH CHECK (true);

-- Create admin policies (we'll use a simple session-based approach for admin)
-- For now, we'll handle admin authentication in the frontend

-- Create indexes for better performance
CREATE INDEX idx_chapters_story_id ON public.chapters(story_id);
CREATE INDEX idx_pages_chapter_id ON public.pages(chapter_id);
CREATE INDEX idx_page_likes_page_id ON public.page_likes(page_id);
CREATE INDEX idx_page_comments_page_id ON public.page_comments(page_id);
CREATE INDEX idx_page_comments_created_at ON public.page_comments(created_at DESC);

-- Create triggers for updating timestamps
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for development
INSERT INTO public.stories (title, description) VALUES 
('The Chronicles of Time', 'A captivating tale of adventure through different eras');

INSERT INTO public.chapters (story_id, chapter_number, title) VALUES 
((SELECT id FROM public.stories WHERE title = 'The Chronicles of Time'), 1, 'The Beginning');

INSERT INTO public.pages (chapter_id, page_number, title, content) VALUES 
((SELECT id FROM public.chapters WHERE chapter_number = 1), 1, 'A New Dawn', 'The morning sun cast long shadows across the ancient stones, marking the beginning of an extraordinary journey that would change everything. Sarah stepped through the mist, her heart pounding with anticipation of what lay ahead in this mysterious realm where time itself seemed to bend and flow like water.');