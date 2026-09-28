ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS latitude double precision, ADD COLUMN IF NOT EXISTS longitude double precision, ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS latitude double precision, ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE base_username TEXT; final_username TEXT; n INT := 0; bday DATE;
BEGIN
  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'member'), '@', 1), 'member'),
    '[^a-zA-Z0-9_.]', '', 'g'));
  IF base_username = '' THEN base_username := 'member'; END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = final_username) LOOP
    n := n + 1; final_username := base_username || n::text;
  END LOOP;
  BEGIN bday := (NEW.raw_user_meta_data->>'birthday')::date; EXCEPTION WHEN others THEN bday := NULL; END;
  INSERT INTO public.profiles (id, name, username, avatar, birthday)
  VALUES (NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name',''), NEW.raw_user_meta_data->>'full_name', final_username),
    final_username, COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), bday);
  RETURN NEW;
END; $function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_username_available(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(_username)) $$;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;