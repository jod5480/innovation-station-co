REVOKE UPDATE (is_verified) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_verified) ON public.profiles FROM anon;