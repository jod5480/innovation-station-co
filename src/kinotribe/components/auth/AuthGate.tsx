import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type Mode = "login" | "signup" | "forgot";

const inputCls =
  "w-full bg-[#1c1c1c] border border-[#363636] rounded-lg px-3 py-3 text-white text-sm placeholder-neutral-500 focus:border-[var(--theme-color)] focus:outline-none";
const primaryBtn =
  "w-full rounded-3xl bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-white font-bold py-3 text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2";
const secondaryBtn =
  "w-full rounded-3xl bg-[#262626] hover:bg-[#363636] text-white font-bold py-3 text-sm transition-colors";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

function friendlyError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
  return msg;
}

export const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => y - i);
  }, []);

  useEffect(() => {
    if (mode !== "signup" || !username) return setUsernameState("idle");
    if (!USERNAME_RE.test(username)) return setUsernameState("invalid");
    setUsernameState("checking");
    const t = setTimeout(async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: boolean | null; error: unknown }>)("is_username_available", { _username: username });
      setUsernameState(error ? "idle" : data ? "ok" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        let loginEmail = email.trim();
        if (!loginEmail.includes("@")) {
          const { data: foundEmail, error: rpcError } = await (supabase.rpc as any)("get_email_for_username", { p_username: loginEmail.toLowerCase() });
          if (rpcError || !foundEmail) throw new Error("Incorrect username or password.");
          loginEmail = foundEmail;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (error) throw error;
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("If an account exists for that email, we sent a link to reset your password.");
      } else {
        if (usernameState === "taken") throw new Error("That username is taken.");
        if (usernameState === "invalid")
          throw new Error("Username: 3–30 characters, lowercase letters, numbers, _ or . only.");
        if (!month || !day || !year) throw new Error("Please enter your birthday.");
        const birthday = new Date(Number(year), MONTHS.indexOf(month), Number(day));
        const age = (Date.now() - birthday.getTime()) / (365.25 * 864e5);
        if (age < 13) throw new Error("You must be at least 13 years old to join.");
        const iso = `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim(), username, birthday: iso },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0)
          throw new Error("An account with this email already exists. Try signing in.");
        if (!data.session) {
          setInfo(`We sent a confirmation link to ${email.trim()}. Open it, then sign in.`);
          setMode("login");
          setPassword("");
        }
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const passwordField = (
    <div className="relative">
      <input
        className={inputCls + " pr-10"}
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={mode === "signup" ? 8 : 1}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  const messages = (
    <>
      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>
      )}
      {info && (
        <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          {info}
        </div>
      )}
    </>
  );


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] antialiased font-sans w-full">
      <div className="w-full max-w-sm px-6 py-10">
        <h1 className="text-center text-3xl font-bold text-white mb-1 tracking-tight">Cinetribe</h1>
        <p className="text-center text-xs text-neutral-400 mb-8">The social network for filmmakers</p>

        <form onSubmit={submit} className="space-y-3">
          {mode === "login" && (
            <>
              <input className={inputCls} type="text" autoComplete="username" placeholder="Email or Username"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              {passwordField}
              <div className="text-right">
                <button type="button" onClick={() => switchMode("forgot")}
                  className="text-xs text-[var(--theme-color)] hover:underline">Forgot password?</button>
              </div>
              {messages}
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Log in
              </button>
              <button type="button" onClick={() => switchMode("signup")} className={secondaryBtn}>
                Create new account
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <button type="button" onClick={() => switchMode("login")}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white mb-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
              </button>
              <h2 className="text-lg font-bold text-white">Find your account</h2>
              <p className="text-xs text-neutral-400">Enter your email and we'll send you a link to reset your password.</p>
              <input className={inputCls} type="email" autoComplete="email" placeholder="Email address"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              {messages}
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send reset link
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <input className={inputCls} type="email" autoComplete="email" placeholder="Email address"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              {passwordField}
              <p className="text-[10px] text-neutral-500 -mt-1">At least 8 characters.</p>
              <input className={inputCls} placeholder="Full name" autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)} required />
              <div className="relative">
                <input className={inputCls + " pr-10"} placeholder="Username" autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameState === "checking" && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
                  {usernameState === "ok" && <Check className="w-4 h-4 text-emerald-400" />}
                  {(usernameState === "taken" || usernameState === "invalid") && <X className="w-4 h-4 text-red-400" />}
                </span>
              </div>
              {usernameState === "taken" && <p className="text-[11px] text-red-400 -mt-1">This username is taken.</p>}
              {usernameState === "invalid" && (
                <p className="text-[11px] text-red-400 -mt-1">3–30 characters: letters, numbers, _ or .</p>
              )}
              <div>
                <label className="block text-white font-semibold text-xs mb-1.5">Birthday</label>
                <div className="flex gap-2">
                  <select className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} required>
                    <option value="">Month</option>
                    {MONTHS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <select className={inputCls} value={day} onChange={(e) => setDay(e.target.value)} required>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <select className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} required>
                    <option value="">Year</option>
                    {years.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-[#A8A8A8] leading-tight">
                By signing up, you agree to Cinetribe's Terms, Privacy Policy and Cookies Policy.
              </p>
              {messages}
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign up
              </button>
              <button type="button" onClick={() => switchMode("login")} className={secondaryBtn}>
                I already have an account
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
