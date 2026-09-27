import React, { useState } from "react";
import { Loader2, Info, EyeOff, HelpCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

interface AuthGateProps {
  onGuestLogin?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onGuestLogin }) => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        if (!data.session) setInfo("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] antialiased font-sans w-full">
      <div className="w-full max-w-sm px-6 py-8">
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-white font-semibold text-xs mb-1.5">Mobile number or email</label>
                <input
                  className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                  placeholder="Mobile number or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <p className="text-[11px] text-white/90 leading-tight mt-2 mb-3">
                You may receive notifications from us. <a href="#" className="text-[var(--theme-color)] hover:underline">Learn why we ask for your contact information</a>
              </p>

              <div>
                <label className="block text-white font-semibold text-xs mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-white font-semibold text-xs">Birthday</label>
                  <HelpCircle className="w-3.5 h-3.5 text-white/60" />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select className="w-full appearance-none bg-[#1c1c1c] border border-[#363636] rounded px-3 py-2.5 text-white/80 text-xs focus:border-[#555] focus:outline-none">
                      <option>Month</option>
                      <option>Jan</option>
                      <option>Feb</option>
                      <option>Mar</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <select className="w-full appearance-none bg-[#1c1c1c] border border-[#363636] rounded px-3 py-2.5 text-white/80 text-xs focus:border-[#555] focus:outline-none">
                      <option>Day</option>
                      <option>1</option>
                      <option>2</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <select className="w-full appearance-none bg-[#1c1c1c] border border-[#363636] rounded px-3 py-2.5 text-white/80 text-xs focus:border-[#555] focus:outline-none">
                      <option>Year</option>
                      <option>2023</option>
                      <option>2022</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold text-xs mb-1.5">Name</label>
                <input
                  className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold text-xs mb-1.5">Username</label>
                <input
                  className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                  placeholder="Username"
                />
              </div>

              <div className="text-[11px] text-[#A8A8A8] leading-tight space-y-3 mt-4 mb-2 text-left">
                <p>
                  People who use our service may have uploaded your contact information to Cinetribe. <a href="#" className="text-[var(--theme-color)] hover:underline">Learn more</a>.
                </p>
                <p>
                  By tapping Submit, you agree to create an account and to Cinetribe's <a href="#" className="text-[var(--theme-color)] hover:underline">Terms</a>, <a href="#" className="text-[var(--theme-color)] hover:underline">Privacy Policy</a> and <a href="#" className="text-[var(--theme-color)] hover:underline">Cookies Policy</a>.
                </p>
                <p>
                  The <a href="#" className="text-[var(--theme-color)] hover:underline">Privacy Policy</a> describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including ads.
                </p>
              </div>

              {error && (
                <div className="rounded p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <p>{error}</p>
                </div>
              )}

              {info && (
                <div className="rounded p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <p>{info}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-3xl bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-white font-bold py-3 text-sm transition-colors mt-6 shadow-sm disabled:opacity-70"
              >
                {busy ? "Submitting..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full rounded-3xl bg-[#262626] hover:bg-[#363636] text-white font-bold py-3 text-sm transition-colors mt-3"
              >
                I already have an account
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
              <input
                className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="w-full bg-[#1c1c1c] border border-[#363636] rounded px-3 py-3 text-white text-xs placeholder-neutral-500 focus:border-[#555] focus:outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              {error && <p className="text-red-400 text-xs">{error}</p>}
              
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-3xl bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-white font-bold py-3 text-sm transition-colors mt-4"
              >
                {busy ? "Signing in..." : "Submit"}
              </button>
              
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="w-full rounded-3xl bg-[#262626] hover:bg-[#363636] text-white font-bold py-3 text-sm transition-colors mt-2"
              >
                Create new account
              </button>
              
              {onGuestLogin && (
                <button
                  type="button"
                  onClick={onGuestLogin}
                  className="w-full text-[var(--theme-color)] text-sm font-semibold hover:underline text-center block mt-4"
                >
                  Explore as Guest
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
