import { supabase } from "@/integrations/supabase/client";
import { MOCK_USERS, MOCK_POSTS, MOCK_STORIES } from "../data/mockCinemaData";
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

export const GUEST_USER_ID = "guest_filmmaker";

export const GUEST_USER: User = {
  id: GUEST_USER_ID,
  name: "Maya Chen",
  username: "mayachen_film",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  coverImage:
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
  bio: "Indie filmmaker & director. Exploring diaspora memory through 16mm & neon cinema.",
  country: "United States",
  countryCode: "US",
  languages: ["English", "Mandarin"],
  roles: ["Directing", "Screenwriting"],
  experienceLevel: "Experienced",
  portfolioUrl: "https://mayachen.cinema",
  imdbUrl: "https://imdb.com/name/nm0001",
  followersCount: 0,
  followingCount: 0,
  isVerified: true,
  joinedDate: "Joined March 2026",
};

export function isGuestId(id?: string | null): boolean {
  return !id || id === GUEST_USER_ID || id === "demo_guest" || id.startsWith("guest_");
}

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
  const readFileAsDataUrl = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1920;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(reader.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
          img.onerror = () => resolve(reader.result as string);
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(f);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      }
    });

  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      return await readFileAsDataUrl(file);
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      console.warn("Supabase storage upload failed, using local file URL:", error);
      return await readFileAsDataUrl(file);
    }
    const { data, error: signErr } = await supabase.storage
      .from("media")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr || !data?.signedUrl) {
      return await readFileAsDataUrl(file);
    }
    return data.signedUrl;
  } catch (err) {
    console.warn("Storage upload exception, fallback to data URL:", err);
    return await readFileAsDataUrl(file);
  }
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
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80";

export function mapProfile(
  row: ProfileRow,
  counts?: { followers: number; following: number },
): User {
  return {
    id: row.id,
    name: row.name || row.username || "Filmmaker",
    username: row.username || "filmmaker",
    avatar: row.avatar || FALLBACK_AVATAR,
    coverImage: row.cover_image || undefined,
    bio: row.bio || "",
    country: row.country || "Global",
    countryCode: row.country_code || "US",
    city: row.city ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    languages: row.languages?.length ? row.languages : ["English"],
    roles: (row.roles?.length ? row.roles : ["Directing"]) as CinemaRole[],
    experienceLevel: (row.experience_level || "Newcomer") as ExperienceLevel,
    portfolioUrl: row.portfolio_url || undefined,
    imdbUrl: row.imdb_url || undefined,
    instagramUrl: row.instagram_url || undefined,
    showreelVideoUrl: row.showreel_video_url || undefined,
    followersCount: counts?.followers ?? 0,
    followingCount: counts?.following ?? 0,
    isVerified: row.is_verified,
    joinedDate: `Joined ${new Date(row.created_at || Date.now()).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })}`,
  };
}

/* ----------------------------- guest storage ----------------------------- */

function getGuestStore<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setGuestStore<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // quota exceeded or private mode
  }
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
  receivedApplications?: Application[];
}

