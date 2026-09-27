import { supabase } from "@/integrations/supabase/client";
import type {
  Application,
  CinemaRole,
  CommentItem,
  DirectMessageConversation,
  ExperienceLevel,
  NotificationItem,
  Post,
  StoryItem,
  User,
} from "../types";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

/* ---------------------------------- time --------------------------------- */

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* -------------------------------- uploads -------------------------------- */

export async function uploadMedia(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("You need to be signed in to upload.");
  const ext = file.name.split(".").pop() || "bin";
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("media")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !data) throw signErr ?? new Error("Could not create media link.");
  return data.signedUrl;
}

/* -------------------------------- mapping -------------------------------- */

type ProfileRow = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  cover_image: string | null;
  bio: string;
  country: string;
  country_code: string;
  languages: string[];
  roles: string[];
  experience_level: string;
  portfolio_url: string | null;
  imdb_url: string | null;
  instagram_url: string | null;
  showreel_video_url: string | null;
  is_verified: boolean;
  created_at: string;
};

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80";

export function mapProfile(
  row: ProfileRow,
  counts?: { followers: number; following: number },
): User {
  return {
    id: row.id,
    name: row.name || row.username,
    username: row.username,
    avatar: row.avatar || FALLBACK_AVATAR,
    coverImage: row.cover_image || undefined,
    bio: row.bio,
    country: row.country || "Global",
    countryCode: row.country_code || "US",
    languages: row.languages?.length ? row.languages : ["English"],
    roles: (row.roles?.length ? row.roles : ["Directing"]) as CinemaRole[],
    experienceLevel: (row.experience_level || "Amateur") as ExperienceLevel,
    portfolioUrl: row.portfolio_url || undefined,
    imdbUrl: row.imdb_url || undefined,
    instagramUrl: row.instagram_url || undefined,
    showreelVideoUrl: row.showreel_video_url || undefined,
    followersCount: counts?.followers ?? 0,
    followingCount: counts?.following ?? 0,
    isVerified: row.is_verified,
    joinedDate: `Joined ${new Date(row.created_at).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })}`,
  };
}

/* --------------------------------- reads --------------------------------- */

export interface FeedData {
  users: User[];
  posts: Post[];
  stories: StoryItem[];
  followingIds: string[];
  notifications: NotificationItem[];
  conversations: DirectMessageConversation[];
  applications: Application[];
}

