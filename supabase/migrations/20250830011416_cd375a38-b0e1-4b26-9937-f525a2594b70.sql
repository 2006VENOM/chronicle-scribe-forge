-- Add comment replies and likes tables
ALTER TABLE public.page_comments 
ADD COLUMN parent_comment_id UUID REFERENCES public.page_comments(id) ON DELETE CASCADE;

CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.page_comments(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_session)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for comment_likes
CREATE POLICY "Anyone can view comment likes" 
ON public.comment_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage their own comment likes" 
ON public.comment_likes 
FOR ALL 
USING (true);