import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Clapperboard,
  Film,
  User as UserIcon,
  Bell,
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
  PlaySquare,
} from 'lucide-react';

import {
  User,
  Post,
  StoryItem,
  NotificationItem,
  DirectMessageConversation,
  Application,
  FeedFilterMode,
  CinemaRole,
} from './types';

import { supabase } from '@/integrations/supabase/client';
import * as api from './lib/api';
import { AuthGate } from './components/auth/AuthGate';
import {
  COUNTRIES_DATA,
} from './data/mockCinemaData';

import { PostCard } from './components/feed/PostCard';
import { StoryBar } from './components/stories/StoryBar';
import { StoryViewerModal } from './components/stories/StoryViewerModal';
import { CommentsSheet } from './components/feed/CommentsSheet';
import { ShareModal } from './components/modals/ShareModal';
import { ApplyCastingModal } from './components/modals/ApplyCastingModal';
import { CreatePostModal } from './components/modals/CreatePostModal';
import { PostDetailModal } from './components/feed/PostDetailModal';
import { RegionFilterModal } from './components/feed/RegionFilterModal';
import { CastingExploreTab } from './components/casting/CastingExploreTab';
import { SearchExploreTab } from './components/explore/SearchExploreTab';
import { ProfileView } from './components/profile/ProfileView';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { DirectMessagesDrawer } from './components/messages/DirectMessagesDrawer';
import { AuthModal } from './components/auth/AuthModal';

type MainTab = 'feed' | 'explore' | 'casting' | 'profile';

