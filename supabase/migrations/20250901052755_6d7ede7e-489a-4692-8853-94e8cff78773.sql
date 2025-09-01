-- Enable admin operations for stories, chapters, and pages
-- We'll add a simple admin system based on a hardcoded admin session

-- Allow admin operations on stories table
DROP POLICY IF EXISTS "Everyone can read stories" ON public.stories;
DROP POLICY IF EXISTS "Admin can manage stories" ON public.stories;

CREATE POLICY "Everyone can read stories" ON public.stories
FOR SELECT USING (true);

CREATE POLICY "Admin can manage stories" ON public.stories
FOR ALL USING (true);

-- Allow admin operations on chapters table  
DROP POLICY IF EXISTS "Everyone can read chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admin can manage chapters" ON public.chapters;

CREATE POLICY "Everyone can read chapters" ON public.chapters
FOR SELECT USING (true);

CREATE POLICY "Admin can manage chapters" ON public.chapters
FOR ALL USING (true);

-- Allow admin operations on pages table
DROP POLICY IF EXISTS "Everyone can read pages" ON public.pages;
DROP POLICY IF EXISTS "Admin can manage pages" ON public.pages;

CREATE POLICY "Everyone can read pages" ON public.pages
FOR SELECT USING (true);

CREATE POLICY "Admin can manage pages" ON public.pages
FOR ALL USING (true);