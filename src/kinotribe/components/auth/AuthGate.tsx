import React, { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        if (!data.session) setInfo('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (res.error) setError(res.error.message);
  };

  const input =
    'w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E17] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#121826] p-7 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">KinoTribe</h1>
            <p className="text-xs text-neutral-400">The social network for filmmakers</p>
          </div>
        </div>
        <button
          onClick={google}
          className="w-full rounded-xl bg-white text-neutral-900 font-semibold py-3 text-sm hover:bg-neutral-200"
        >
          Continue with Google
        </button>
        <div className="my-4 text-center text-xs text-neutral-500">or</div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password (min 6)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-green-400">{info}</p>}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-orange-500 text-white font-semibold py-3 text-sm hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-neutral-400">
          {mode === 'signup' ? 'Already a member?' : 'New to KinoTribe?'}{' '}
          <button className="text-orange-400 font-semibold" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </div>
    </div>
  );
};
