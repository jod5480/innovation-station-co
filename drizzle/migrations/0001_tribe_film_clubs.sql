ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS cover_image text NOT NULL DEFAULT '';
ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';
ALTER TABLE public.tribe_threads ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
GRANT UPDATE ON public.tribe_threads TO authenticated;
CREATE POLICY "Tribe creator can pin threads" ON public.tribe_threads FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND t.creator_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND t.creator_id = auth.uid()));