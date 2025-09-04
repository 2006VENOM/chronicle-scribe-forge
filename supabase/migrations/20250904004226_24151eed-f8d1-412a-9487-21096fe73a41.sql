-- Drop existing restrictive policies for stories, chapters, and pages
DROP POLICY IF EXISTS "Admin can manage stories" ON public.stories;
DROP POLICY IF EXISTS "Everyone can read stories" ON public.stories;
DROP POLICY IF EXISTS "Admin can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Everyone can read chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admin can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Everyone can read pages" ON public.pages;

-- Create new permissive policies for stories
CREATE POLICY "Anyone can read stories" ON public.stories
FOR SELECT USING (true);

CREATE POLICY "Anyone can create stories" ON public.stories
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update stories" ON public.stories
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete stories" ON public.stories
FOR DELETE USING (true);

-- Create new permissive policies for chapters
CREATE POLICY "Anyone can read chapters" ON public.chapters
FOR SELECT USING (true);

CREATE POLICY "Anyone can create chapters" ON public.chapters
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update chapters" ON public.chapters
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete chapters" ON public.chapters
FOR DELETE USING (true);

-- Create new permissive policies for pages
CREATE POLICY "Anyone can read pages" ON public.pages
FOR SELECT USING (true);

CREATE POLICY "Anyone can create pages" ON public.pages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pages" ON public.pages
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete pages" ON public.pages
FOR DELETE USING (true);