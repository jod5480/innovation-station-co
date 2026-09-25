DROP POLICY IF EXISTS follows_public_read ON public.follows;
CREATE POLICY follows_member_read ON public.follows FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS post_likes_public_read ON public.post_likes;
CREATE POLICY post_likes_member_read ON public.post_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS comment_likes_public_read ON public.comment_likes;
CREATE POLICY comment_likes_member_read ON public.comment_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS stories_public_read ON public.stories;
CREATE POLICY stories_member_read ON public.stories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND (expires_at > now() OR auth.uid() = author_id));
DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_member_read ON public.posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_member_read ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_member_read ON public.comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS media_read_authenticated ON storage.objects;
CREATE POLICY media_read_own ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = (select auth.uid()::text));