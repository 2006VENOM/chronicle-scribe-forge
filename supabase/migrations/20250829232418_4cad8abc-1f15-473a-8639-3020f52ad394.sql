-- Add cover image and ratings to stories table
ALTER TABLE public.stories ADD COLUMN cover_image_url TEXT;
ALTER TABLE public.stories ADD COLUMN fake_reads INTEGER DEFAULT floor(random() * 1000 + 100);
ALTER TABLE public.stories ADD COLUMN fake_likes INTEGER DEFAULT floor(random() * 500 + 50);
ALTER TABLE public.stories ADD COLUMN fake_comments INTEGER DEFAULT floor(random() * 200 + 20);

-- Update existing stories with fake ratings if any exist
UPDATE public.stories 
SET fake_reads = floor(random() * 1000 + 100),
    fake_likes = floor(random() * 500 + 50),
    fake_comments = floor(random() * 200 + 20)
WHERE fake_reads IS NULL;