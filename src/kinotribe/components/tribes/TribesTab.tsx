import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Users, Zap, MessageSquare, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "../../types";

type Author = { username: string; avatar: string } | null;
interface Tribe { id: string; name: string; description: string; member_count: number; creator_id: string }
interface Thread { id: string; tribe_id: string; title: string; body: string; charge_count: number; reply_count: number; created_at: string; author: Author }
interface Reply { id: string; text: string; charge_count: number; created_at: string; author: Author }

const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const ChargeButton: React.FC<{ count: number; active: boolean; onClick: () => void }> = ({ count, active, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all active:scale-90 ${
      active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
    }`}
    title={active ? "Remove charge" : "Charge this up"}
  >
    <Zap className={`w-3.5 h-3.5 ${active ? "fill-current" : ""}`} />
    {count}
  </button>
);

export const TribesTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const uid = currentUser.id;
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [charged, setCharged] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "tribe" | "thread">(null);
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [replyText, setReplyText] = useState("");
  const [err, setErr] = useState("");

  const loadTribes = useCallback(async () => {
    const [{ data: t }, { data: m }, { data: c }] = await Promise.all([
      supabase.from("tribes").select("*").order("member_count", { ascending: false }),
      supabase.from("tribe_members").select("tribe_id").eq("user_id", uid),
      supabase.from("tribe_charges").select("thread_id, reply_id").eq("user_id", uid),
    ]);
    setTribes((t as Tribe[]) || []);
    setJoined(new Set((m || []).map((r) => r.tribe_id)));
    setCharged(new Set((c || []).map((r) => (r.thread_id || r.reply_id) as string)));
  }, [uid]);

  const loadThreads = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("tribe_threads")
      .select("*, author:profiles(username, avatar)")
      .eq("tribe_id", id)
      .order("charge_count", { ascending: false })
      .order("created_at", { ascending: false });
    setThreads((data as unknown as Thread[]) || []);
  }, []);

  const loadReplies = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("tribe_replies")
      .select("*, author:profiles(username, avatar)")
      .eq("thread_id", id)
      .order("charge_count", { ascending: false })
      .order("created_at", { ascending: true });
    setReplies((data as unknown as Reply[]) || []);
  }, []);

  useEffect(() => { loadTribes(); }, [loadTribes]);

  const toggleJoin = async (t: Tribe) => {
    const isIn = joined.has(t.id);
    if (isIn) await supabase.from("tribe_members").delete().eq("tribe_id", t.id).eq("user_id", uid);
    else await supabase.from("tribe_members").insert({ tribe_id: t.id, user_id: uid });
    const next = new Set(joined); isIn ? next.delete(t.id) : next.add(t.id); setJoined(next);
    const delta = isIn ? -1 : 1;
    setTribes((ts) => ts.map((x) => (x.id === t.id ? { ...x, member_count: x.member_count + delta } : x)));
    if (tribe?.id === t.id) setTribe({ ...t, member_count: t.member_count + delta });
  };

  const toggleCharge = async (kind: "thread" | "reply", id: string) => {
    const on = charged.has(id);
    const col = kind === "thread" ? "thread_id" : "reply_id";
    if (on) await supabase.from("tribe_charges").delete().eq("user_id", uid).eq(col, id);
    else await supabase.from("tribe_charges").insert({ user_id: uid, [col]: id });
    const next = new Set(charged); on ? next.delete(id) : next.add(id); setCharged(next);
    const d = on ? -1 : 1;
    if (kind === "thread") {
      setThreads((ts) => [...ts.map((t) => (t.id === id ? { ...t, charge_count: t.charge_count + d } : t))].sort((a, b) => b.charge_count - a.charge_count));
      if (thread?.id === id) setThread({ ...thread, charge_count: thread.charge_count + d });
    } else {
      setReplies((rs) => [...rs.map((r) => (r.id === id ? { ...r, charge_count: r.charge_count + d } : r))].sort((a, b) => b.charge_count - a.charge_count));
    }
  };

  const submitModal = async () => {
    setErr("");
    if (modal === "tribe") {
      const name = f1.trim();
      if (name.length < 2) return setErr("Tribe name needs at least 2 characters.");
      const { data, error } = await supabase.from("tribes").insert({ name, description: f2.trim(), creator_id: uid }).select("*").single();
      if (error) return setErr(error.code === "23505" ? "A tribe with this name already exists." : error.message);
      await supabase.from("tribe_members").insert({ tribe_id: data.id, user_id: uid });
      await loadTribes();
      setTribe({ ...(data as Tribe), member_count: 1 });
      loadThreads(data.id);
    } else if (modal === "thread" && tribe) {
      if (!f1.trim()) return setErr("Add a title for your discussion.");
      const { error } = await supabase.from("tribe_threads").insert({ tribe_id: tribe.id, author_id: uid, title: f1.trim(), body: f2.trim() });
      if (error) return setErr(error.message);
      loadThreads(tribe.id);
    }
    setModal(null); setF1(""); setF2("");
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !replyText.trim()) return;
    const { error } = await supabase.from("tribe_replies").insert({ thread_id: thread.id, author_id: uid, text: replyText.trim() });
    if (error) return alert("Couldn't post reply: " + error.message);
    setReplyText("");
    setThread({ ...thread, reply_count: thread.reply_count + 1 });
    loadReplies(thread.id);
  };

  const Avatar = ({ a }: { a: Author }) =>
    a?.avatar ? <img src={a.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-muted" />;

  let body: React.ReactNode;
  if (thread) {
    body = (
      <div>
        <button onClick={() => { setThread(null); if (tribe) loadThreads(tribe.id); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> t/{tribe?.name}
        </button>
        <div className="border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Avatar a={thread.author} /> @{thread.author?.username} · {ago(thread.created_at)}
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">{thread.title}</h2>
          {thread.body && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{thread.body}</p>}
          <div className="flex items-center gap-3 mt-3">
            <ChargeButton count={thread.charge_count} active={charged.has(thread.id)} onClick={() => toggleCharge("thread", thread.id)} />
            <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{thread.reply_count}</span>
          </div>
        </div>
        <form onSubmit={sendReply} className="flex gap-2 mb-4">
          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Add to the discussion..." className="flex-1 px-4 py-2 rounded-full bg-muted border border-border text-sm text-foreground focus:outline-none" />
          <button disabled={!replyText.trim()} className="px-4 rounded-full bg-foreground text-background disabled:opacity-40"><Send className="w-4 h-4" /></button>
        </form>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Most charged first</p>
        <div className="space-y-3">
          {replies.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No replies yet. Be the first!</p>}
          {replies.map((r, i) => (
            <div key={r.id} className={`p-3 rounded-xl border ${i === 0 && r.charge_count > 0 ? "border-foreground" : "border-border"}`}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Avatar a={r.author} /> @{r.author?.username} · {ago(r.created_at)}
                {i === 0 && r.charge_count > 0 && <span className="ml-auto text-[10px] font-bold text-foreground flex items-center gap-0.5"><Zap className="w-3 h-3 fill-current" /> TOP</span>}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{r.text}</p>
              <ChargeButton count={r.charge_count} active={charged.has(r.id)} onClick={() => toggleCharge("reply", r.id)} />
            </div>
          ))}
        </div>
      </div>
    );
  } else if (tribe) {
    body = (
      <div>
        <button onClick={() => { setTribe(null); loadTribes(); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> All Tribes
        </button>
        <div className="border border-border rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-bold text-foreground">t/{tribe.name}</h2>
          {tribe.description && <p className="text-sm text-muted-foreground mt-1">{tribe.description}</p>}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />{tribe.member_count} members</span>
            <button onClick={() => toggleJoin(tribe)} className={`ml-auto px-4 py-1.5 rounded-full text-xs font-bold ${joined.has(tribe.id) ? "border border-border text-foreground" : "bg-foreground text-background"}`}>
              {joined.has(tribe.id) ? "Joined" : "Join"}
            </button>
            <button onClick={() => setModal("thread")} className="px-4 py-1.5 rounded-full text-xs font-bold bg-foreground text-background flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Discuss</button>
          </div>
        </div>
        <div className="space-y-3">
          {threads.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No discussions yet. Start one!</p>}
          {threads.map((t) => (
            <button key={t.id} onClick={() => { setThread(t); loadReplies(t.id); }} className="w-full text-left p-4 rounded-2xl border border-border hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Avatar a={t.author} /> @{t.author?.username} · {ago(t.created_at)}</div>
              <h3 className="font-bold text-foreground">{t.title}</h3>
              {t.body && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{t.body}</p>}
              <div className="flex items-center gap-3 mt-2">
                <ChargeButton count={t.charge_count} active={charged.has(t.id)} onClick={() => toggleCharge("thread", t.id)} />
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{t.reply_count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    body = (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Tribes</h2>
            <p className="text-xs text-muted-foreground">Join a community, start a discussion, charge the best answers.</p>
          </div>
          <button onClick={() => setModal("tribe")} className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Create Tribe</button>
        </div>
        <div className="space-y-2">
          {tribes.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No tribes yet. Create the first one!</p>}
          {tribes.map((t) => (
            <div key={t.id} onClick={() => { setTribe(t); loadThreads(t.id); }} className="cursor-pointer flex items-center gap-3 p-3 rounded-2xl border border-border hover:bg-muted/40">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">{t.name[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground truncate">t/{t.name}</div>
                <div className="text-xs text-muted-foreground truncate">{t.member_count} members{t.description ? ` · ${t.description}` : ""}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleJoin(t); }} className={`px-3 py-1 rounded-full text-xs font-bold ${joined.has(t.id) ? "border border-border text-foreground" : "bg-foreground text-background"}`}>
                {joined.has(t.id) ? "Joined" : "Join"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 pt-2 px-3">
      {body}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{modal === "tribe" ? "Create a Tribe" : `New discussion in t/${tribe?.name}`}</h3>
              <button onClick={() => { setModal(null); setErr(""); }} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <input value={f1} onChange={(e) => setF1(e.target.value)} maxLength={modal === "tribe" ? 40 : 300}
              placeholder={modal === "tribe" ? "Tribe name (e.g. KoreanCinema)" : "Title (e.g. Suggest me some Korean thriller movies?)"}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none" />
            <textarea value={f2} onChange={(e) => setF2(e.target.value)} rows={4}
              placeholder={modal === "tribe" ? "What is this tribe about? (optional)" : "Add more details (optional)"}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none resize-none" />
            {err && <p className="text-xs text-destructive mb-2">{err}</p>}
            <button onClick={submitModal} className="w-full py-2 rounded-full bg-foreground text-background font-bold text-sm">
              {modal === "tribe" ? "Create Tribe" : "Post Discussion"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
