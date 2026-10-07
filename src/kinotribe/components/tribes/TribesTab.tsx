import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Users, Zap, MessageSquare, Send, X, Search, Pin, ImagePlus, Flame, Clock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "../../lib/api";
import type { User } from "../../types";

type Author = { username: string; avatar: string } | null;
interface Tribe { id: string; name: string; description: string; member_count: number; creator_id: string; cover_image: string; category: string }
interface Thread { id: string; tribe_id: string; title: string; body: string; charge_count: number; reply_count: number; created_at: string; pinned: boolean; author: Author }
interface Reply { id: string; text: string; charge_count: number; created_at: string; author: Author }

const CATEGORIES = ["General", "Genre", "World Cinema", "Directors", "Craft", "Classics", "Indie", "Animation"];

const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const Avatar = ({ a, size = 7 }: { a: Author; size?: number }) =>
  a?.avatar ? <img src={a.avatar} alt="" className={`w-${size} h-${size} rounded-full object-cover`} /> : <div className={`w-${size} h-${size} rounded-full bg-muted`} />;

const Cover: React.FC<{ t: Tribe; className?: string }> = ({ t, className = "" }) =>
  t.cover_image ? (
    <img src={t.cover_image} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-gradient-to-br from-muted to-background flex items-center justify-center ${className}`}>
      <span className="text-4xl font-black text-foreground/20">{t.name[0]?.toUpperCase()}</span>
    </div>
  );

const ChargeButton: React.FC<{ count: number; active: boolean; onClick: () => void }> = ({ count, active, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-90 ${
      active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
    }`}
    aria-label={active ? "Remove charge" : "Charge"}
  >
    <Zap className={`w-3.5 h-3.5 ${active ? "fill-current" : ""}`} />
    {count > 0 ? count : "Charge"}
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
  const [cat, setCat] = useState("General");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [loading, setLoading] = useState(true);

  const loadTribes = useCallback(async () => {
    const [{ data: t }, { data: m }, { data: c }] = await Promise.all([
      supabase.from("tribes").select("*").order("member_count", { ascending: false }),
      supabase.from("tribe_members").select("tribe_id").eq("user_id", uid),
      supabase.from("tribe_charges").select("thread_id, reply_id").eq("user_id", uid),
    ]);
    setTribes((t as Tribe[]) || []);
    setJoined(new Set((m || []).map((r) => r.tribe_id)));
    setCharged(new Set((c || []).map((r) => (r.thread_id || r.reply_id) as string)));
    setLoading(false);
  }, [uid]);

  const loadThreads = useCallback(async (id: string) => {
    const { data } = await supabase.from("tribe_threads").select("*, author:profiles(username, avatar)").eq("tribe_id", id);
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

  const sortedThreads = useMemo(() => {
    const arr = [...threads];
    arr.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "hot") {
        const sa = a.charge_count * 2 + a.reply_count, sb = b.charge_count * 2 + b.reply_count;
        if (sb !== sa) return sb - sa;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return arr;
  }, [threads, sort]);

  const myClubs = tribes.filter((t) => joined.has(t.id));
  const discover = tribes.filter(
    (t) => (filter === "All" || t.category === filter) && (!query || (t.name + " " + t.description).toLowerCase().includes(query.toLowerCase())),
  );

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
    else await supabase.from("tribe_charges").insert(kind === "thread" ? { user_id: uid, thread_id: id } : { user_id: uid, reply_id: id });
    const next = new Set(charged); on ? next.delete(id) : next.add(id); setCharged(next);
    const d = on ? -1 : 1;
    if (kind === "thread") {
      setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, charge_count: t.charge_count + d } : t)));
      if (thread?.id === id) setThread({ ...thread, charge_count: thread.charge_count + d });
    } else {
      setReplies((rs) => [...rs.map((r) => (r.id === id ? { ...r, charge_count: r.charge_count + d } : r))].sort((a, b) => b.charge_count - a.charge_count));
    }
  };

  const togglePin = async (t: Thread) => {
    const { error } = await supabase.from("tribe_threads").update({ pinned: !t.pinned }).eq("id", t.id);
    if (!error) setThreads((ts) => ts.map((x) => (x.id === t.id ? { ...x, pinned: !t.pinned } : x)));
  };

  const closeModal = () => { setModal(null); setErr(""); setF1(""); setF2(""); setCoverFile(null); setCat("General"); };

  const submitModal = async () => {
    setErr("");
    setBusy(true);
    try {
      if (modal === "tribe") {
        const name = f1.trim().replace(/\s+/g, "");
        if (name.length < 2) return setErr("Club name needs at least 2 characters.");
        let cover_image = "";
        if (coverFile) cover_image = await uploadMedia(coverFile);
        const { data, error } = await supabase.from("tribes").insert({ name, description: f2.trim(), creator_id: uid, category: cat, cover_image }).select("*").single();
        if (error) return setErr(error.code === "23505" ? "A club with this name already exists." : error.message);
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
      closeModal();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
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

  const openTribe = (t: Tribe) => { setTribe(t); setThreads([]); setSort("hot"); loadThreads(t.id); };
  const JoinBtn = ({ t, small }: { t: Tribe; small?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); toggleJoin(t); }}
      className={`${small ? "px-3 py-1 text-[11px]" : "px-5 py-2 text-xs"} rounded-full font-bold flex items-center gap-1 transition-all active:scale-95 ${
        joined.has(t.id) ? "border border-border text-foreground" : "bg-foreground text-background"
      }`}
    >
      {joined.has(t.id) ? <><Check className="w-3 h-3" /> Joined</> : "Join"}
    </button>
  );

  let body: React.ReactNode;

  if (thread && tribe) {
    body = (
      <div className="px-3">
        <button onClick={() => { setThread(null); loadThreads(tribe.id); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-3">
          <ArrowLeft className="w-4 h-4" /> {tribe.name}
        </button>
        <article className="pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Avatar a={thread.author} size={8} />
            <div>
              <div className="text-foreground font-semibold text-sm">@{thread.author?.username}</div>
              <div>{ago(thread.created_at)} ago</div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-snug mb-2">{thread.title}</h2>
          {thread.body && <p className="text-[15px] text-foreground/85 whitespace-pre-wrap leading-relaxed">{thread.body}</p>}
          <div className="flex items-center gap-3 mt-4">
            <ChargeButton count={thread.charge_count} active={charged.has(thread.id)} onClick={() => toggleCharge("thread", thread.id)} />
            <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{thread.reply_count} replies</span>
          </div>
        </article>

        <div className="py-3 text-xs text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Most charged replies first</div>
        <div className="space-y-3 pb-24">
          {replies.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No replies yet. Share your thoughts below.</p>}
          {replies.map((r, i) => {
            const top = i === 0 && r.charge_count > 0;
            return (
              <div key={r.id} className={`p-4 rounded-2xl ${top ? "border-2 border-foreground" : "border border-border"}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Avatar a={r.author} size={6} />
                  <span className="text-foreground font-semibold">@{r.author?.username}</span> · {ago(r.created_at)}
                  {top && <span className="ml-auto px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center gap-0.5"><Zap className="w-3 h-3 fill-current" /> TOP ANSWER</span>}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap mb-3 leading-relaxed">{r.text}</p>
                <ChargeButton count={r.charge_count} active={charged.has(r.id)} onClick={() => toggleCharge("reply", r.id)} />
              </div>
            );
          })}
        </div>

        <form onSubmit={sendReply} className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border px-3 py-2">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 px-4 py-2.5 rounded-full bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-foreground" />
            <button disabled={!replyText.trim()} className="w-11 h-11 rounded-full bg-foreground text-background disabled:opacity-30 flex items-center justify-center"><Send className="w-4 h-4" /></button>
          </div>
        </form>
      </div>
    );
  } else if (tribe) {
    const isOwner = tribe.creator_id === uid;
    body = (
      <div>
        <div className="relative">
          <Cover t={tribe} className="w-full h-36" />
          <button onClick={() => { setTribe(null); loadTribes(); }} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 -mt-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-foreground text-background border-4 border-background flex items-center justify-center text-2xl font-black">{tribe.name[0]?.toUpperCase()}</div>
          <div className="flex items-start justify-between gap-3 mt-2">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-foreground truncate">{tribe.name}</h2>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-full border border-border">{tribe.category}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{tribe.member_count} members</span>
              </div>
            </div>
            <JoinBtn t={tribe} />
          </div>
          {tribe.description && <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{tribe.description}</p>}
        </div>

        <div className="flex gap-2 px-4 mt-5 border-b border-border">
          {(["hot", "new"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`pb-3 px-2 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${sort === s ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>
              {s === "hot" ? <Flame className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {s === "hot" ? "Top" : "Latest"}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border pb-28">
          {sortedThreads.length === 0 && (
            <div className="text-center py-14 px-6">
              <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-bold text-foreground">No discussions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Ask a question or share a recommendation to get things started.</p>
            </div>
          )}
          {sortedThreads.map((t) => (
            <div key={t.id} onClick={() => { setThread(t); loadReplies(t.id); }} className="cursor-pointer px-4 py-4 hover:bg-muted/30 transition-colors">
              {t.pinned && <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 mb-1.5"><Pin className="w-3 h-3" /> PINNED</div>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Avatar a={t.author} size={5} /> <span className="text-foreground/90 font-medium">@{t.author?.username}</span> · {ago(t.created_at)}
                {isOwner && (
                  <button onClick={(e) => { e.stopPropagation(); togglePin(t); }} className="ml-auto p-1 hover:text-foreground" aria-label={t.pinned ? "Unpin" : "Pin"}>
                    <Pin className={`w-3.5 h-3.5 ${t.pinned ? "fill-current text-foreground" : ""}`} />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-foreground text-[15px] leading-snug">{t.title}</h3>
              {t.body && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.body}</p>}
              <div className="flex items-center gap-3 mt-3">
                <ChargeButton count={t.charge_count} active={charged.has(t.id)} onClick={() => toggleCharge("thread", t.id)} />
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{t.reply_count}</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setModal("thread")} className="fixed bottom-20 right-5 z-40 h-12 px-5 rounded-full bg-foreground text-background font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95">
          <Plus className="w-5 h-5" /> Start discussion
        </button>
      </div>
    );
  } else {
    body = (
      <div className="px-3 pt-3 pb-28">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">Tribes</h2>
            <p className="text-sm text-muted-foreground">Film clubs for every kind of movie lover.</p>
          </div>
          <button onClick={() => setModal("tribe")} className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95" aria-label="Create club">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clubs" className="w-full pl-10 pr-4 py-2.5 rounded-full bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-foreground" />
        </div>

        {myClubs.length > 0 && !query && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">Your clubs</h3>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
              {myClubs.map((t) => (
                <button key={t.id} onClick={() => openTribe(t)} className="shrink-0 w-20 text-center">
                  <Cover t={t} className="w-16 h-16 mx-auto rounded-2xl border border-border" />
                  <div className="text-[11px] text-foreground mt-1.5 truncate">{t.name}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3 scrollbar-hide">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-bold text-foreground mt-2 mb-3">Discover</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading clubs...</p>
        ) : discover.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold text-foreground">{tribes.length === 0 ? "No clubs yet" : "No clubs found"}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Start a club around a genre, director or craft you love.</p>
            <button onClick={() => setModal("tribe")} className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-bold">Create a club</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {discover.map((t) => (
              <div key={t.id} onClick={() => openTribe(t)} className="cursor-pointer rounded-2xl border border-border overflow-hidden hover:border-foreground/50 transition-colors flex flex-col">
                <Cover t={t} className="w-full h-24" />
                <div className="p-3 flex-1 flex flex-col">
                  <div className="font-bold text-foreground text-sm truncate">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.category} · {t.member_count} members</div>
                  {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{t.description}</p>}
                  <div className="mt-auto pt-3"><JoinBtn t={t} small /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {body}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-md bg-background border border-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{modal === "tribe" ? "Create a club" : `Post in ${tribe?.name}`}</h3>
              <button onClick={closeModal} className="text-muted-foreground" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {modal === "tribe" && (
              <label className="block mb-4 cursor-pointer">
                <div className="h-28 rounded-2xl border border-dashed border-border overflow-hidden flex items-center justify-center bg-muted/40">
                  {coverFile ? <img src={URL.createObjectURL(coverFile)} alt="" className="w-full h-full object-cover" /> : (
                    <span className="text-xs text-muted-foreground flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Add cover image (optional)</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              </label>
            )}

            <label className="text-xs font-semibold text-muted-foreground">{modal === "tribe" ? "Club name" : "Title"}</label>
            <input value={f1} onChange={(e) => setF1(e.target.value)} maxLength={modal === "tribe" ? 40 : 300}
              placeholder={modal === "tribe" ? "e.g. KoreanCinema" : "e.g. Suggest me some Korean thriller movies?"}
              className="w-full mt-1 mb-3 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-foreground" />

            {modal === "tribe" && (
              <>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-3">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setCat(c)} className={`px-3 py-1 rounded-full text-xs border ${cat === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{c}</button>
                  ))}
                </div>
              </>
            )}

            <label className="text-xs font-semibold text-muted-foreground">{modal === "tribe" ? "About" : "Details"}</label>
            <textarea value={f2} onChange={(e) => setF2(e.target.value)} rows={4}
              placeholder={modal === "tribe" ? "What does this club talk about?" : "Add more details (optional)"}
              className="w-full mt-1 mb-3 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-foreground resize-none" />
            {err && <p className="text-xs text-destructive mb-2">{err}</p>}
            <button onClick={submitModal} disabled={busy} className="w-full py-3 rounded-full bg-foreground text-background font-bold text-sm disabled:opacity-50">
              {busy ? "Please wait..." : modal === "tribe" ? "Create club" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
