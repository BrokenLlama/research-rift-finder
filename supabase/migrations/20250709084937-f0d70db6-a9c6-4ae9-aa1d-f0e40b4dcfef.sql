
-- Add literature_review column to paper_lists table
ALTER TABLE public.paper_lists 
ADD COLUMN literature_review TEXT;

-- Add external_id column to papers table if it doesn't exist
ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Update the papers table to allow updates (needed for summaries)
DROP POLICY IF EXISTS "Users can update papers in own lists" ON public.papers;
CREATE POLICY "Users can update papers in own lists" 
  ON public.papers 
  FOR UPDATE 
  USING (EXISTS ( 
    SELECT 1
    FROM paper_lists
    WHERE ((paper_lists.id = papers.list_id) AND (paper_lists.user_id = auth.uid()))
  ));