export async function loadEverything(currentUserId: string): Promise<FeedData> {
  const isGuest = isGuestId(currentUserId);
  const now = Date.now();

  const isMockPost = (id: string) => MOCK_POSTS.some((m) => m.id === id);
  const rawStoredPosts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
  const storedPosts = rawStoredPosts.filter((p) => !isMockPost(p.id));
  if (storedPosts.length !== rawStoredPosts.length) {
    setGuestStore("cinetribe_guest_posts", storedPosts);
  }

  const storedStories = getGuestStore<StoryItem[]>("cinetribe_guest_stories", [])
    .filter((s) => {
      let created = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      if (!created) {
        const match = s.id.match(/\d{10,}/);
        if (match) created = parseInt(match[0], 10);
      }
      if (!created) return true;
      return now - created < 24 * 60 * 60 * 1000;
    })
    .map((s) => {
      let createdIso = s.createdAt;
      if (!createdIso) {
        const match = s.id.match(/\d{10,}/);
        if (match) {
          const t = parseInt(match[0], 10);
          if (!isNaN(t)) createdIso = new Date(t).toISOString();
        }
      }
      return {
        ...s,
        createdAt: createdIso || s.createdAt,
        timestamp: createdIso ? timeAgo(createdIso) : s.timestamp || "Just now",
      };
    });

  const storedApps = getGuestStore<Application[]>("cinetribe_guest_applications", []);
  const storedNotifs = getGuestStore<NotificationItem[]>("cinetribe_guest_notifications", [
    {
      id: "notif_welcome",
      type: "casting_match",
      actor: GUEST_USER,
      message: "Welcome to Cinetribe! Create your first cinema post or casting call.",
      timeAgo: "Just now",
      read: false,
    },
  ]);
  const storedConvs = getGuestStore<DirectMessageConversation[]>(
    "cinetribe_guest_conversations",
    [],
  );
  const storedFollows = getGuestStore<string[]>("cinetribe_guest_follows", []);

  // Query Supabase for network-wide public data (profiles, posts, stories, etc.)
  try {
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
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
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
        experienceLevel: "Newcomer",
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
        city: (p as { city?: string | null }).city ?? undefined,
        latitude: (p as { latitude?: number | null }).latitude ?? undefined,
        longitude: (p as { longitude?: number | null }).longitude ?? undefined,
        language: p.language,
        likes: likers.length,
        isLiked: likers.includes(currentUserId),
        commentsCount: (commentsByPost.get(p.id) ?? []).length,
        comments: commentsByPost.get(p.id) ?? [],
        isSaved: savedPosts.has(p.id),
        isPortfolio: p.is_portfolio,
        portfolioRole: p.portfolio_role ?? undefined,
        tags: p.tags ?? [],
        taggedUsers: (p.content as any)?.taggedUsers ?? (p as any).tagged_users ?? undefined,
      } as Post;
    });

    const stories: StoryItem[] = (storiesRes.data ?? []).map((s) => {
      let caption = s.caption || "";
      let linkedPostId: string | undefined = (s as any).linked_post_id ?? undefined;
      const match = caption.match(/\[linked_post:([^\]]+)\]/);
      if (match) {
        linkedPostId = match[1];
        caption = caption.replace(/\[linked_post:[^\]]+\]/, "").trim();
      }
      return {
        id: s.id,
        author: ghost(s.author_id),
        mediaUrl: s.media_url,
        caption,
        roleBadge: s.role_badge as CinemaRole,
        timestamp: timeAgo(s.created_at),
        createdAt: s.created_at,
        linkedPostId,
      };
    });

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

    const allApps = appsRes.data ?? [];
    const myApplications: Application[] = allApps
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

    const receivedApplications: Application[] = allApps
      .filter((a) => a.applicant_id !== currentUserId)
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

    const postIds = new Set<string>();
    const mergedPosts: Post[] = [];

    // 1. Locally stored / newly created posts (top priority, newest first)
    for (const p of storedPosts) {
      if (!postIds.has(p.id) && !isMockPost(p.id)) {
        postIds.add(p.id);
        mergedPosts.push(p);
      }
    }

    // 2. Supabase community posts
    for (const p of posts) {
      if (!postIds.has(p.id) && !isMockPost(p.id)) {
        postIds.add(p.id);
        mergedPosts.push(p);
      }
    }

    const isMockStory = (id: string) => MOCK_STORIES.some((m) => m.id === id);
    const cleanStoredStories = storedStories.filter((s) => !isMockStory(s.id));
    const mergedStories = [
      ...cleanStoredStories,
      ...stories.filter(
        (s) => !cleanStoredStories.some((ss) => ss.id === s.id) && !isMockStory(s.id),
      ),
    ];

    let mergedUsers = isGuest
      ? [GUEST_USER, ...users.filter((u) => u.id !== GUEST_USER_ID)]
      : users;
    if (mergedUsers.length <= 1 && MOCK_USERS.length > 0) {
      mergedUsers = [
        ...mergedUsers,
        ...MOCK_USERS.filter((mu) => !mergedUsers.some((u) => u.id === mu.id)),
      ];
    }
    const mergedFollows = isGuest
      ? storedFollows
      : follows.filter((f) => f.follower_id === currentUserId).map((f) => f.following_id);
    const mergedNotifs = isGuest ? storedNotifs : notifications;
    const mergedConvs = isGuest ? storedConvs : conversations;
    const mergedApps = isGuest ? storedApps : myApplications;

    return {
      users: mergedUsers,
      posts: mergedPosts,
      stories: mergedStories,
      followingIds: mergedFollows,
      notifications: mergedNotifs,
      conversations: mergedConvs,
      applications: mergedApps,
      receivedApplications: isGuest ? [] : receivedApplications,
    };
  } catch (err) {
    console.error("loadEverything query error:", err);
    return {
      users: MOCK_USERS.length > 0 ? MOCK_USERS : [GUEST_USER],
      posts: storedPosts,
      stories: storedStories,
      followingIds: storedFollows,
      notifications: storedNotifs,
      conversations: storedConvs,
      applications: storedApps,
      receivedApplications: [],
    };
  }
}

