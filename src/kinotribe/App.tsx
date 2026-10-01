import React, { useState, useEffect } from "react";
import { hapticNavSnap } from "./utils/haptics";
import {
  Film,
  Compass,
  MonitorPlay,
  CircleUser as UserIcon,
  Bell,
  Send,
  CircleUser,
  MessageSquare,
  Globe,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Plus,
  Heart,
  Bookmark,
  ChevronRight,
  LogOut,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Settings,
  PlaySquare,
  Home,
  Search,
  MessageCircle,
} from "lucide-react";

import {
  User,
  Post,
  StoryItem,
  NotificationItem,
  DirectMessageConversation,
  Application,
  FeedFilterMode,
  CinemaRole,
} from "./types";

import { supabase } from "@/integrations/supabase/client";
import * as api from "./lib/api";
import { AuthGate } from "./components/auth/AuthGate";
import { COUNTRIES_DATA } from "./data/mockCinemaData";
import { useIsMobile } from "@/hooks/use-mobile";

import { PostCard } from "./components/feed/PostCard";
import { StoryBar } from "./components/stories/StoryBar";
import { StoryViewerModal } from "./components/stories/StoryViewerModal";
import { CommentsSheet } from "./components/feed/CommentsSheet";
import { ShareModal } from "./components/modals/ShareModal";
import { ApplyCastingModal } from "./components/modals/ApplyCastingModal";
import { CreatePostModal } from "./components/modals/CreatePostModal";
import { CreateStoryModal } from "./components/modals/CreateStoryModal";
import { PostDetailModal } from "./components/feed/PostDetailModal";
import { getSavedLocation, distanceKm, type GeoLocation } from "./lib/geo";
import { RegionFilterModal } from "./components/feed/RegionFilterModal";
import { SettingsMenu } from "./components/profile/SettingsMenu";
import { CastingExploreTab } from "./components/casting/CastingExploreTab";
import { SearchExploreTab } from "./components/explore/SearchExploreTab";
import { ProfileView } from "./components/profile/ProfileView";
import { NotificationsDrawer } from "./components/notifications/NotificationsDrawer";
import { DirectMessagesDrawer } from "./components/messages/DirectMessagesDrawer";
import { AuthModal } from "./components/auth/AuthModal";

type MainTab = "feed" | "explore" | "casting" | "profile";