export async function loadEverything(currentUserId: string): Promise<FeedData> {
  const [
    profilesRes,
    followsRes,
    postsRes,
    commentsRes,
    likesRes,
    savesRes,
    storiesRes,
    notifsRes,
    convRes,
    appsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("follows").select("follower_id, following_id"),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("comments").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("post_likes").select("post_id, user_id"),
    supabase.from("post_saves").select("post_id"),
    supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("conversations").select("*").order("last_message_at", { ascending: false }),
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
  ]);

  const follows = followsRes.data ?? [];
  const followerCount = new Map<string, number>();
  const followingCount = new Map<string, number>();
  for (const f of follows) {
    followerCount.set(f.following_id, (followerCount.get(f.following_id) ?? 0) + 1);
    followingCount.set(f.follower_id, (followingCount.get(f.follower_id) ?? 0) + 1);
  }

  const users = (profilesRes.data ?? []).map((p: ProfileRow) =>
    mapProfile(p, {
      followers: followerCount.get(p.id) ?? 0,
      following: followingCount.get(p.id) ?? 0,
    }),
  );
  const userById = new Map(users.map((u) => [u.id, u]));
  const ghost = (id: string): User =>
    userById.get(id) ?? {
      id,
      name: "Unknown member",
      username: "unknown",
      avatar: FALLBACK_AVATAR,
      bio: "",
      country: "Global",
      countryCode: "US",
      languages: ["English"],
      roles: ["Directing"],
      experienceLevel: "Amateur",
      followersCount: 0,
      followingCount: 0,
      joinedDate: "",
    };

  const likesByPost = new Map<string, string[]>();
  for (const l of likesRes.data ?? []) {
    likesByPost.set(l.post_id, [...(likesByPost.get(l.post_id) ?? []), l.user_id]);
  }
  const savedPosts = new Set((savesRes.data ?? []).map((s) => s.post_id));

  const commentsByPost = new Map<string, CommentItem[]>();
  for (const c of commentsRes.data ?? []) {
    const item: CommentItem = {
      id: c.id,
      author: ghost(c.author_id),
      text: c.text,
      createdAt: timeAgo(c.created_at),
      likes: 0,
    };
    commentsByPost.set(c.post_id, [...(commentsByPost.get(c.post_id) ?? []), item]);
  }

  const appsByPost = new Map<string, number>();
  for (const a of appsRes.data ?? []) {
    appsByPost.set(a.post_id, (appsByPost.get(a.post_id) ?? 0) + 1);
  }

  const posts: Post[] = (postsRes.data ?? []).map((p) => {
    const likers = likesByPost.get(p.id) ?? [];
    const casting = p.casting_details
      ? { ...(p.casting_details as object), applicationCount: appsByPost.get(p.id) ?? 0 }
      : undefined;
    return {
      id: p.id,
      authorId: p.author_id,
      author: ghost(p.author_id),
      createdAt: timeAgo(p.created_at),
      type: p.type,
      content: p.content ?? {},
      castingDetails: casting,
      country: p.country,
      countryCode: p.country_code,
      language: p.language,
      likes: likers.length,
      isLiked: likers.includes(currentUserId),
      commentsCount: (commentsByPost.get(p.id) ?? []).length,
      comments: commentsByPost.get(p.id) ?? [],
      isSaved: savedPosts.has(p.id),
      isPortfolio: p.is_portfolio,
      portfolioRole: p.portfolio_role ?? undefined,
      tags: p.tags ?? [],
    } as Post;
  });

  const stories: StoryItem[] = (storiesRes.data ?? []).map((s) => ({
    id: s.id,
    author: ghost(s.author_id),
    mediaUrl: s.media_url,
    caption: s.caption,
    roleBadge: s.role_badge as CinemaRole,
    timestamp: timeAgo(s.created_at),
  }));

  const notifications: NotificationItem[] = (notifsRes.data ?? []).map((n) => ({
    id: n.id,
    type: n.type as NotificationItem["type"],
    actor: ghost(n.actor_id ?? currentUserId),
    message: n.message,
    targetPostId: n.target_post_id ?? undefined,
    timeAgo: timeAgo(n.created_at),
    read: n.read,
  }));

  const conversationRows = convRes.data ?? [];
  let conversations: DirectMessageConversation[] = [];
  if (conversationRows.length) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in(
        "conversation_id",
        conversationRows.map((c) => c.id),
      )
      .order("created_at", { ascending: true });
    conversations = conversationRows.map((c) => {
      const otherId = c.user_a === currentUserId ? c.user_b : c.user_a;
      const mine = (msgs ?? []).filter((m) => m.conversation_id === c.id);
      return {
        conversationId: c.id,
        participant: ghost(otherId),
        lastMessage: c.last_message,
        lastMessageTime: timeAgo(c.last_message_at),
        unreadCount: mine.filter((m) => !m.read && m.sender_id !== currentUserId).length,
        messages: mine.map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          text: m.text,
          time: timeAgo(m.created_at),
          isMe: m.sender_id === currentUserId,
        })),
      };
    });
  }

  const applications: Application[] = (appsRes.data ?? [])
    .filter((a) => a.applicant_id === currentUserId)
    .map((a) => ({
      id: a.id,
      postId: a.post_id,
      projectTitle: a.project_title,
      applicantId: a.applicant_id,
      applicant: ghost(a.applicant_id),
      selectedRole: a.selected_role as CinemaRole,
      coverNote: a.cover_note,
      portfolioUrl: a.portfolio_url,
      status: a.status as Application["status"],
      submittedAt: timeAgo(a.created_at),
    }));

  return {
    users,
    posts,
    stories,
    followingIds: follows
      .filter((f) => f.follower_id === currentUserId)
      .map((f) => f.following_id),
    notifications,
    conversations,
    applications,
  };
}

/* -------------------------------- mutations ------------------------------- */

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  } else {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  if (saved) {
    await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
  } else {
    await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
  }
}

export async function toggleFollow(targetId: string, userId: string, follow: boolean) {
  if (follow) {
    await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
    await supabase.from("notifications").insert({
      user_id: targetId,
      actor_id: userId,
      type: "new_follower",
      message: "started following you on KinoTribe.",
    });
  } else {
    await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
  }
}

export async function addComment(postId: string, userId: string, text: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userId, text })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPost(post: Post, userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      type: post.type,
      content: post.content,
      casting_details: (post.castingDetails ?? null) as never,
      country: post.country,
      country_code: post.countryCode,
      language: post.language,
      tags: post.tags,
      is_portfolio: post.isPortfolio ?? false,
      portfolio_role: post.portfolioRole ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createStory(
  userId: string,
  mediaUrl: string,
  caption: string,
  roleBadge: string,
) {
  const { error } = await supabase
    .from("stories")
    .insert({ author_id: userId, media_url: mediaUrl, caption, role_badge: roleBadge });
  if (error) throw error;
}

export async function submitApplication(app: Application, userId: string, postAuthorId: string) {
  const { error } = await supabase.from("applications").insert({
    post_id: app.postId,
    applicant_id: userId,
    project_title: app.projectTitle,
    selected_role: app.selectedRole,
    cover_note: app.coverNote,
    portfolio_url: app.portfolioUrl,
  });
  if (error) throw error;
  await supabase.from("notifications").insert({
    user_id: postAuthorId,
    actor_id: userId,
    type: "application_status",
    message: `applied for "${app.projectTitle}".`,
    target_post_id: app.postId,
  });
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function getOrCreateConversation(userId: string, otherId: string) {
  const [a, b] = [userId, otherId].sort();
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_a: a, user_b: b })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function sendMessage(conversationId: string, userId: string, text: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, text });
  if (error) throw error;
  await supabase
    .from("conversations")
    .update({ last_message: text, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
  if (error) throw error;
}

export async function getMyProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return null;
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return mapProfile(data as ProfileRow, {
    followers: followers ?? 0,
    following: following ?? 0,
  });
}