/* -------------------------------- mutations ------------------------------- */

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (isGuestId(userId)) {
    const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
    setGuestStore(
      "cinetribe_guest_posts",
      posts.map((p) =>
        p.id === postId ? { ...p, isLiked: liked, likes: liked ? p.likes + 1 : p.likes - 1 } : p,
      ),
    );
    return;
  }
  if (liked) {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  } else {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  if (isGuestId(userId)) {
    const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
    setGuestStore(
      "cinetribe_guest_posts",
      posts.map((p) => (p.id === postId ? { ...p, isSaved: saved } : p)),
    );
    return;
  }
  if (saved) {
    await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
  } else {
    await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
  }
}

export async function toggleFollow(targetId: string, userId: string, follow: boolean) {
  if (isGuestId(userId)) {
    const follows = getGuestStore<string[]>("cinetribe_guest_follows", []);
    const updated = follow ? [...follows, targetId] : follows.filter((id) => id !== targetId);
    setGuestStore("cinetribe_guest_follows", updated);
    return;
  }
  if (follow) {
    await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
    await supabase.from("notifications").insert({
      user_id: targetId,
      actor_id: userId,
      type: "new_follower",
      message: "started following you on Cinetribe.",
    });
  } else {
    await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
  }
}

export async function addComment(postId: string, userId: string, text: string) {
  if (isGuestId(userId)) {
    const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      author: GUEST_USER,
      text,
      createdAt: "Just now",
      likes: 0,
    };
    setGuestStore(
      "cinetribe_guest_posts",
      posts.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: p.commentsCount + 1, comments: [newComment, ...p.comments] }
          : p,
      ),
    );
    return newComment;
  }
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userId, text })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPost(post: Post, userId: string) {
  // Always immediately save post locally so it appears on the feed and is NEVER lost
  const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
  const newPost: Post = { ...post, id: post.id || `post_${Date.now()}`, authorId: userId };
  setGuestStore("cinetribe_guest_posts", [newPost, ...posts.filter((p) => p.id !== newPost.id)]);

  if (!isGuestId(userId)) {
    try {
      const postContent = {
        ...post.content,
        ...(post.taggedUsers && post.taggedUsers.length > 0
          ? { taggedUsers: post.taggedUsers }
          : {}),
      };
      await supabase.from("posts").insert({
        author_id: userId,
        type: post.type,
        content: postContent,
        casting_details: (post.castingDetails ?? null) as never,
        country: post.country,
        country_code: post.countryCode,
        language: post.language,
        tags: post.tags,
        is_portfolio: post.isPortfolio ?? false,
        portfolio_role: post.portfolioRole ?? null,
      });
    } catch (err) {
      console.warn("Supabase post sync issue, safely kept in local storage:", err);
    }
  }

  return newPost;
}

export async function deletePost(postId: string, userId: string) {
  if (isGuestId(userId)) {
    const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
    setGuestStore(
      "cinetribe_guest_posts",
      posts.filter((p) => p.id !== postId),
    );
    return;
  }
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId);
  if (error) throw error;
}

