import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginWithIdentifier, isPhoneAvailable } from "@/lib/auth.functions";

type Mode = "login" | "signup" | "forgot";

const inputCls =
  "w-full bg-[#1c1c1c] border border-[#363636] rounded-lg px-3 py-3 text-white text-sm placeholder-neutral-500 focus:border-[var(--theme-color)] focus:outline-none";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const thisYear = new Date().getFullYear();

function friendly(msg: string) {
  if (/invalid login/i.test(msg)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox.";
  if (/already registered/i.test(msg)) return "An account with this email already exists. Try logging in.";
  if (/pwned|weak|compromised/i.test(msg)) return "This password is too common. Please choose a stronger one.";
  return msg;
}

export const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [uStatus, setUStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bDay, setBDay] = useState("");
  const [bYear, setBYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPw, setShowPw] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  useEffect(() => {
    if (mode !== "signup") return;
    const u = username.trim().toLowerCase();
    if (!u) return setUStatus("idle");
    if (!/^[a-z0-9_.]{3,30}$/.test(u)) return setUStatus("invalid");
    setUStatus("checking");
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_username_available", { _username: u });
      setUStatus(error ? "idle" : data ? "ok" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        if (uStatus === "taken") throw new Error("That username is taken.");
        if (uStatus === "invalid") throw new Error("Username: 3–30 letters, numbers, _ or .");
        if (!bMonth || !bDay || !bYear) throw new Error("Please enter your birthday.");
        const bday = new Date(Number(bYear), Number(bMonth) - 1, Number(bDay));
        const age = (Date.now() - bday.getTime()) / (365.25 * 864e5);
        if (age < 13) throw new Error("You must be at least 13 to join.");
        const ph = phone.replace(/[^0-9+]/g, "");
        if (!/^\+?[0-9]{7,15}$/.test(ph)) throw new Error("Enter a valid mobile number, e.g. +919876543210.");
        const { available } = await isPhoneAvailable({ data: { phone: ph } });
        if (!available) throw new Error("That mobile number is already linked to an account.");
        const birthday = `${bYear}-${bMonth.padStart(2, "0")}-${bDay.padStart(2, "0")}`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim(), username: username.trim().toLowerCase(), birthday, phone: ph },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo(`We sent a confirmation link to ${email}. Open it to activate your account, then log in.`);
          setMode("login");
        }
      } else if (mode === "login") {
        const res = await loginWithIdentifier({ data: { identifier: identifier.trim(), password } });
        if ("error" in res) throw new Error(res.error);
        const { error } = await supabase.auth.setSession(res);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("If an account exists for that email, a reset link is on its way.");
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] antialiased font-sans w-full">
      <div className="w-full max-w-sm px-6 py-10">
        <h1 className="text-3xl font-bold text-white text-center mb-1 tracking-tight">Cinetribe</h1>
        <p className="text-center text-xs text-neutral-400 mb-8">
          {mode === "signup" ? "Join the global film community" : mode === "forgot" ? "Reset your password" : "Log in to your account"}
        </p>

        <form onSubmit={submit} className="space-y-3">

          {mode === "signup" && (
            <>
              <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
              <div className="relative">
                <input
                  className={inputCls}
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  required
                  autoCapitalize="none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {uStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
                  {uStatus === "ok" && <Check className="w-4 h-4 text-emerald-400" />}
                  {(uStatus === "taken" || uStatus === "invalid") && <X className="w-4 h-4 text-red-400" />}
                </span>
              </div>
              {uStatus === "taken" && <p className="text-[11px] text-red-400">That username is taken.</p>}
              {uStatus === "invalid" && <p className="text-[11px] text-red-400">3–30 characters: letters, numbers, _ or .</p>}
            </>
          )}

          {mode === "login" ? (
            <input className={inputCls} placeholder="Username, phone number or email" autoComplete="username" autoCapitalize="none" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          ) : (
            <input className={inputCls} type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          )}
          {mode === "signup" && (
            <input className={inputCls} type="tel" placeholder="Mobile number (e.g. +919876543210)" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          )}

          {mode !== "forgot" && (
            <div className="relative">
              <input
                className={inputCls}
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" aria-label="Toggle password">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-white/80 text-xs mb-1.5">Birthday</label>
              <div className="flex gap-2">
                <select className={inputCls} value={bMonth} onChange={(e) => setBMonth(e.target.value)} required>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
                <select className={inputCls} value={bDay} onChange={(e) => setBDay(e.target.value)} required>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
                </select>
                <select className={inputCls} value={bYear} onChange={(e) => setBYear(e.target.value)} required>
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => thisYear - i).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-[var(--theme-color)] hover:underline block ml-auto">
              Forgot password?
            </button>
          )}

          {error && <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}
          {info && <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">{info}</div>}

          {mode === "signup" && (
            <p className="text-[11px] text-[#A8A8A8] leading-snug">
              By signing up, you agree to Cinetribe's Terms, Privacy Policy and Cookies Policy.
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-3xl bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-white font-bold py-3 text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signup" ? "Sign up" : mode === "login" ? "Log in" : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-400">
          {mode === "login" ? (
            <>Don't have an account? <button onClick={() => switchMode("signup")} className="text-[var(--theme-color)] font-semibold hover:underline">Sign up</button></>
          ) : (
            <>Have an account? <button onClick={() => switchMode("login")} className="text-[var(--theme-color)] font-semibold hover:underline">Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
};
