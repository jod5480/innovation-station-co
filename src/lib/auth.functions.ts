import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const normPhone = (p: string) => p.replace(/[^0-9+]/g, "");

async function resolveEmail(identifier: string): Promise<string | null> {
  const id = identifier.trim();
  if (id.includes("@")) return id;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let userId: string | null = null;
  const digits = normPhone(id);
  if (/^\+?[0-9]{6,15}$/.test(digits) && digits.replace("+", "").length === id.replace(/[\s\-()+]/g, "").length) {
    const { data } = await supabaseAdmin.from("user_contacts").select("user_id").eq("phone", digits).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("username", id.toLowerCase()).maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId) return null;
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export const loginWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ identifier: z.string().min(1).max(255), password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const email = await resolveEmail(data.identifier);
    if (!email) return { error: "Incorrect username, phone, email or password." };
    const client = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: res, error } = await client.auth.signInWithPassword({ email, password: data.password });
    if (error || !res.session) {
      if (error && /not confirmed/i.test(error.message)) return { error: "Please confirm your email first — check your inbox." };
      return { error: "Incorrect username, phone, email or password." };
    }
    return { access_token: res.session.access_token, refresh_token: res.session.refresh_token };
  });

export const isPhoneAvailable = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: z.string().min(6).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("user_contacts").select("user_id").eq("phone", normPhone(data.phone)).maybeSingle();
    return { available: !row };
  });
