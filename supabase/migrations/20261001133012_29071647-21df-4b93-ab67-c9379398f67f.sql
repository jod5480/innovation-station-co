CREATE TABLE public.user_contacts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.user_contacts TO authenticated;
GRANT ALL ON public.user_contacts TO service_role;
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_read_own" ON public.user_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON public.user_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_contacts_updated_at BEFORE UPDATE ON public.user_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE base_username TEXT; final_username TEXT; n INT := 0; bday DATE; ph TEXT;
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
  ph := NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone',''), '[^0-9+]', '', 'g'), '');
  IF ph IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_contacts WHERE phone = ph) THEN ph := NULL; END IF;
  INSERT INTO public.user_contacts (user_id, phone) VALUES (NEW.id, ph);
  RETURN NEW;
END; $function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_phone_available(_phone text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT NOT EXISTS (SELECT 1 FROM public.user_contacts WHERE phone = regexp_replace(_phone, '[^0-9+]', '', 'g')) $$;