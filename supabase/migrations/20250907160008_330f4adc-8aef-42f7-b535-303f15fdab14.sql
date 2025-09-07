-- Add story likes and comments tables
-- Create story_likes table
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_session TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_session)
);

-- Create story_comments table
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_comment_id UUID REFERENCES public.story_comments(id)
);

-- Enable RLS for story_likes
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for story_likes
CREATE POLICY "Everyone can read story likes" ON public.story_likes
FOR SELECT USING (true);

CREATE POLICY "Users can create story likes" ON public.story_likes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own story likes" ON public.story_likes
FOR DELETE USING (true);

-- Enable RLS for story_comments
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for story_comments
CREATE POLICY "Everyone can read story comments" ON public.story_comments
FOR SELECT USING (true);

CREATE POLICY "Users can create story comments" ON public.story_comments
FOR INSERT WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX idx_story_comments_story_id ON public.story_comments(story_id);
CREATE INDEX idx_story_comments_parent ON public.story_comments(parent_comment_id);

-- Add is_pinned column to stories table for auto-generated stories
ALTER TABLE public.stories ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- Add auto_generated column to track AI-generated stories
ALTER TABLE public.stories ADD COLUMN auto_generated BOOLEAN DEFAULT false;