export default function App() {
  const [session, setSession] = useState<{ userId: string } | null | undefined>(undefined);
  const [boot, setBoot] = useState<{ me: User; data: api.FeedData } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      setSession(data.session ? { userId: data.session.user.id } : null),
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession((prev) => {
        const next = s ? { userId: s.user.id } : null;
        return prev?.userId === next?.userId ? prev : next;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setBoot(null);
    if (!session) return;
    let cancelled = false;
    (async () => {
      const [me, data] = await Promise.all([
        api.getMyProfile(session.userId),
        api.loadEverything(session.userId),
      ]);
      if (!cancelled && me) setBoot({ me, data });
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (session === null) return <AuthGate />;
  if (!boot)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E17] text-neutral-400 text-sm">
        Loading KinoTribe…
      </div>
    );
  return <KinoApp key={boot.me.id} me={boot.me} initial={boot.data} />;
}

function KinoApp({ me, initial }: { me: User; initial: api.FeedData }) {
  const CURRENT_USER = me;
  const MOCK_USERS = initial.users.filter((u) => u.id !== me.id);

  // App state
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>(initial.posts);
  const [stories, setStories] = useState<StoryItem[]>(initial.stories);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.notifications);
  const [conversations, setConversations] = useState<DirectMessageConversation[]>(initial.conversations);
  const [myApplications, setMyApplications] = useState<Application[]>(initial.applications);
  const [followingIds, setFollowingIds] = useState<string[]>(initial.followingIds);

  // View navigation
  const [activeTab, setActiveTab] = useState<MainTab>('feed');
  const [viewedProfileUser, setViewedProfileUser] = useState<User>(CURRENT_USER);

  // Region & Language Feed Filters
  const [feedMode, setFeedMode] = useState<FeedFilterMode>('regional');
  const [activeBrowseCountry, setActiveBrowseCountry] = useState<string>(CURRENT_USER.country);
  const [activeBrowseLanguage, setActiveBrowseLanguage] = useState<string>(
    CURRENT_USER.languages[0] || 'English'
  );

  // UI modes: Theatre Mode (Dark Cinema) vs Light, and Viewport toggle (Mobile frame vs Full Responsive)
  const [theatreMode, setTheatreMode] = useState<boolean>(true);
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(false);
  const [isFeedDropdownOpen, setIsFeedDropdownOpen] = useState<boolean>(false);
  const [feedFilterCategory, setFeedFilterCategory] = useState<'all' | 'following' | 'casting_only'>('all');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>('signup');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialMode, setCreateInitialMode] = useState<'regular' | 'casting'>('regular');
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  // Detail / Interaction modals
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [activePostForShare, setActivePostForShare] = useState<Post | null>(null);
  const [activePostForApply, setActivePostForApply] = useState<Post | null>(null);
  const [activePostForDetail, setActivePostForDetail] = useState<Post | null>(null);

  // Story Viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState<boolean>(false);

  // Unread counts
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const refresh = async () => {
    const d = await api.loadEverything(me.id);
    setPosts(d.posts);
    setStories(d.stories);
    setNotifications(d.notifications);
    setConversations(d.conversations);
    setMyApplications(d.applications);
    setFollowingIds(d.followingIds);
  };

  // Like toggle handler
  const handleLikeToggle = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const isLiked = !target.isLiked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked, likes: isLiked ? p.likes + 1 : p.likes - 1 } : p
      )
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
      createdAt: 'Just now',
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
        await supabase.from('notifications').insert({
          user_id: post.author.id,
          actor_id: me.id,
          type: 'comment',
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
      alert(e instanceof Error && e.message.includes('duplicate') ? 'You already applied to this casting call.' : 'Could not submit application.');
    }
  };

  // Create post handler
  const handlePostCreated = async (newPost: Post) => {
    try {
      await api.createPost(newPost, me.id);
      await refresh();
      setActiveTab('feed');
    } catch (e) {
      alert('Could not publish post: ' + (e instanceof Error ? e.message : ''));
    }
  };

  // Send Direct Message
  const handleSendMessage = async (conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: 'Just now',
              messages: [
                ...c.messages,
                { id: `msg_${Date.now()}`, senderId: me.id, text, time: 'Just now', isMe: true },
              ],
            }
          : c
      )
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
  useEffect(() => {
    const ch = supabase
      .channel('kt-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        if ((p.new as { sender_id: string }).sender_id !== me.id) refresh();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);

  // User click router
  const handleUserClick = (user: User) => {
    setViewedProfileUser(user);
    setActiveTab('profile');
    setIsNotificationsOpen(false);
  };

  // Filter feed based on Regional vs Global vs Custom & Category
  const visibleFeedPosts = posts.filter((post) => {
    // Category filter: Following or Casting only
    if (feedFilterCategory === 'casting_only' && post.type !== 'casting') {
      return false;
    }
    if (
      feedFilterCategory === 'following' &&
      !followingIds.includes(post.author.id) &&
      post.author.id !== currentUser.id
    ) {
      return false;
    }

    if (feedMode === 'global') return true;

    if (feedMode === 'regional') {
      // Filter by user's country or language
      const matchCountry = post.country.toLowerCase() === currentUser.country.toLowerCase();
      const matchLang = currentUser.languages.some(
        (l) => l.toLowerCase() === post.language.toLowerCase()
      );
      return matchCountry || matchLang;
    }

    if (feedMode === 'custom') {
      const matchCountry = post.country.toLowerCase() === activeBrowseCountry.toLowerCase();
      const matchLang = post.language.toLowerCase() === activeBrowseLanguage.toLowerCase();
      return matchCountry || matchLang;
    }

    return true;
  });

  const activeCountryObj = COUNTRIES_DATA.find((c) => c.name === activeBrowseCountry);
  const userCountryObj = COUNTRIES_DATA.find((c) => c.name === currentUser.country);

  return (
    <div
      className={`min-h-screen ${
        theatreMode
          ? 'bg-[#0A0E17] text-[#FAF9F5] selection:bg-[#FF6B00] selection:text-[#FAF9F5]'
          : 'bg-[#FAF9F5] text-[#0A0E17] selection:bg-[#FF6B00] selection:text-[#FAF9F5]'
      } flex flex-col font-sans transition-colors duration-200`}
    >
      {/* GLOBAL CINEMA & RICE WHITE NAVIGATION APP BAR */}
      <header
        className={`sticky top-0 z-40 border-b ${
          theatreMode
            ? 'border-white/[0.08] bg-[#0A0E17]/92'
            : 'border-[#0A0E17]/[0.08] bg-[#FAF9F5]/92'
        } backdrop-blur-2xl px-4 py-2.5 flex items-center justify-between transition-colors`}
      >
        {/* Zone 1: Kinotribe Brand Wordmark */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setIsFeedDropdownOpen(!isFeedDropdownOpen)}
            className="flex items-center gap-2.5 focus:outline-none group py-1 active:scale-[0.98] transition-transform"
            title="Switch Feed Channel or Region"
          >
            {/* Golden Yellow & Fluorescent Green Brand Badge */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[10px] bg-gradient-to-tr from-[#FFB800] via-[#0A0E17] to-[#FF6B00] p-[1.5px] shadow-sm shadow-[#FF6B00]/25">
                <div className="w-full h-full rounded-[8px] bg-[#0A0E17] flex items-center justify-center">
                  <Clapperboard className="w-4 h-4 text-[#FF6B00] stroke-[2.3]" />
                </div>
              </div>
            </div>
            <div className="text-left">
              <span className="font-brand font-black text-lg tracking-tight text-inherit group-hover:text-[#FFB800] transition-colors flex items-center gap-1 leading-none">
                KinoTribe
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FFB800] transition-transform duration-200 ${
                    isFeedDropdownOpen ? 'rotate-180 text-[#FFB800]' : ''
                  }`}
                />
              </span>
              <span className="text-[10px] text-[#94A3B8] font-medium block">
                {feedMode === 'global' ? 'Global Stream' : `${currentUser.country} Cinema`}
              </span>
            </div>
          </button>

          {/* Styled Dropdown Menu for KinoTribe ⌄ */}
          {isFeedDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFeedDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#121826]/98 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Feed Channel
                </div>

                {/* Regional Feed */}
                <button
                  onClick={() => {
                    setFeedMode('regional');
                    setFeedFilterCategory('all');
                    setIsFeedDropdownOpen(false);
                    setActiveTab('feed');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    feedMode === 'regional' && feedFilterCategory === 'all'
                      ? 'bg-[#FF6B00]/20 text-[#FFB800] font-bold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span>{userCountryObj?.flag || '📍'}</span>
                    <span className="truncate">Regional ({currentUser.country} · {currentUser.languages[0]})</span>
                  </span>
                  {feedMode === 'regional' && feedFilterCategory === 'all' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  )}
                </button>

                {/* Global Feed */}
                <button
                  onClick={() => {
                    setFeedMode('global');
                    setFeedFilterCategory('all');
                    setIsFeedDropdownOpen(false);
                    setActiveTab('feed');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    feedMode === 'global' && feedFilterCategory === 'all'
                      ? 'bg-[#FF6B00]/20 text-[#FFB800] font-bold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>🌐</span>
                    <span>Global Feed (All Nations)</span>
                  </span>
                  {feedMode === 'global' && feedFilterCategory === 'all' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  )}
                </button>

                {/* Following Only */}
                <button
                  onClick={() => {
                    setFeedFilterCategory('following');
                    setIsFeedDropdownOpen(false);
                    setActiveTab('feed');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    feedFilterCategory === 'following'
                      ? 'bg-[#FF6B00]/20 text-[#FFB800] font-bold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>✨</span>
                    <span>Following ({followingIds.length})</span>
                  </span>
                  {feedFilterCategory === 'following' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  )}
                </button>

                {/* Casting Calls Only */}
                <button
                  onClick={() => {
                    setFeedFilterCategory('casting_only');
                    setIsFeedDropdownOpen(false);
                    setActiveTab('feed');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    feedFilterCategory === 'casting_only'
                      ? 'bg-[#FF6B00]/20 text-[#FFB800] font-bold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>🎬</span>
                    <span>Casting & Hiring Calls</span>
                  </span>
                  {feedFilterCategory === 'casting_only' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  )}
                </button>

                <div className="my-1.5 border-t border-white/10" />

                {/* Change Country & Language */}
                <button
                  onClick={() => {
                    setIsFeedDropdownOpen(false);
                    setIsRegionFilterOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Customize Country & Language</span>
                </button>
              </div>
            </>
          )}

          {/* Quick Region Selector Capsule on Desktop */}
          <button
            onClick={() => setIsRegionFilterOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121826] border border-white/10 hover:border-[#FFB800]/50 text-xs text-neutral-300 transition-colors ml-2"
            title="Change Feed Country & Language"
          >
            <MapPin className="w-3 h-3 text-[#FFB800]" />
            <span className="font-medium">
              {feedMode === 'global'
                ? '🌐 Global'
                : feedMode === 'regional'
                ? `${userCountryObj?.flag || '📍'} ${currentUser.country}`
                : `${activeCountryObj?.flag || '📍'} ${activeBrowseCountry}`}
            </span>
          </button>
        </div>

        {/* Zone 2: Middle Navigation for Desktop */}
        <nav
          className={`hidden md:flex items-center p-1 rounded-full text-xs font-semibold ${
            theatreMode
              ? 'bg-[#121826] border border-white/10'
              : 'bg-[#EDE8DE] border border-[#0A0E17]/10'
          } shadow-inner`}
        >
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'feed'
                ? 'bg-[#FF6B00] text-white font-bold font-bold shadow-md shadow-[#FF6B00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> Feed
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'explore'
                ? 'bg-[#FF6B00] text-white font-bold font-bold shadow-md shadow-[#FF6B00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Explore
          </button>
          <button
            onClick={() => setActiveTab('casting')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'casting'
                ? 'bg-[#FF6B00] text-white font-bold font-bold shadow-md shadow-[#FF6B00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" /> Casting
          </button>
          <button
            onClick={() => {
              setViewedProfileUser(currentUser);
              setActiveTab('profile');
            }}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-[#FF6B00] text-white font-bold font-bold shadow-md shadow-[#FF6B00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" /> Profile
          </button>
        </nav>

        {/* Zone 3: Actions (Golden Yellow / Fluorescent Green) */}
        <div className="flex items-center gap-2.5">
          {/* Top-Right Golden Yellow & Fluorescent Green Create Button */}
          <button
            onClick={() => {
              setCreateInitialMode('regular');
              setIsCreateOpen(true);
            }}
            className="relative flex items-center justify-center h-8 px-3 rounded-[8px] bg-[#FF6B00] text-white font-black text-xs active:scale-95 transition-all hover:bg-[#FBBF24] shadow-[0_0_12px_rgba(245,158,11,0.35)]"
            style={{
              boxShadow: '-2px 0px 0px #FFB800, 2px 0px 0px #FF6B00'
            }}
            title="Create Post or Casting Call"
          >
            <Plus className="w-4 h-4 stroke-[2.8] text-neutral-950" />
            <span className="ml-1 hidden sm:inline font-bold">Post</span>
          </button>

          {/* Notifications Icon with Golden Yellow Badge */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              theatreMode
                ? 'bg-[#121826] hover:bg-white/10 text-white border border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-neutral-900 border border-black/10'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF6B00] text-white font-bold text-[9px] flex items-center justify-center border-2 border-[#0A0E17]" />
            )}
          </button>

          {/* Viewport Frame Toggle (Mobile Preview vs Full Desktop Responsive) */}
          <button
            onClick={() => setIsMobileFrameView(!isMobileFrameView)}
            className={`hidden lg:flex w-9 h-9 rounded-full items-center justify-center transition-all active:scale-95 ${
              theatreMode
                ? 'bg-[#121826] hover:bg-white/10 text-white border border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-neutral-900 border border-black/10'
            }`}
            title={isMobileFrameView ? 'Switch to Full Desktop View' : 'Preview as iPhone 16 Pro (393px)'}
          >
            {isMobileFrameView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex justify-center w-full">
        <div
          className={`w-full transition-all duration-300 ${
            isMobileFrameView
              ? 'max-w-[400px] my-6 rounded-[50px] border-[8px] border-[#1B2430] bg-[#0A0E17] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden min-h-[86vh] relative'
              : 'max-w-6xl px-3 sm:px-6 py-4'
          }`}
        >
          {/* Authentic Mobile Preview Dynamic Island & Status Bar */}
          {isMobileFrameView && (
            <div className="bg-[#0A0E17] pt-2 px-6 pb-2 border-b border-white/[0.08] select-none flex items-center justify-between text-white/90">
              <span className="text-xs font-semibold tracking-tight">9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-24 h-6 rounded-full bg-[#121826] border border-white/15 flex items-center justify-center gap-1.5 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                <span className="text-[9px] font-bold text-[#FFB800] font-mono tracking-wider">CINEMA</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span>5G</span>
                <div className="w-4 h-2.5 border border-white/70 rounded-[3px] p-[1px] flex items-center">
                  <div className="w-full h-full bg-white rounded-[1px]" />
                </div>
              </div>
            </div>
          )}

          {/* Two-Column Layout for Desktop Feed: Left Main Feed + Right Suggestions Rail */}
          <div className="flex gap-8 items-start justify-center">
            {/* Main Center Column (Feed / Tabs) */}
            <div className="w-full max-w-xl shrink-0">
              {/* TAB 1: FEED */}
              {activeTab === 'feed' && (
                <div>
                  {/* Stories Carousel */}
                  <StoryBar
                    stories={stories}
                    currentUser={currentUser}
                    onOpenStory={(story, idx) => {
                      setActiveStoryIndex(idx);
                      setIsStoryViewerOpen(true);
                    }}
                    onOpenCreateStory={() => {
                      setCreateInitialMode('regular');
                      setIsCreateOpen(true);
                    }}
                  />

                  {/* Feed Posts List */}
                  {visibleFeedPosts.length === 0 ? (
                    <div className="p-12 text-center bg-[#121826] rounded-2xl border border-white/10">
                      <Film className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-neutral-300">No posts in this region yet</h4>
                      <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                        Be the first filmmaker to publish a cut in {activeBrowseCountry}, or switch to the Global feed.
                      </p>
                      <button
                        onClick={() => setFeedMode('global')}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs shadow-md transition-colors"
                      >
                        Switch to Global Feed
                      </button>
                    </div>
                  ) : (
                    visibleFeedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLikeToggle={handleLikeToggle}
                        onSaveToggle={handleSaveToggle}
                        onFollowToggle={handleFollowToggle}
                        isFollowing={followingIds.includes(post.author.id)}
                        onOpenComments={(p) => setActivePostForComments(p)}
                        onOpenShare={(p) => setActivePostForShare(p)}
                        onOpenApply={(p) => setActivePostForApply(p)}
                        onUserClick={handleUserClick}
                        onAddComment={handleAddComment}
                      />
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: EXPLORE & SEARCH */}
              {activeTab === 'explore' && (
                <SearchExploreTab
                  posts={posts}
                  currentUser={currentUser}
                  onPostClick={(p) => setActivePostForDetail(p)}
                  onUserClick={handleUserClick}
                  onFollowToggle={handleFollowToggle}
                  followingIds={followingIds}
                />
              )}

              {/* TAB 3: CASTING & AUDITIONS */}
              {activeTab === 'casting' && (
                <CastingExploreTab
                  posts={posts}
                  currentUser={currentUser}
                  onOpenApply={(p) => setActivePostForApply(p)}
                  onOpenCreateCasting={() => {
                    setCreateInitialMode('casting');
                    setIsCreateOpen(true);
                  }}
                  onSaveToggle={handleSaveToggle}
                  onUserClick={handleUserClick}
                />
              )}

              {/* TAB 4: PROFILE */}
              {activeTab === 'profile' && (
                <ProfileView
                  user={viewedProfileUser}
                  currentUser={currentUser}
                  posts={posts}
                  myApplications={myApplications}
                  isFollowing={followingIds.includes(viewedProfileUser.id)}
                  onFollowToggle={handleFollowToggle}
                  onOpenMessage={(u) => {
                    setIsMessagesOpen(true);
                  }}
                  onPostClick={(p) => setActivePostForDetail(p)}
                  onUpdateProfile={(updated) => {
                    setCurrentUser(updated);
                    setViewedProfileUser(updated);
                  }}
                  onOpenApply={(p) => setActivePostForApply(p)}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialView(mode || 'signup');
                    setIsAuthOpen(true);
                  }}
                  feedMode={feedMode}
                  activeBrowseCountry={activeBrowseCountry}
                  activeBrowseLanguage={activeBrowseLanguage}
                  onOpenRegionFilter={() => setIsRegionFilterOpen(true)}
                  theatreMode={theatreMode}
                  onToggleTheatreMode={() => setTheatreMode(!theatreMode)}
                />
              )}
            </div>

            {/* Right Suggestions Rail for Desktop (Only when not in mobile preview frame) */}
            {!isMobileFrameView && (
              <aside className="hidden lg:block w-72 shrink-0 space-y-5 sticky top-20">
                {/* User Mini Profile Card */}
                <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setViewedProfileUser(currentUser);
                        setActiveTab('profile');
                      }}
                      className="flex items-center gap-3 text-left focus:outline-none"
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-11 h-11 rounded-full object-cover border border-[#FF6B00]/40"
                      />
                      <div className="truncate">
                        <span className="font-brand font-bold text-sm text-neutral-100 block truncate">
                          {currentUser.name}
                        </span>
                        <span className="text-[11px] text-[#FFB800] truncate block">
                          {currentUser.roles[0]} · {currentUser.country}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setAuthInitialView('signup');
                        setIsAuthOpen(true);
                      }}
                      className="text-[11px] text-[#FFB800] hover:underline font-semibold"
                    >
                      Switch / New
                    </button>
                  </div>

                  {/* Quick Onboarding Button */}
                  <button
                    onClick={() => {
                      setAuthInitialView('signup');
                      setIsAuthOpen(true);
                    }}
                    className="w-full py-2 rounded-full bg-gradient-to-r from-[#FF6B00]/25 via-[#FF6B00]/15 to-[#FF6B00]/25 border border-[#FF6B00]/40 hover:border-[#FF6B00] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FFB800]" /> + Create New Film Account
                  </button>
                </div>

                {/* Urgent Regional Casting Calls Widget */}
                <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-brand font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5 text-[#FFB800]" />
                      Active Casting Calls
                    </span>
                    <button
                      onClick={() => setActiveTab('casting')}
                      className="text-[11px] text-[#FFB800] hover:underline font-semibold"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {posts
                      .filter((p) => p.type === 'casting' && p.castingDetails)
                      .slice(0, 3)
                      .map((p) => {
                        const c = p.castingDetails!;
                        return (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-neutral-200 truncate max-w-[140px]">
                                {c.projectTitle}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {c.compensationType}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mb-2 truncate">
                              Roles: {c.rolesNeeded.slice(0, 2).join(', ')}
                            </div>
                            <button
                              onClick={() => setActivePostForApply(p)}
                              className="w-full py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-[11px] transition-colors shadow-sm"
                            >
                              Apply Now
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Suggested Creators Widget */}
                <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-brand font-bold text-xs text-neutral-100">
                      Suggested Filmmakers
                    </span>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="text-[11px] text-[#FFB800] hover:underline font-medium"
                    >
                      Explore
                    </button>
                  </div>

                  <div className="space-y-3">
                    {MOCK_USERS.slice(1, 4).map((u) => {
                      const isFollowing = followingIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <button
                            onClick={() => handleUserClick(u)}
                            className="flex items-center gap-2.5 text-left min-w-0"
                          >
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                            />
                            <div className="truncate">
                              <span className="font-bold text-neutral-200 block truncate">
                                {u.name}
                              </span>
                              <span className="text-[10px] text-[#94A3B8] truncate block">
                                {u.roles[0]} · {u.country}
                              </span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleFollowToggle(u.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              isFollowing
                                ? 'bg-white/10 text-neutral-400'
                                : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-sm'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quiet Footer */}
                <div className="text-[11px] text-[#94A3B8] space-y-1 px-2">
                  <p>© 2026 Kinotribe Inc. Built for Cinema Creators.</p>
                  <p>Filtered by Country & Language · SAG-AFTRA & CNC compliant.</p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* CINEMA & RICE WHITE BOTTOM NAVIGATION TAB BAR */}
      <nav
        className={`${
          isMobileFrameView ? 'absolute bottom-0 left-0 right-0' : 'fixed bottom-0 left-0 right-0 md:hidden'
        } z-40 ${
          theatreMode
            ? 'bg-[#0A0E17]/95 border-white/[0.08] text-[#94A3B8]'
            : 'bg-[#FAF9F5]/95 border-[#0A0E17]/[0.08] text-[#94A3B8]'
        } backdrop-blur-2xl border-t px-2 pt-1.5 pb-2 shadow-2xl flex flex-col`}
      >
        <div className="flex items-center justify-around">
          {/* 1. Feed / Home */}
          <button
            onClick={() => {
              setActiveTab('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 active:scale-90 transition-transform ${
              activeTab === 'feed'
                ? 'text-[#FFB800] font-bold'
                : 'text-[#94A3B8] hover:text-[#FAF9F5]'
            }`}
            title="Home Feed"
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Feed</span>
          </button>

          {/* 2. Explore / Discover */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 active:scale-90 transition-transform ${
              activeTab === 'explore'
                ? 'text-[#FFB800] font-bold'
                : 'text-[#94A3B8] hover:text-[#FAF9F5]'
            }`}
            title="Explore Talent & Stories"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Explore</span>
          </button>

          {/* 3. Middle: Casting Hub */}
          <button
            onClick={() => {
              setActiveTab('casting');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center px-2 py-0.5 active:scale-90 transition-transform shrink-0"
            title="Casting Hub & Auditions"
          >
            <div className="relative flex items-center justify-center">
              {/* Fluorescent green offset layer */}
              <div className="absolute -left-1.5 w-7 h-7 rounded-[7px] bg-[#FFB800]" />
              {/* Golden yellow offset layer */}
              <div className="absolute -right-1.5 w-7 h-7 rounded-[7px] bg-[#FF6B00]" />
              {/* Center crisp pill */}
              <div
                className={`relative w-8 h-7 rounded-[6px] flex items-center justify-center shadow-md transition-colors ${
                  activeTab === 'casting'
                    ? 'bg-[#FF6B00] text-white font-bold'
                    : theatreMode
                    ? 'bg-[#0A0E17] text-[#FAF9F5]'
                    : 'bg-[#FAF9F5] text-[#0A0E17]'
                }`}
              >
                <Clapperboard className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>
            <span
              className={`text-[9px] tracking-tight mt-0.5 font-semibold ${
                activeTab === 'casting' ? 'text-[#FFB800]' : 'text-[#94A3B8]'
              }`}
            >
              Casting
            </span>
          </button>

          {/* 4. Message (Current Casting Button Position) */}
          <button
            onClick={() => setIsMessagesOpen(true)}
            className={`relative flex flex-col items-center justify-center flex-1 py-0.5 active:scale-90 transition-transform ${
              isMessagesOpen
                ? 'text-[#FFB800] font-bold'
                : 'text-[#94A3B8] hover:text-[#FAF9F5]'
            }`}
            title="Messages"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#FF6B00] text-white font-bold text-[9px] flex items-center justify-center border border-[#0A0E17] shadow">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Message</span>
          </button>

          {/* 5. Profile */}
          <button
            onClick={() => {
              setViewedProfileUser(currentUser);
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 active:scale-90 transition-transform ${
              activeTab === 'profile'
                ? 'text-[#FFB800] font-bold'
                : 'text-[#94A3B8] hover:text-[#FAF9F5]'
            }`}
            title="Profile"
          >
            <div
              className={`w-6 h-6 rounded-full p-[1px] overflow-hidden transition-all ${
                activeTab === 'profile'
                  ? 'ring-2 ring-[#FF6B00]'
                  : 'opacity-85'
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

        {/* Home Indicator */}
        <div className="w-32 h-1 rounded-full bg-current opacity-30 mx-auto mt-2 mb-0.5" />
      </nav>

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
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
        initialMode={createInitialMode}
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
      />

      {/* 6. Post Detail Modal */}
      <PostDetailModal
        post={activePostForDetail}
        currentUser={currentUser}
        isOpen={!!activePostForDetail}
        onClose={() => setActivePostForDetail(null)}
        onLikeToggle={handleLikeToggle}
        onSaveToggle={handleSaveToggle}
        onFollowToggle={handleFollowToggle}
        isFollowing={activePostForDetail ? followingIds.includes(activePostForDetail.author.id) : false}
        onOpenComments={(p) => setActivePostForComments(p)}
        onOpenShare={(p) => setActivePostForShare(p)}
        onOpenApply={(p) => setActivePostForApply(p)}
        onUserClick={handleUserClick}
        onAddComment={handleAddComment}
      />

      {/* 7. Fullscreen Showreel Story Viewer */}
      <StoryViewerModal
        stories={stories}
        initialIndex={activeStoryIndex}
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        onUserClick={handleUserClick}
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
        userLanguage={currentUser.languages[0] || 'English'}
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
          // Mark as read
          setNotifications((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
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
      />
    </div>
  );
}