export async function updatePost(post: Post, userId: string) {
  if (isGuestId(userId)) {
    const posts = getGuestStore<Post[]>("cinetribe_guest_posts", []);
    setGuestStore(
      "cinetribe_guest_posts",
      posts.map((p) => (p.id === post.id ? post : p)),
    );
    return post;
  }
  const postContent = {
    ...post.content,
    ...(post.taggedUsers && post.taggedUsers.length > 0 ? { taggedUsers: post.taggedUsers } : {}),
  };
  const { data, error } = await supabase
    .from("posts")
    .update({
      type: post.type,
      content: postContent,
      casting_details: (post.castingDetails ?? null) as never,
      country: post.country,
      country_code: post.countryCode,
      language: post.language,
      tags: post.tags,
      is_portfolio: post.isPortfolio ?? false,
      portfolio_role: post.portfolioRole ?? null,
    })
    .eq("id", post.id)
    .eq("author_id", userId)
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
  linkedPostId?: string,
) {
  const stories = getGuestStore<StoryItem[]>("cinetribe_guest_stories", []);
  const now = new Date().toISOString();
  const newStory: StoryItem = {
    id: `story_${Date.now()}`,
    author: GUEST_USER,
    mediaUrl,
    caption,
    roleBadge: roleBadge as CinemaRole,
    timestamp: "Just now",
    createdAt: now,
    linkedPostId,
  };
  setGuestStore("cinetribe_guest_stories", [
    newStory,
    ...stories.filter((s) => s.id !== newStory.id),
  ]);

  if (!isGuestId(userId)) {
    try {
      const encodedCaption = linkedPostId
        ? `${caption} [linked_post:${linkedPostId}]`.trim()
        : caption;
      const res = await supabase
        .from("stories")
        .insert({
          author_id: userId,
          media_url: mediaUrl,
          caption: encodedCaption,
          role_badge: roleBadge,
          linked_post_id: linkedPostId,
        } as any)
        .select()
        .single();
      if (res.error && res.error.message?.includes("linked_post_id")) {
        await supabase.from("stories").insert({
          author_id: userId,
          media_url: mediaUrl,
          caption: encodedCaption,
          role_badge: roleBadge,
        } as any);
      }
    } catch (err) {
      console.warn("Supabase story sync issue, safely kept in local storage:", err);
    }
  }

  return newStory;
}

export async function deleteStory(storyId: string, userId: string) {
  if (isGuestId(userId)) {
    const stories = getGuestStore<StoryItem[]>("cinetribe_guest_stories", []);
    setGuestStore(
      "cinetribe_guest_stories",
      stories.filter((s) => s.id !== storyId),
    );
    return;
  }
  await supabase.from("stories").delete().eq("id", storyId).eq("author_id", userId);
}

