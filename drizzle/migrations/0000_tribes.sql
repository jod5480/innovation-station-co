CREATE TABLE public.tribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 40),
  description text NOT NULL DEFAULT '',
  member_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO authenticated;
GRANT ALL ON public.tribes TO service_role;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tribes_read ON public.tribes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY tribes_insert ON public.tribes FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY tribes_update ON public.tribes FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY tribes_delete ON public.tribes FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE TABLE public.tribe_members (
  tribe_id uuid NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tribe_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.tribe_members TO authenticated;
GRANT ALL ON public.tribe_members TO service_role;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tm_read ON public.tribe_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY tm_insert ON public.tribe_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tm_delete ON public.tribe_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.tribe_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id uuid NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  body text NOT NULL DEFAULT '',
  charge_count int NOT NULL DEFAULT 0,
  reply_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tribe_threads TO authenticated;
GRANT ALL ON public.tribe_threads TO service_role;
ALTER TABLE public.tribe_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tt_read ON public.tribe_threads FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY tt_insert ON public.tribe_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY tt_delete ON public.tribe_threads FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.tribe_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.tribe_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  charge_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tribe_replies TO authenticated;
GRANT ALL ON public.tribe_replies TO service_role;
ALTER TABLE public.tribe_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tr_read ON public.tribe_replies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY tr_insert ON public.tribe_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY tr_delete ON public.tribe_replies FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.tribe_charges (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.tribe_threads(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.tribe_replies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((thread_id IS NULL) <> (reply_id IS NULL))
);
CREATE UNIQUE INDEX tribe_charges_thread_uniq ON public.tribe_charges(user_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX tribe_charges_reply_uniq ON public.tribe_charges(user_id, reply_id) WHERE reply_id IS NOT NULL;
GRANT SELECT, INSERT, DELETE ON public.tribe_charges TO authenticated;
GRANT ALL ON public.tribe_charges TO service_role;
ALTER TABLE public.tribe_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY tc_read ON public.tribe_charges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tc_insert ON public.tribe_charges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tc_delete ON public.tribe_charges FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tribe_counters() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d int := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END; r record;
BEGIN
  r := CASE WHEN TG_OP = 'INSERT' THEN NEW ELSE OLD END;
  IF TG_TABLE_NAME = 'tribe_members' THEN
    UPDATE tribes SET member_count = GREATEST(member_count + d, 0) WHERE id = r.tribe_id;
  ELSIF TG_TABLE_NAME = 'tribe_replies' THEN
    UPDATE tribe_threads SET reply_count = GREATEST(reply_count + d, 0) WHERE id = r.thread_id;
  ELSIF TG_TABLE_NAME = 'tribe_charges' THEN
    IF r.thread_id IS NOT NULL THEN
      UPDATE tribe_threads SET charge_count = GREATEST(charge_count + d, 0) WHERE id = r.thread_id;
    ELSE
      UPDATE tribe_replies SET charge_count = GREATEST(charge_count + d, 0) WHERE id = r.reply_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.tribe_counters() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER tribe_members_count AFTER INSERT OR DELETE ON public.tribe_members FOR EACH ROW EXECUTE FUNCTION public.tribe_counters();
CREATE TRIGGER tribe_replies_count AFTER INSERT OR DELETE ON public.tribe_replies FOR EACH ROW EXECUTE FUNCTION public.tribe_counters();
CREATE TRIGGER tribe_charges_count AFTER INSERT OR DELETE ON public.tribe_charges FOR EACH ROW EXECUTE FUNCTION public.tribe_counters();
-- prevent client from tampering counters
REVOKE UPDATE ON public.tribes FROM authenticated;
GRANT UPDATE (name, description) ON public.tribes TO authenticated;