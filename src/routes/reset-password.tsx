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
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => d.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  const input =
    "w-full bg-[#1c1c1c] border border-[#363636] rounded-lg px-3 py-3 text-white text-sm placeholder-neutral-500 focus:outline-none";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold text-white text-center mb-4">Create a new password</h1>
        {!ready ? (
          <p className="text-sm text-neutral-400 text-center">
            Open this page from the reset link in your email.
          </p>
        ) : done ? (
          <p className="text-sm text-emerald-400 text-center">Password updated. Taking you in…</p>
        ) : (
          <>
            <input className={input} type="password" placeholder="New password" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input className={input} type="password" placeholder="Confirm new password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button disabled={busy}
              className="w-full rounded-3xl bg-[var(--theme-color)] text-white font-bold py-3 text-sm disabled:opacity-60">
              {busy ? "Saving…" : "Save password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