export async function submitApplication(app: Application, userId: string, postAuthorId: string) {
  if (isGuestId(userId)) {
    const apps = getGuestStore<Application[]>("cinetribe_guest_applications", []);
    const newApp: Application = {
      ...app,
      id: `app_${Date.now()}`,
      applicantId: userId,
      applicant: GUEST_USER,
      status: "Submitted",
      submittedAt: "Just now",
    };
    setGuestStore("cinetribe_guest_applications", [newApp, ...apps]);
    return;
  }
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

export async function updateApplicationStatus(
  applicationId: string,
  status: "Submitted" | "Under Review" | "Shortlisted" | "Selected",
  userId: string,
  applicantId?: string,
  projectTitle?: string,
) {
  if (isGuestId(userId)) {
    const apps = getGuestStore<Application[]>("cinetribe_guest_applications", []);
    setGuestStore(
      "cinetribe_guest_applications",
      apps.map((a) => (a.id === applicationId ? { ...a, status } : a)),
    );
    return;
  }
  const { error } = await supabase.from("applications").update({ status }).eq("id", applicationId);
  if (error) throw error;
  if (applicantId && applicantId !== userId) {
    await supabase.from("notifications").insert({
      user_id: applicantId,
      actor_id: userId,
      type: "application_status",
      message: `Your application status for "${projectTitle || "Casting Call"}" is now: ${status}`,
    });
  }
}

export async function markAllNotificationsRead(userId?: string) {
  if (isGuestId(userId || '')) {
    const notifs = getGuestStore<NotificationItem[]>("cinetribe_guest_notifications", []);
    setGuestStore(
      "cinetribe_guest_notifications",
      notifs.map((n) => ({ ...n, read: true }))
    );
    return;
  }
  if (userId) {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }
}

export async function markNotificationRead(id: string, userId?: string) {
  if (isGuestId(userId)) {
    const notifs = getGuestStore<NotificationItem[]>("cinetribe_guest_notifications", []);
    setGuestStore(
      "cinetribe_guest_notifications",
      notifs.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    return;
  }
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function getOrCreateConversation(userId: string, otherId: string) {
  if (isGuestId(userId) || isGuestId(otherId)) {
    return `guest_conv_${otherId}`;
  }
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
  if (isGuestId(userId)) {
    const convs = getGuestStore<DirectMessageConversation[]>("cinetribe_guest_conversations", []);
    const existing = convs.find((c) => c.conversationId === conversationId);
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      text,
      time: "Just now",
      isMe: true,
    };
    if (existing) {
      setGuestStore(
        "cinetribe_guest_conversations",
        convs.map((c) =>
          c.conversationId === conversationId
            ? {
                ...c,
                lastMessage: text,
                lastMessageTime: "Just now",
                messages: [...c.messages, newMsg],
              }
            : c,
        ),
      );
    }
    return;
  }
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
  if (isGuestId(userId)) return;
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  if (isGuestId(userId)) {
    const current = getGuestStore<User>("cinetribe_guest_profile", GUEST_USER);
    const updated = { ...current, ...patch };
    setGuestStore("cinetribe_guest_profile", updated);
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update(patch as never)
    .eq("id", userId);
  if (error) throw error;
}

export async function getMyProfile(userId: string): Promise<User | null> {
  if (isGuestId(userId)) {
    return getGuestStore<User>("cinetribe_guest_profile", GUEST_USER);
  }

  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);
      return mapProfile(data as ProfileRow, {
        followers: followers ?? 0,
        following: following ?? 0,
      });
    }

    // Auto profile bootstrap fallback if trigger didn't run
    const { data: authData } = await supabase.auth.getUser();
    const email = authData?.user?.email || "";
    const meta = authData?.user?.user_metadata || {};
    const baseUsername =
      (meta["username"] || email.split("@")[0] || "filmmaker")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "") || "filmmaker";
    const uniqueUsername = `${baseUsername}_${userId.slice(0, 4)}`;

    const newProfile = {
      id: userId,
      name: meta["name"] || meta["full_name"] || baseUsername,
      username: uniqueUsername,
      avatar: meta["avatar_url"] || FALLBACK_AVATAR,
      bio: "Independent filmmaker on Cinetribe.",
      country: "United States",
      country_code: "US",
      languages: ["English"],
      roles: ["Directing"],
      experience_level: "Newcomer",
    };

    await supabase.from("profiles").upsert(newProfile);

    return mapProfile(
      {
        ...newProfile,
        cover_image: null,
        portfolio_url: null,
        imdb_url: null,
        instagram_url: null,
        showreel_video_url: null,
        is_verified: false,
        created_at: new Date().toISOString(),
      } as ProfileRow,
      { followers: 0, following: 0 },
    );
  } catch (err) {
    console.error("getMyProfile error or fallback:", err);
    return {
      id: userId,
      name: "Filmmaker",
      username: "filmmaker",
      avatar: FALLBACK_AVATAR,
      bio: "Cinema creator on Cinetribe",
      country: "Global",
      countryCode: "US",
      languages: ["English"],
      roles: ["Directing"],
      experienceLevel: "Newcomer",
      followersCount: 0,
      followingCount: 0,
      joinedDate: "Joined recently",
    };
  }
}
