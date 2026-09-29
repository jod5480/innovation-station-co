import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Cinetribe" },
      { name: "description", content: "Choose a new password for your Cinetribe account." },
      { property: "og:title", content: "Reset password — Cinetribe" },
      { property: "og:description", content: "Choose a new password for your Cinetribe account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY" || e === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg("Password updated. Taking you to the app…");
    setTimeout(() => navigate({ to: "/" }), 1200);
  };

  const cls = "w-full bg-[#1c1c1c] border border-[#363636] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[var(--theme-color)]";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold text-white text-center mb-4">Set a new password</h1>
        {!ready && <p className="text-xs text-neutral-400 text-center">Open this page from the reset link in your email.</p>}
        <input className={cls} type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className={cls} type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {err && <p className="text-xs text-red-400">{err}</p>}
        {msg && <p className="text-xs text-emerald-400">{msg}</p>}
        <button disabled={busy || !ready} className="w-full rounded-3xl bg-[var(--theme-color)] text-white font-bold py-3 text-sm disabled:opacity-60">
          Update password
        </button>
      </form>
    </div>
  );
}