export default function App() {
  const [session, setSession] = useState<{ userId: string } | null | undefined>(undefined);
  const [boot, setBoot] = useState<{ me: User; data: api.FeedData } | null>(null);

  useEffect(() => {
    localStorage.removeItem("cinetribe_guest");
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { userId: data.session.user.id } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/reset-password";
        return;
      }
      setSession((prev) => {
        const next = s ? { userId: s.user.id } : null;
        return prev?.userId === next?.userId ? prev : next;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const [bootError, setBootError] = useState("");
  useEffect(() => {
    setBoot(null);
    setBootError("");
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        let me = await api.getMyProfile(session.userId);
        if (!me) {
          await new Promise((r) => setTimeout(r, 1200));
          me = await api.getMyProfile(session.userId);
        }
        const data = await api.loadEverything(session.userId);
        if (cancelled) return;
        if (me) setBoot({ me, data });
        else setBootError("We couldn't load your profile.");
      } catch (err) {
        console.error("Boot error:", err);
        if (!cancelled) setBootError("Something went wrong loading your account.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (session === null) return <AuthGate />;
  if (bootError)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-muted-foreground text-sm">
        <p>{bootError}</p>
        <button
          className="rounded-full bg-[var(--theme-color)] text-white px-5 py-2 font-bold"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    );

  if (session === null) return <AuthGate />;
  if (!boot)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-muted-foreground text-sm">
        Loading Cinetribe…
      </div>
    );
  return (
    <KinoApp
      key={boot.me.id}
      me={boot.me}
      initial={boot.data}
      onSignOut={() => {
        localStorage.removeItem("cinetribe_guest");
        setSession(null);
        setBoot(null);
      }}
    />
  );
}

function KinoApp({
  me,
  initial,
  onSignOut,
}: {
  me: User;
  initial: api.FeedData;
  onSignOut?: () => void;
}) {
  const CURRENT_USER = me;
  const MOCK_USERS = initial.users.filter((u) => u.id !== me.id);

  // App state
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>(initial.posts);
  const [stories, setStories] = useState<StoryItem[]>(initial.stories);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.notifications);
  const [conversations, setConversations] = useState<DirectMessageConversation[]>(
    initial.conversations,
  );
  const [myApplications, setMyApplications] = useState<Application[]>(initial.applications);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>(
    initial.receivedApplications ?? [],
  );
  const [followingIds, setFollowingIds] = useState<string[]>(initial.followingIds);

  // View navigation
  const [activeTab, setActiveTab] = useState<MainTab>("feed");
  const [viewedProfileUser, setViewedProfileUser] = useState<User>(CURRENT_USER);

  // Region & Language Feed Filters
  const [feedMode, setFeedMode] = useState<FeedFilterMode>("global");
  const [activeBrowseCountry, setActiveBrowseCountry] = useState<string>(CURRENT_USER.country);
  const [myLocation, setMyLocation] = useState<GeoLocation | null>(() => getSavedLocation());
  const [nearbyRadius, setNearbyRadius] = useState<number>(25);
  useEffect(() => {
    const h = (e: Event) => {
      const loc = (e as CustomEvent<GeoLocation>).detail;
      setMyLocation(loc);
      api.saveMyLocation(CURRENT_USER.id, loc);
    };
    window.addEventListener("ct-location", h);
    return () => window.removeEventListener("ct-location", h);
  }, [CURRENT_USER.id]);
  const [activeBrowseLanguage, setActiveBrowseLanguage] = useState<string>(
    CURRENT_USER.languages[0] || "English",
  );

  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(false);
  const isMobileDevice = useIsMobile();
  const [isFeedDropdownOpen, setIsFeedDropdownOpen] = useState<boolean>(false);
  const [feedFilterCategory, setFeedFilterCategory] = useState<
    "all" | "following" | "casting_only"
  >("all");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    // Load preferred theme if exists
    const savedColor = localStorage.getItem("app_theme_color");
    const savedHover = localStorage.getItem("app_theme_hover");
    if (savedColor) document.documentElement.style.setProperty("--theme-color", savedColor);
    if (savedHover) document.documentElement.style.setProperty("--theme-hover", savedHover);
  }, []);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<"login" | "signup">("signup");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialMode, setCreateInitialMode] = useState<"regular" | "casting">("regular");
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Detail / Interaction modals
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [activePostForShare, setActivePostForShare] = useState<Post | null>(null);
  const [activePostForApply, setActivePostForApply] = useState<Post | null>(null);
  const [embeddedPostForGlimpse, setEmbeddedPostForGlimpse] = useState<Post | null>(null);
  const [activePostForDetail, setActivePostForDetail] = useState<Post | null>(null);
  const [activePostForEdit, setActivePostForEdit] = useState<Post | null>(null);

  // Story Viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState<boolean>(false);

  // Unread counts
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (isNotificationsOpen && unreadNotifsCount > 0) {
      api.markAllNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [isNotificationsOpen, unreadNotifsCount, currentUser.id]);
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const refresh = async () => {
    const d = await api.loadEverything(me.id);
    setPosts(d.posts);
    setStories(d.stories);
    setNotifications(d.notifications);
    setConversations(d.conversations);
    setMyApplications(d.applications);
    setReceivedApplications(d.receivedApplications ?? []);
    setFollowingIds(d.followingIds);
  };

  const handleStoryCreated = async (
    mediaUrl: string,
    caption: string,
    roleBadge: string,
    linkedPostId?: string,
  ) => {
    await api.createStory(me.id, mediaUrl, caption, roleBadge, linkedPostId);
    await refresh();
  };

  const handleDeleteStory = async (storyId: string) => {
    await api.deleteStory(storyId, me.id);
    await refresh();
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: Application["status"],
    applicantId?: string,
    projectTitle?: string,
  ) => {
    await api.updateApplicationStatus(applicationId, status, me.id, applicantId, projectTitle);
    await refresh();
  };

  // Like toggle handler
  const handleLikeToggle = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const isLiked = !target.isLiked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked, likes: isLiked ? p.likes + 1 : p.likes - 1 } : p,
      ),
    );
    api.toggleLike(postId, me.id, isLiked);
  };

  // Save/bookmark toggle handler
  const handleSaveToggle = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)));
    api.toggleSave(postId, me.id, !target.isSaved);
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (activePostForComments?.id === postId) setActivePostForComments(null);
    if (activePostForDetail?.id === postId) setActivePostForDetail(null);
    try {
      await api.deletePost(postId, me.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditPost = (post: Post) => {
    setActivePostForEdit(post);
    setIsCreateOpen(true);
  };

  // Follow/Unfollow toggle handler
  const handleFollowToggle = (userId: string) => {
    if (userId === me.id) return;
    const follow = !followingIds.includes(userId);
    setFollowingIds((prev) => (follow ? [...prev, userId] : prev.filter((id) => id !== userId)));
    api.toggleFollow(userId, me.id, follow);
  };

  // Add Comment handler
  const handleAddComment = async (postId: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      author: currentUser,
      text,
      createdAt: "Just now",
      likes: 0,
    };
    const add = (p: Post) =>
      p.id === postId
        ? { ...p, commentsCount: p.commentsCount + 1, comments: [newComment, ...p.comments] }
        : p;
    setPosts((prev) => prev.map(add));
    setActivePostForComments((prev) => (prev ? add(prev) : null));
    try {
      await api.addComment(postId, me.id, text);
      const post = posts.find((p) => p.id === postId);
      if (post && post.author.id !== me.id) {
        await supabase.from("notifications").insert({
          user_id: post.author.id,
          actor_id: me.id,
          type: "comment",
          message: `commented: "${text.slice(0, 80)}"`,
          target_post_id: postId,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Apply to casting post
  const handleSubmitApplication = async (application: Application) => {
    const post = posts.find((p) => p.id === application.postId);
    try {
      await api.submitApplication(application, me.id, post?.author.id ?? me.id);
      await refresh();
    } catch (e) {
      alert(
        e instanceof Error && e.message.includes("duplicate")
          ? "You already applied to this casting call."
          : "Could not submit application.",
      );
    }
  };

  // Create post handler
  const handlePostCreated = async (newPost: Post) => {
    const preparedPost: Post = {
      ...newPost,
      authorId: me.id,
      author: currentUser,
      createdAt: "Just now",
    };

    // 1. Optimistically display at the top of the feed immediately
    setPosts((prev) => [preparedPost, ...prev.filter((p) => p.id !== preparedPost.id)]);
    setActiveTab("feed");
    setFeedMode("global");
    setFeedFilterCategory("all");

    // Scroll to top of feed
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mobileScroll = document.getElementById("mobile-scroll-container");
    if (mobileScroll) mobileScroll.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const created = await api.createPost(preparedPost, me.id);
      if (created && created.id) {
        setPosts((prev) =>
          prev.map((p) => (p.id === preparedPost.id ? { ...p, id: created.id } : p)),
        );
      }
      await refresh();
    } catch (e) {
      alert("Could not publish post: " + (e instanceof Error ? e.message : ""));
    }
  };

  const handlePostUpdated = async (updatedPost: Post) => {
    try {
      await api.updatePost(updatedPost, me.id);
      await refresh();
    } catch (e) {
      alert("Could not update post: " + (e instanceof Error ? e.message : ""));
    }
  };
  const handleAddPostToGlimpse = async (post: Post) => {
    setEmbeddedPostForGlimpse(post);
    setIsStoryModalOpen(true);
    setActivePostForShare(null);
  };

  // Send Direct Message
  const handleSendMessage = async (conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: "Just now",
              messages: [
                ...c.messages,
                { id: `msg_${Date.now()}`, senderId: me.id, text, time: "Just now", isMe: true },
              ],
            }
          : c,
      ),
    );
    await api.sendMessage(conversationId, me.id, text);
  };

  const handleOpenMessage = async (u: User) => {
    if (u.id !== me.id) {
      await api.getOrCreateConversation(me.id, u.id);
      await refresh();
    }
    setIsMessagesOpen(true);
  };

  // Realtime: new messages & notifications
  // Realtime: new posts, stories, messages & notifications
  useEffect(() => {
    const ch = supabase
      .channel("kt-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        if ((p.new as { sender_id: string }).sender_id !== me.id) refresh();
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${me.id}`,
        },
        () => refresh(),
      )
      .subscribe();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cinetribe_guest_posts" || e.key === "cinetribe_guest_stories") {
        refresh();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("storage", handleStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);

  // User click router
  const handleUserClick = (user: User) => {
    setViewedProfileUser(user);
    setActiveTab("profile");
    setIsNotificationsOpen(false);
    setActivePostForDetail(null);
    setActivePostForComments(null);
    setIsStoryViewerOpen(false);
  };

  // Filter feed based on Regional vs Global vs Custom & Category
  const visibleFeedPosts = posts.filter((post) => {
    // Category filter: Following or Casting only
    if (feedFilterCategory === "casting_only" && post.type !== "casting") {
      return false;
    }
    if (
      feedFilterCategory === "following" &&
      !followingIds.includes(post.author.id) &&
      post.author.id !== currentUser.id
    ) {
      return false;
    }

    // Current user's own posts should always be visible on their feed
    const isOwnPost =
      post.author.id === currentUser.id ||
      post.authorId === currentUser.id ||
      Boolean(
        post.author?.username &&
        currentUser.username &&
        post.author.username === currentUser.username,
      );
    if (isOwnPost) return true;

    if (feedMode === "global") return true;

    if (feedMode === "nearby") {
      if (!myLocation || post.latitude == null || post.longitude == null) return false;
      return (
        distanceKm(myLocation.latitude, myLocation.longitude, post.latitude, post.longitude) <=
        nearbyRadius
      );
    }

    if (feedMode === "regional") {
      // Filter by user's country or language
      const postCountry = (post.country || "").trim().toLowerCase();
      const userCountry = (currentUser.country || "").trim().toLowerCase();
      const matchCountry = postCountry && userCountry && postCountry === userCountry;

      const postLang = (post.language || "").trim().toLowerCase();
      const matchLang =
        currentUser.languages &&
        currentUser.languages.some((l) => l.trim().toLowerCase() === postLang);
      return matchCountry || matchLang;
    }

    if (feedMode === "custom") {
      const postCountry = (post.country || "").trim().toLowerCase();
      const targetCountry = (activeBrowseCountry || "").trim().toLowerCase();
      const matchCountry = postCountry && targetCountry && postCountry === targetCountry;

      const postLang = (post.language || "").trim().toLowerCase();
      const targetLang = (activeBrowseLanguage || "").trim().toLowerCase();
      const matchLang = postLang && targetLang && postLang === targetLang;
      return matchCountry || matchLang;
    }

    return true;
  });
  if (feedMode === "nearby" && myLocation) {
    const d = (p: Post) =>
      p.latitude == null || p.longitude == null
        ? Infinity
        : distanceKm(myLocation.latitude, myLocation.longitude, p.latitude, p.longitude);
    visibleFeedPosts.sort((a, b) => d(a) - d(b));
  }

  const activeCountryObj = COUNTRIES_DATA.find((c) => c.name === activeBrowseCountry);
  const userCountryObj = COUNTRIES_DATA.find((c) => c.name === currentUser.country);

  const renderFeedChannelDropdown = (isMobile = false) => {
    if (!isFeedDropdownOpen) return null;

    const channels = [
      {
        id: "global",
        title: "Global",
        icon: Globe,
        active: feedMode === "global" && feedFilterCategory === "all",
        onClick: () => {
          setFeedMode("global");
          setFeedFilterCategory("all");
          setIsFeedDropdownOpen(false);
          setActiveTab("feed");
        },
      },
      {
        id: "regional",
        title: "Regional",
        icon: MapPin,
        active: feedMode === "regional" && feedFilterCategory === "all",
        onClick: () => {
          setFeedMode("regional");
          setFeedFilterCategory("all");
          setIsFeedDropdownOpen(false);
          setActiveTab("feed");
        },
      },
      {
        id: "following",
        title: "Following",
        icon: Sparkles,
        active: feedFilterCategory === "following",
        onClick: () => {
          setFeedFilterCategory("following");
          setIsFeedDropdownOpen(false);
          setActiveTab("feed");
        },
      },
    ];

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40" onClick={() => setIsFeedDropdownOpen(false)} />

        {/* Instagram-style minimal dropdown sheet */}
        <div
          className={`absolute top-full left-0 mt-2 ${
            isMobile ? "w-[220px]" : "w-[220px]"
          } rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/[0.10] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden z-50 tab-content-enter select-none`}
        >
          {channels.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={ch.onClick}
                className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors active:bg-muted ${
                  i < channels.length - 1 ? "border-b border-white/[0.07]" : ""
                } ${ch.active ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"}`}
              >
                <span
                  className={`text-[15px] font-medium tracking-tight ${
                    ch.active ? "text-foreground font-semibold" : "text-neutral-200"
                  }`}
                >
                  {ch.title}
                </span>
                <Icon
                  className={`w-[18px] h-[18px] stroke-[1.8] shrink-0 ${
                    ch.active ? "text-foreground" : "text-muted-foreground"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderMobileHeader = () => (
    <header
      className={`sticky top-0 z-30 px-3.5 py-2.5 flex items-center justify-between select-none shrink-0 transition-colors bg-black border-none`}
    >
      {activeTab === "profile" ? (
        // Profile mode: Left Settings, Middle Username, Right actions
        <>
          {/* Left: Settings */}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              setIsFeedDropdownOpen(false);
            }}
            className="w-8 h-8 flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <Settings className="w-6 h-6" />
          </button>

          {/* Middle: Username with Dropdown Chevron */}
          <button
            onClick={() => setIsFeedDropdownOpen(!isFeedDropdownOpen)}
            className="flex flex-1 items-center justify-center gap-1 font-bold text-foreground text-[16px] active:scale-95 transition-transform"
          >
            {viewedProfileUser?.username || currentUser.username}
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isFeedDropdownOpen ? "rotate-180 text-foreground" : ""}`}
            />
          </button>

          {/* Right: + and Notifications */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreateInitialMode("regular");
                setIsCreateOpen(true);
              }}
              className="w-7 h-7 rounded-full border-[1.5px] border-white flex items-center justify-center text-foreground active:scale-95 transition-all"
              title="Create Post or Story"
            >
              <Plus className="w-5 h-5 stroke-[2]" />
            </button>
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative w-8 h-8 flex items-center justify-center text-foreground active:scale-95 transition-all"
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FF453A] border-[1.5px] border-black" />
              )}
            </button>
          </div>

          {/* Reusing Mobile Frosted Dropdown Menu but adapted for profiles if needed */}
          {renderFeedChannelDropdown(true)}
        </>
      ) : (
        // Normal feed mode: Cinetribe logo, dropdown
        <>
          {/* Left: Brand Squircle + Channel Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFeedDropdownOpen(!isFeedDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none active:scale-95 transition-transform"
              title="Switch Feed Channel or Region"
            >

              <div className="text-left min-w-0">
                <span className="font-brand font-black text-base text-foreground tracking-tight flex items-center gap-1 leading-none">
                  Cinetribe
                  <ChevronDown
                    className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                      isFeedDropdownOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </span>
              </div>
            </button>

            {/* Mobile Frosted Dropdown Menu */}
            {renderFeedChannelDropdown(true)}
          </div>

          {/* Right: Mobile Action Cluster */}
          <div className="flex items-center gap-1.5">
            {/* + Create Button (icon only) */}
            <button
              onClick={() => {
                setCreateInitialMode("regular");
                setIsCreateOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] text-foreground font-bold flex items-center justify-center active:scale-95 transition-all opacity-90"
              title="Create Post or Story"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Notifications Icon with Red Dot */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-foreground active:scale-95 transition-all border border-border"
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[1.5]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF453A] text-foreground font-bold text-[8px] flex items-center justify-center border border-white" />
              )}
            </button>
          </div>
        </>
      )}
    </header>
  );

  const renderMobileDock = (isInsideFrame = false) => (
    <nav
      onWheel={(e) => {
        if (isInsideFrame) {
          const scroller = document.getElementById("mobile-scroll-container");
          if (scroller) scroller.scrollTop += e.deltaY;
        }
      }}
      className={`${
        isInsideFrame
          ? "absolute bottom-2.5 left-2.5 right-2.5 rounded-[26px]"
          : "fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-sm mx-auto rounded-[30px]"
      } z-50 bg-[#0E1118] border border-border px-2 pt-1.5 pb-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col select-none pointer-events-auto transform-gpu transition-colors`}
      style={{
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      <div className="flex items-center justify-around">
        {/* 1. Feed / Film */}
        <button
          onClick={() => {
            hapticNavSnap();
            setActiveTab("feed");
            if (isInsideFrame) {
              const el = document.getElementById("mobile-scroll-container");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 spring-scale ${
            activeTab === "feed" ? "text-[var(--theme-color)] font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Film Feed"
        >
          <div
            className={`p-1 rounded-xl transition-all duration-200 ${activeTab === "feed" ? "bg-[var(--theme-color)]/20 text-[var(--theme-color)]" : ""}`}
          >
            <Home className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Home</span>
        </button>

        {/* 2. Search / Discover */}
        <button
          onClick={() => {
            hapticNavSnap();
            setActiveTab("explore");
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 spring-scale ${
            activeTab === "explore"
              ? "text-[var(--theme-color)] font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Search Talent & Stories"
        >
          <div
            className={`p-1 rounded-xl transition-all duration-200 ${activeTab === "explore" ? "bg-[var(--theme-color)]/20 text-[var(--theme-color)]" : ""}`}
          >
            <Search className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Search</span>
        </button>

        {/* 3. Middle: Casting Hub */}
        <button
          onClick={() => {
            hapticNavSnap();
            setActiveTab("casting");
            if (isInsideFrame) {
              const el = document.getElementById("mobile-scroll-container");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex flex-col items-center justify-center px-2 py-1 spring-scale shrink-0"
          title="Casting Hub & Auditions"
        >
          <div
            className={`w-9 h-8 rounded-[12px] flex items-center justify-center shadow-md transition-all duration-200 ${
              activeTab === "casting"
                ? "bg-gradient-to-tr from-[var(--theme-color)] to-[#000000] text-foreground shadow-[var(--theme-color)]/40"
                : "bg-muted hover:bg-black/20 text-neutral-300 border border-white/15"
            }`}
          >
            <Film className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span
            className={`text-[9px] tracking-tight mt-0.5 font-semibold transition-colors duration-200 ${
              activeTab === "casting" ? "text-white" : "text-muted-foreground"
            }`}
          >
            Casting
          </span>
        </button>

        {/* 4. Chat */}
        <button
          onClick={() => {
            hapticNavSnap();
            setIsMessagesOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 spring-scale ${
            isMessagesOpen ? "text-[var(--theme-color)] font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Chat"
        >
          <div
            className={`relative p-1 rounded-xl transition-all ${isMessagesOpen ? "bg-[var(--theme-color)]/20 text-[var(--theme-color)]" : ""}`}
          >
            <MessageCircle className="w-5 h-5 stroke-[1.5]" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-0.5 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#FF453A] text-foreground font-bold text-[9px] flex items-center justify-center border border-white shadow">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Chat</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => {
            hapticNavSnap();
            setViewedProfileUser(currentUser);
            setActiveTab("profile");
            if (isInsideFrame) {
              const el = document.getElementById("mobile-scroll-container");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 spring-scale ${
            activeTab === "profile"
              ? "text-[var(--theme-color)] font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Profile"
        >
          <div
            className={`w-6 h-6 rounded-full p-[1px] overflow-hidden transition-all ${
              activeTab === "profile"
                ? "ring-2 ring-[var(--theme-color)] shadow-[0_0_8px_var(--theme-color)] opacity-80"
                : "opacity-85"
            }`}
          >
            <img
              src={currentUser.avatar}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div
      className={`${
        isMobileFrameView ? "h-screen max-h-screen overflow-hidden" : "min-h-screen min-h-[100dvh]"
      } bg-black text-[#FAF9F5] selection:bg-[var(--theme-color)] selection:text-[#FAF9F5] flex flex-col font-sans transition-colors duration-200 antialiased`}
    >
      {/* Top Desktop Control Bar when Phone Preview is active */}
      {!isMobileDevice && isMobileFrameView && (
        <div className="w-full pt-2 pb-1 px-4 flex items-center justify-center shrink-0 z-30">
          <div className="flex items-center justify-between w-full max-w-[393px] px-3.5 py-1.5 rounded-2xl apple-glass-subtle border border-border shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-xs font-semibold text-neutral-200">
                iPhone 16 Pro Viewport (393px)
              </span>
            </div>
            <button
              onClick={() => setIsMobileFrameView(false)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-color)] text-foreground font-bold text-xs shadow-md transition-all active:scale-95"
              title="Return to full desktop web layout"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop View</span>
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL MACOS & IOS FROSTED GLASS NAVIGATION BAR (Desktop Only) */}
      {!isMobileFrameView && !isMobileDevice && (
        <header className="sticky top-0 z-40 apple-glass border-b border-white/[0.12] px-4 py-2.5 flex items-center justify-between transition-colors shadow-lg">
          {/* Zone 1: Kinotribe Brand Wordmark & Feed Channel Selector */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setIsFeedDropdownOpen(!isFeedDropdownOpen)}
              className="flex items-center gap-2.5 focus:outline-none group py-1 active:scale-[0.98] transition-transform"
              title="Switch Feed Channel or Region"
            >

              <div className="text-left">
                <span className="font-brand font-black text-lg tracking-tight text-foreground group-hover:text-white transition-colors flex items-center gap-1 leading-none">
                  Cinetribe
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-transform duration-200 ${
                      isFeedDropdownOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  <span className="truncate max-w-[180px]">
                    {feedFilterCategory === "following"
                      ? "Following Feed"
                      : feedFilterCategory === "casting_only"
                        ? "Casting & Auditions"
                        : feedMode === "nearby"
                          ? `Near ${myLocation?.city || "you"} · ${nearbyRadius} km`
                          : feedMode === "global"
                          ? "Global Cinema Stream"
                          : `${currentUser.country} Cinema`}
                  </span>
                </div>
              </div>
            </button>

            {/* Desktop Frosted Dropdown Menu */}
            {renderFeedChannelDropdown(false)}

            {/* Quick Region Selector Capsule on Desktop */}
            <button
              onClick={() => setIsRegionFilterOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full apple-glass-subtle border border-border hover:border-white/50 text-xs text-neutral-200 transition-colors ml-2"
              title="Change Feed Country & Language"
            >
              <MapPin className="w-3 h-3 text-white" />
              <span className="font-medium">
                {feedMode === "nearby"
                  ? `📍 ${myLocation?.city || "Nearby"} · ${nearbyRadius} km`
                  : feedMode === "global"
                  ? "🌐 Global"
                  : feedMode === "regional"
                    ? `${userCountryObj?.flag || "📍"} ${currentUser.country}`
                    : `${activeCountryObj?.flag || "📍"} ${activeBrowseCountry}`}
              </span>
            </button>
          </div>

          {/* Zone 2: Middle Navigation for Desktop (iOS Segmented Glass Pill with smooth sliding indicator) */}
          <nav className="hidden md:flex items-center apple-segmented-group relative p-1 shadow-lg">
            {/* Smooth Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-full apple-segmented-slider transition-transform duration-300 pointer-events-none"
              style={{
                width: "96px",
                transform: `translateX(${
                  activeTab === "feed"
                    ? "0px"
                    : activeTab === "explore"
                      ? "96px"
                      : activeTab === "casting"
                        ? "192px"
                        : "288px"
                })`,
                left: "4px",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            <button
              onClick={() => setActiveTab("feed")}
              className={`apple-segmented-item relative z-10 w-24 justify-center apple-btn ${
                activeTab === "feed"
                  ? "text-foreground font-bold"
                  : "text-neutral-500 hover:text-foreground"
              }`}
            >
              <Film className="w-4 h-4" strokeWidth={1.5} /> Feed
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`apple-segmented-item relative z-10 w-24 justify-center apple-btn ${
                activeTab === "explore"
                  ? "text-foreground font-bold"
                  : "text-neutral-500 hover:text-foreground"
              }`}
            >
              <Search className="w-4 h-4" strokeWidth={1.5} /> Search
            </button>
            <button
              onClick={() => setActiveTab("casting")}
              className={`apple-segmented-item relative z-10 w-24 justify-center apple-btn ${
                activeTab === "casting"
                  ? "text-foreground font-bold"
                  : "text-neutral-500 hover:text-foreground"
              }`}
            >
              <MonitorPlay className="w-4 h-4" strokeWidth={1.5} /> Casting
            </button>
            <button
              onClick={() => {
                setViewedProfileUser(currentUser);
                setActiveTab("profile");
              }}
              className={`apple-segmented-item relative z-10 w-24 justify-center apple-btn ${
                activeTab === "profile"
                  ? "text-foreground font-bold"
                  : "text-neutral-500 hover:text-foreground"
              }`}
            >
              <UserIcon className="w-4 h-4" strokeWidth={1.5} /> Profile
            </button>
          </nav>

          {/* Zone 3: macOS / iOS Actions */}
          <div className="flex items-center gap-2.5">
            {/* Guest indicator & Sign In button */}
            {api.isGuestId(currentUser.id) && (
              <button
                onClick={() => {
                  setAuthInitialView("signup");
                  setIsAuthOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full apple-glass-subtle border border-[var(--theme-color)]/40 hover:bg-[var(--theme-color)]/20 text-white text-xs font-semibold transition-colors"
                title="Sign in to save across devices"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                <span>Guest Preview · Sign In</span>
              </button>
            )}

            {/* Top-Right Glowing Glass Create Button */}
            <button
              onClick={() => {
                setCreateInitialMode("regular");
                setIsCreateOpen(true);
              }}
              className="relative flex items-center justify-center h-8 px-3.5 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] text-foreground font-bold text-xs active:scale-95 transition-all hover:brightness-110 border border-border opacity-90"
              title="Create Post or Casting Call"
            >
              <Plus className="w-4 h-4 stroke-[2.8] text-foreground" />
              <span className="ml-1 hidden sm:inline font-bold">Post</span>
            </button>

            {/* Notifications Icon with iOS Red Dot Badge */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative w-9 h-9 rounded-full apple-glass-subtle flex items-center justify-center transition-all active:scale-95 text-foreground hover:bg-black/15 border border-border"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF453A] text-foreground font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-sm" />
              )}
            </button>

            {/* Direct Messages Icon on Desktop */}
            <button
              onClick={() => setIsMessagesOpen(true)}
              className="relative w-9 h-9 rounded-full apple-glass-subtle flex items-center justify-center transition-all active:scale-95 text-foreground hover:bg-black/15 border border-border"
              title="Direct Messages"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-4 px-1 rounded-full bg-[#FF453A] text-foreground font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Viewport Frame Toggle (Mobile Preview vs Full Desktop Responsive) */}
            <button
              onClick={() => setIsMobileFrameView(!isMobileFrameView)}
              className="flex w-9 h-9 rounded-full apple-glass-subtle items-center justify-center transition-all active:scale-95 text-foreground hover:bg-black/15 border border-border"
              title={
                isMobileFrameView
                  ? "Switch to Full Desktop View"
                  : "Preview as iPhone 16 Pro (393px)"
              }
            >
              {isMobileFrameView ? (
                <Monitor className="w-4 h-4 text-white" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* DEDICATED MOBILE HEADER (Real Smartphone Screen Only) */}
      {isMobileDevice && !isMobileFrameView && renderMobileHeader()}

      {/* MAIN CONTENT AREA */}
      <main
        className={`flex-1 flex justify-center ${isMobileFrameView ? "items-center min-h-0 overflow-hidden" : "items-start"} w-full`}
      >
        <div
          className={`w-full ${
            isMobileFrameView
              ? `w-[393px] max-w-[393px] h-[calc(100vh-68px)] max-h-[820px] rounded-[48px] border-[10px] border-[#1C202A] bg-black shadow-[0_30px_90px_rgba(0,0,0,0.95)] ring-1 ring-white/15 flex flex-col overflow-hidden relative select-none`
              : isMobileDevice
                ? "w-full min-w-0 px-2 sm:px-3 pt-3 pb-28"
                : "max-w-6xl px-3 sm:px-6 py-4"
          }`}
        >
          {/* Authentic Mobile Preview Dynamic Island & Status Bar */}
          {isMobileFrameView && (
            <>
              <div
                className={`bg-transparent text-foreground/90 pt-3 px-6 pb-2 select-none flex items-center justify-between shrink-0 z-30 transition-colors`}
              >
                <span className="text-xs font-semibold tracking-tight">9:41</span>
                {/* Dynamic Island Pill */}
                <div className="w-24 h-6 rounded-full bg-[#121212] border border-white/15 flex items-center justify-center gap-1.5 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[9px] font-bold text-white font-mono tracking-wider">
                    CINEMA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <span>5G</span>
                  <div className="w-4 h-2.5 border border-white/70 rounded-[3px] p-[1px] flex items-center">
                    <div className="w-full h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>
              {/* Dedicated Mobile Header inside iPhone frame */}
              {renderMobileHeader()}
            </>
          )}

          {/* Body Container: scrollable on iPhone frame */}
          <div
            id="mobile-scroll-container"
            className={
              isMobileFrameView
                ? "flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar w-full min-w-0 px-0 pt-0 pb-28"
                : "w-full"
            }
          >
            <div
              className={
                isMobileFrameView || isMobileDevice
                  ? "flex flex-col items-center justify-start w-full min-w-0"
                  : "flex gap-8 items-start justify-center"
              }
            >
              {/* Main Center Column (Feed / Tabs) */}
              <div
                className={`w-full ${isMobileFrameView || isMobileDevice ? "min-w-0 max-w-full" : "max-w-xl shrink-0"}`}
              >
                {/* TAB 1: FEED */}
                {activeTab === "feed" && (
                  <div key="tab-feed" className="tab-content-enter">
                    {/* Stories Carousel */}
                    <StoryBar
                      stories={stories}
                      currentUser={currentUser}
                      onOpenStory={(story, idx) => {
                        const storyIdx = stories.findIndex((s) => s.id === story.id);
                        setActiveStoryIndex(storyIdx >= 0 ? storyIdx : idx);
                        setIsStoryViewerOpen(true);
                      }}
                      onOpenCreateStory={() => {
                        setIsStoryModalOpen(true);
                      }}
                    />

                    {/* Feed Posts List */}
                    {visibleFeedPosts.length === 0 ? (
                      <div className="p-10 text-center apple-glass-card rounded-[28px] border border-white/14 space-y-3 shadow-2xl">
                        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[var(--theme-color)]/30 to-[#000000]/20 text-[var(--theme-color)] border border-[var(--theme-color)]/30 flex items-center justify-center mx-auto shadow-inner">
                          <MonitorPlay className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-brand font-bold text-foreground">
                          The Cinema Feed is Fresh
                        </h4>
                        <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                          Be the first filmmaker to share your project, camera test, or production
                          casting call with the network.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setCreateInitialMode("regular");
                              setIsCreateOpen(true);
                            }}
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] text-foreground font-bold text-xs shadow-lg shadow-[var(--theme-color)]/25 transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Post</span>
                          </button>
                          <button
                            onClick={() => {
                              setCreateInitialMode("casting");
                              setIsCreateOpen(true);
                            }}
                            className="px-4 py-2 rounded-full apple-glass-subtle hover:bg-black/15 text-foreground font-semibold text-xs border border-white/15 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <MonitorPlay className="w-3.5 h-3.5 text-white" />
                            <span>Post a Casting Call</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      visibleFeedPosts.map((post, idx) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          allUsers={initial.users}
                          onLikeToggle={handleLikeToggle}
                          onSaveToggle={handleSaveToggle}
                          onFollowToggle={handleFollowToggle}
                          isFollowing={followingIds.includes(post.author.id)}
                          onOpenComments={(p) => setActivePostForComments(p)}
                          onOpenShare={(p) => setActivePostForShare(p)}
                          onOpenApply={(p) => setActivePostForApply(p)}
                          onUserClick={handleUserClick}
                          onAddComment={handleAddComment}
                          onDelete={handleDeletePost}
                          onEdit={handleEditPost}
                          entranceDelay={Math.min(idx * 60, 300)}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: EXPLORE & SEARCH */}
                {activeTab === "explore" && (
                  <div key="tab-explore" className="tab-content-enter">
                    <SearchExploreTab
                      posts={posts}
                      currentUser={currentUser}
                      users={initial.users}
                      onPostClick={(p) => setActivePostForDetail(p)}
                      onUserClick={handleUserClick}
                      onFollowToggle={handleFollowToggle}
                      followingIds={followingIds}
                    />
                  </div>
                )}

                {/* TAB 3: CASTING & AUDITIONS */}
                {activeTab === "casting" && (
                  <div key="tab-casting" className="tab-content-enter">
                    <CastingExploreTab
                      posts={posts}
                      currentUser={currentUser}
                      onOpenApply={(p) => setActivePostForApply(p)}
                      onOpenCreateCasting={() => {
                        setCreateInitialMode("casting");
                        setIsCreateOpen(true);
                      }}
                      onSaveToggle={handleSaveToggle}
                      onUserClick={handleUserClick}
                    />
                  </div>
                )}

                {/* TAB 4: PROFILE */}
                {activeTab === "profile" && (
                  <div key="tab-profile" className="apple-page-enter">
                    <ProfileView
                      user={viewedProfileUser}
                      currentUser={currentUser}
                      posts={posts}
                      myApplications={myApplications}
                      receivedApplications={receivedApplications}
                      onUpdateApplicationStatus={handleUpdateApplicationStatus}
                      isFollowing={followingIds.includes(viewedProfileUser.id)}
                      onFollowToggle={handleFollowToggle}
                      onOpenMessage={(u) => {
                        handleOpenMessage(u);
                      }}
                      onPostClick={(p) => setActivePostForDetail(p)}
                      onUpdateProfile={(updated) => {
                        setCurrentUser(updated);
                        setViewedProfileUser(updated);
                        api
                          .updateProfile(me.id, {
                            name: updated.name,
                            bio: updated.bio,
                            roles: updated.roles,
                            experience_level: updated.experienceLevel,
                            showreel_video_url: updated.showreelVideoUrl || null,
                            imdb_url: updated.imdbUrl || null,
                            portfolio_url: updated.portfolioUrl || null,
                            avatar: updated.avatar || null,
                            cover_image: updated.coverImage || null,
                          })
                          .catch((e) => alert("Could not save profile: " + e.message));
                      }}
                      onOpenApply={(p) => setActivePostForApply(p)}
                      onOpenAuthModal={async () => {
                        if (confirm("Sign out of Cinetribe?")) {
                          localStorage.removeItem("cinetribe_guest");
                          await supabase.auth.signOut();
                          if (onSignOut) onSignOut();
                        }
                      }}
                      feedMode={feedMode}
                      activeBrowseCountry={activeBrowseCountry}
                      activeBrowseLanguage={activeBrowseLanguage}
                      onOpenRegionFilter={() => setIsRegionFilterOpen(true)}
                    />
                  </div>
                )}
              </div>

              {/* Right Suggestions Rail for Desktop (Only when not in mobile preview frame and not on mobile device) */}
              {!isMobileFrameView && !isMobileDevice && (
                <aside className="hidden lg:block w-72 shrink-0 space-y-5 sticky top-20">
                  {/* User Mini Profile Card */}
                  <div className="p-4 rounded-[24px] apple-glass-card border border-border space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setViewedProfileUser(currentUser);
                          setActiveTab("profile");
                        }}
                        className="flex items-center gap-3 text-left focus:outline-none group"
                      >
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-11 h-11 rounded-full object-cover border border-[var(--theme-color)]/40 group-hover:scale-105 transition-transform"
                        />
                        <div className="truncate">
                          <span className="font-brand font-bold text-sm text-foreground block truncate group-hover:text-white transition-colors">
                            {currentUser.name}
                          </span>
                          <span className="text-[11px] text-white truncate block">
                            {currentUser.roles[0]} · {currentUser.country}
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setAuthInitialView("signup");
                          setIsAuthOpen(true);
                        }}
                        className="text-[11px] text-white hover:underline font-semibold"
                      >
                        Switch / New
                      </button>
                    </div>

                    {/* Quick Onboarding Button */}
                    <button
                      onClick={() => {
                        setAuthInitialView("signup");
                        setIsAuthOpen(true);
                      }}
                      className="w-full py-2 rounded-full bg-gradient-to-r from-[var(--theme-color)]/30 via-[var(--theme-color)]/20 to-[var(--theme-color)]/30 border border-[var(--theme-color)]/50 hover:bg-[var(--theme-color)]/35 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" /> + Create New Film Account
                    </button>
                  </div>

                  {/* Urgent Regional Casting Calls Widget */}
                  <div className="p-4 rounded-[24px] apple-glass-card border border-border space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-brand font-bold text-xs text-foreground flex items-center gap-1.5">
                        <MonitorPlay className="w-3.5 h-3.5 text-white" />
                        Active Casting Calls
                      </span>
                      <button
                        onClick={() => setActiveTab("casting")}
                        className="text-[11px] text-white hover:underline font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {posts
                        .filter((p) => p.type === "casting" && p.castingDetails)
                        .slice(0, 3)
                        .map((p) => {
                          const c = p.castingDetails!;
                          return (
                            <div
                              key={p.id}
                              className="p-3 rounded-2xl bg-background/40 border border-white/8 hover:border-border transition-all text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-foreground truncate max-w-[140px]">
                                  {c.projectTitle}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  {c.compensationType}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mb-2 truncate">
                                Roles: {c.rolesNeeded.slice(0, 2).join(", ")}
                              </div>
                              <button
                                onClick={() => setActivePostForApply(p)}
                                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] hover:brightness-110 text-foreground font-bold text-[11px] transition-all shadow-sm active:scale-95"
                              >
                                Apply Now
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Suggested Creators Widget */}
                  <div className="p-4 rounded-[24px] apple-glass-card border border-border space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-brand font-bold text-xs text-foreground">
                        Suggested Filmmakers
                      </span>
                      <button
                        onClick={() => setActiveTab("explore")}
                        className="text-[11px] text-white hover:underline font-medium"
                      >
                        Explore
                      </button>
                    </div>

                    <div className="space-y-3">
                      {MOCK_USERS.slice(1, 4).map((u) => {
                        const isFollowing = followingIds.includes(u.id);
                        return (
                          <div key={u.id} className="flex items-center justify-between text-xs">
                            <button
                              onClick={() => handleUserClick(u)}
                              className="flex items-center gap-2.5 text-left min-w-0"
                            >
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                              />
                              <div className="truncate">
                                <span className="font-bold text-foreground block truncate">
                                  {u.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                  {u.roles[0]} · {u.country}
                                </span>
                              </div>
                            </button>

                            <button
                              onClick={() => handleFollowToggle(u.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                isFollowing
                                  ? "bg-muted text-neutral-300 hover:bg-black/15"
                                  : "bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold shadow-sm"
                              }`}
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quiet Footer */}
                  <div className="text-[11px] text-muted-foreground space-y-1 px-2">
                    <p>© 2026 Kinotribe Inc. Built for Cinema Creators.</p>
                    <p>Filtered by Country & Language · SAG-AFTRA & CNC compliant.</p>
                  </div>
                </aside>
              )}
            </div>
          </div>

          {/* Floating Dock inside iPhone Mockup Frame */}
          {isMobileFrameView && renderMobileDock(true)}
        </div>
      </main>

      {/* Floating Dock on Real Mobile Device Viewport */}
      {isMobileDevice && !isMobileFrameView && renderMobileDock(false)}

      {/* MODALS */}
      {/* 1. Auth & Onboarding Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        initialView={authInitialView}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setViewedProfileUser(user);
        }}
      />

      {/* 2. Create Post & Casting Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (activePostForEdit) setActivePostForEdit(null);
        }}
        currentUser={currentUser}
        availableUsers={initial.users}
        onPostCreated={handlePostCreated}
        onPostUpdated={handlePostUpdated}
        initialMode={createInitialMode}
        initialPost={activePostForEdit || undefined}
      />

      {/* 2b. Create Story (24h Cut) Modal */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setEmbeddedPostForGlimpse(null);
        }}
        currentUser={currentUser}
        onStoryCreated={handleStoryCreated}
        embeddedPost={embeddedPostForGlimpse}
      />

      {/* 3. Apply for Casting Call Modal */}
      <ApplyCastingModal
        post={activePostForApply}
        currentUser={currentUser}
        onClose={() => setActivePostForApply(null)}
        onSubmitApplication={handleSubmitApplication}
      />

      {/* 4. Comments Sheet */}
      <CommentsSheet
        post={activePostForComments}
        currentUser={currentUser}
        isOpen={!!activePostForComments}
        onClose={() => setActivePostForComments(null)}
        onAddComment={handleAddComment}
        onUserClick={handleUserClick}
      />

      {/* 5. Share Modal */}
      <ShareModal
        post={activePostForShare}
        isOpen={!!activePostForShare}
        onClose={() => setActivePostForShare(null)}
        onAddToStory={handleAddPostToGlimpse}
      />

      {/* 6. Post Detail Modal */}
      <PostDetailModal
        post={activePostForDetail}
        currentUser={currentUser}
        allUsers={initial.users}
        isOpen={!!activePostForDetail}
        onClose={() => setActivePostForDetail(null)}
        onLikeToggle={handleLikeToggle}
        onSaveToggle={handleSaveToggle}
        onFollowToggle={handleFollowToggle}
        isFollowing={
          activePostForDetail ? followingIds.includes(activePostForDetail.author.id) : false
        }
        onOpenComments={(p) => setActivePostForComments(p)}
        onOpenShare={(p) => setActivePostForShare(p)}
        onOpenApply={(p) => setActivePostForApply(p)}
        onUserClick={handleUserClick}
        onAddComment={handleAddComment}
        onDelete={handleDeletePost}
        onEdit={handleEditPost}
      />

      {/* 7. Fullscreen Showreel Story Viewer */}
      <StoryViewerModal
        stories={stories}
        posts={posts}
        initialIndex={activeStoryIndex}
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        onUserClick={handleUserClick}
        onPostClick={(post) => setActivePostForDetail(post)}
        currentUser={currentUser}
        onDeleteStory={handleDeleteStory}
      />

      {/* 8. Region & Language Filter Modal */}
      <RegionFilterModal
        isOpen={isRegionFilterOpen}
        onClose={() => setIsRegionFilterOpen(false)}
        filterMode={feedMode}
        onSetFilterMode={setFeedMode}
        activeCountry={activeBrowseCountry}
        onSelectCountry={setActiveBrowseCountry}
        activeLanguage={activeBrowseLanguage}
        onSelectLanguage={setActiveBrowseLanguage}
        userCountry={currentUser.country}
        userLanguage={currentUser.languages[0] || "English"}
        myLocation={myLocation}
        nearbyRadius={nearbyRadius}
        onSetNearbyRadius={setNearbyRadius}
      />

      {/* 9. Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationClick={(n) => {
          if (n.targetPostId) {
            const target = posts.find((p) => p.id === n.targetPostId);
            if (target) {
              setActivePostForDetail(target);
            }
          } else {
            handleUserClick(n.actor);
          }
          api.markNotificationRead(n.id);
          setNotifications((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
          );
        }}
        onUserClick={handleUserClick}
      />

      {/* 10. Direct Messages Drawer */}
      <DirectMessagesDrawer
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        conversations={conversations}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        onUserClick={handleUserClick}
        myApplications={myApplications}
        receivedApplications={receivedApplications}
        onUpdateApplicationStatus={handleUpdateApplicationStatus}
      />

      {/* 11. Settings Menu */}
      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenRegionFilter={() => {
          setIsSettingsOpen(false);
          setIsRegionFilterOpen(true);
        }}
        onLogout={async () => {
          if (confirm("Log out of Cinetribe?")) {
            setIsSettingsOpen(false);
            await supabase.auth.signOut();
            if (onSignOut) onSignOut();
          }
        }}
      />
    </div>
  );
}
