DROP POLICY tm_read ON public.tribe_members;
CREATE POLICY tm_read ON public.tribe_members FOR SELECT TO authenticated USING (auth.uid() = user_id);