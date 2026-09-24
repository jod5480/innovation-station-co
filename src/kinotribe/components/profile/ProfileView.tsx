import React, { useState } from 'react';
import {
  User,
  Post,
  Application,
  CinemaRole,
  ExperienceLevel,
} from '../../types';
import {
  CheckCircle2,
  Film,
  Clapperboard,
  Bookmark,
  FileText,
  Edit3,
  MessageSquare,
  Globe,
  Video,
  ExternalLink,
  MapPin,
  Sparkles,
  Play,
  SlidersHorizontal,
  Settings,
  Sun,
  Moon,
  X,
  Grid3X3,
  UserCheck,
  Briefcase,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { ALL_ROLES, COUNTRIES_DATA } from '../../data/mockCinemaData';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  posts: Post[];
  myApplications: Application[];
  isFollowing: boolean;
  onFollowToggle: (userId: string) => void;
  onOpenMessage: (user: User) => void;
  onPostClick: (post: Post) => void;
  onUpdateProfile: (updated: User) => void;
  onOpenApply: (post: Post) => void;
  onOpenAuthModal?: (mode?: 'login' | 'signup') => void;
  feedMode?: 'regional' | 'global' | 'custom';
  activeBrowseCountry?: string;
  activeBrowseLanguage?: string;
  onOpenRegionFilter?: () => void;
  theatreMode?: boolean;
  onToggleTheatreMode?: () => void;
  activePalette?: 'now-playing' | 'neon-noir' | 'monsoon-blue';
  onChangePalette?: (pal: 'now-playing' | 'neon-noir' | 'monsoon-blue') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  posts,
  myApplications,
  isFollowing,
  onFollowToggle,
  onOpenMessage,
  onPostClick,
  onUpdateProfile,
  onOpenApply,
  onOpenAuthModal,
  feedMode = 'regional',
  activeBrowseCountry,
  activeBrowseLanguage,
  onOpenRegionFilter,
  theatreMode = true,
  onToggleTheatreMode,
  activePalette = 'now-playing',
  onChangePalette,
}) => {
  const isMe = user.id === currentUser.id;
  const [activeTab, setActiveTab] = useState<'posts' | 'showreels' | 'tagged' | 'portfolio' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [portfolioCopied, setPortfolioCopied] = useState(false);

  // Edit state
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio);
  const [editRoles, setEditRoles] = useState<CinemaRole[]>(user.roles);
  const [editExperience, setEditExperience] = useState<ExperienceLevel>(user.experienceLevel);
  const [editShowreel, setEditShowreel] = useState(user.showreelVideoUrl || '');
  const [editImdb, setEditImdb] = useState(user.imdbUrl || '');
  const [editPortfolio, setEditPortfolio] = useState(user.portfolioUrl || '');

  // User posts & categories
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userCastingPosts = userPosts.filter((p) => p.type === 'casting');
  const userShowreelPosts = userPosts.filter(
    (p) =>
      p.content.mediaType === 'video' ||
      p.type === 'video' ||
      (p.content.cameraSpec && p.content.cameraSpec.toLowerCase().includes('reel'))
  );
  const userPortfolioPosts = userPosts.filter(
    (p) =>
      p.isPortfolio ||
      (userPosts.length <= 4 && Boolean(p.content.mediaUrl) && p.type !== 'text')
  );
  const taggedPosts = posts.filter(
    (p) =>
      p.author.id !== user.id &&
      (p.tags.some((t) => t.toLowerCase() === user.username.toLowerCase()) ||
        p.comments.some((c) => c.author.id === user.id) ||
        p.content.text?.toLowerCase().includes(`@${user.username.toLowerCase()}`))
  );
  const savedPosts = posts.filter((p) => p.isSaved);

  const handleSharePortfolio = () => {
    const portfolioShareUrl = `${window.location.origin}/?tab=profile&user=${user.username}&view=portfolio`;
    if (navigator.share) {
      navigator
        .share({
          title: `${user.name} — Cinema Portfolio`,
          text: `Check out ${user.name}'s (${user.roles.join(', ')}) film portfolio and stills on Kinotribe.`,
          url: portfolioShareUrl,
        })
        .then(() => {
          setPortfolioCopied(true);
          setTimeout(() => setPortfolioCopied(false), 2500);
        })
        .catch(() => {
          navigator.clipboard.writeText(portfolioShareUrl);
          setPortfolioCopied(true);
          setTimeout(() => setPortfolioCopied(false), 2500);
        });
    } else {
      navigator.clipboard.writeText(portfolioShareUrl);
      setPortfolioCopied(true);
      setTimeout(() => setPortfolioCopied(false), 2500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      name: editName,
      bio: editBio,
      roles: editRoles,
      experienceLevel: editExperience,
      showreelVideoUrl: editShowreel,
      imdbUrl: editImdb,
      portfolioUrl: editPortfolio,
    };
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const handleRoleToggle = (role: CinemaRole) => {
    if (editRoles.includes(role)) {
      if (editRoles.length > 1) {
        setEditRoles(editRoles.filter((r) => r !== role));
      }
    } else {
      setEditRoles([...editRoles, role]);
    }
  };

  return (
    <div className="w-full space-y-5 pb-20">
      {/* Profile Header Card (Monsoon & Rice White Glass Surface) */}
      <div className="rounded-[28px] bg-[#121826] border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Cover / Showreel Header Banner */}
        <div className="relative h-36 sm:h-48 w-full bg-[#0A0E17] overflow-hidden">
          {user.coverImage ? (
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
              <span className="font-mono text-xs text-[#FFB800]/40 tracking-widest uppercase">
                35MM ANAMORPHIC SHOWREEL
              </span>
            </div>
          )}
          {user.showreelVideoUrl && (
            <a
              href={user.showreelVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-xs font-semibold text-[#FFB800] flex items-center gap-1.5 hover:bg-black active:scale-95 transition-all"
            >
              <Play className="w-3 h-3 fill-[#FFB800]" /> Watch Showreel
            </a>
          )}
        </div>

        {/* Profile Details Container */}
        <div className="px-5 pt-0 pb-5">
          {/* Avatar and Action Buttons row */}
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#121826] shadow-2xl bg-black"
              />
              {user.isVerified && (
                <div
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#FFB800] text-black flex items-center justify-center border-2 border-[#121826] font-bold shadow-sm"
                  title="Verified Cinema Professional"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isMe ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-white/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-white/10"
                    title="Profile & App Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#FFB800]" />
                    <span>Settings</span>
                  </button>
                  {onOpenAuthModal && (
                    <button
                      onClick={() => onOpenAuthModal('signup')}
                      className="px-4 py-2 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/30 hover:bg-[#FF6B00]/25 text-[#FF6B00] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      title="Create a new film account or sign up with OTP"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> + New Account
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => onFollowToggle(user.id)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-white/10 text-neutral-300 hover:bg-white/15'
                        : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-md shadow-[#FF6B00]/20'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => onOpenMessage(user)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 transition-all active:scale-95 border border-white/10"
                    title="Direct Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name & Handle */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-brand text-white tracking-tight">
                {user.name}
              </h1>
              <span className="text-xs text-[#94A3B8]">@{user.username}</span>
            </div>

            {/* Quiet metadata: Experience level · Location · Languages */}
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1 flex-wrap">
              <span className="text-[#FFB800] font-medium">
                {user.experienceLevel} Tier
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-500" />
                {user.country}
              </span>
              <span>·</span>
              <span>{user.languages.join(', ')}</span>
            </div>
          </div>

          {/* Cinema Roles List */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {user.roles.map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-200 text-xs font-medium"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Bio statement */}
          <p className="text-xs text-neutral-300 mt-3 leading-relaxed max-w-xl">
            {user.bio}
          </p>

          {/* External Links: IMDb, Portfolio, Vimeo */}
          <div className="flex items-center gap-4 text-xs text-neutral-400 mt-3 flex-wrap">
            {user.imdbUrl && (
              <a
                href={user.imdbUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FFB800] flex items-center gap-1 transition-colors"
              >
                <span className="font-bold text-[#FFB800] text-[10px] bg-[#FFB800]/10 px-1 py-0.5 rounded border border-[#FFB800]/20">
                  IMDb
                </span>
                Profile
              </a>
            )}
            {user.portfolioUrl && (
              <a
                href={user.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                Website
              </a>
            )}
            {user.showreelVideoUrl && (
              <a
                href={user.showreelVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-neutral-500" />
                Showreel
              </a>
            )}
          </div>

          {/* Metrics Row (Followers, Following, Cuts) */}
          <div className="flex items-center gap-6 pt-4 mt-4 border-t border-white/10 text-xs text-[#94A3B8]">
            <div>
              <strong className="text-white font-mono text-sm block">
                {userPosts.length}
              </strong>
              <span>Film Cuts</span>
            </div>
            <div>
              <strong className="text-white font-mono text-sm block">
                {user.followersCount}
              </strong>
              <span>Followers</span>
            </div>
            <div>
              <strong className="text-white font-mono text-sm block">
                {user.followingCount}
              </strong>
              <span>Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings: Appearance Theme & Cinema Feed Region */}
      {isMe && (
        <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800]">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-200 font-brand uppercase tracking-wider">
                Profile & Studio Settings
              </span>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-xs text-[#FF6B00] hover:text-[#E05300] font-medium flex items-center gap-1 transition-colors"
            >
              <span>More Settings</span>
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Theme Setting Item */}
            <div className="p-3 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#121826] border border-white/10 flex items-center justify-center text-[#FF6B00] shrink-0">
                  {theatreMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <span>Theme</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/10 text-white font-semibold">
                      {theatreMode ? 'Cinema Dark' : 'Light Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {theatreMode ? 'Pure TikTok black #0A0E17' : 'Studio daylight paper tone'}
                  </p>
                </div>
              </div>

              {onToggleTheatreMode && (
                <button
                  type="button"
                  onClick={onToggleTheatreMode}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 border border-white/10"
                  title={theatreMode ? 'Switch to Light Mode' : 'Switch to Dark Cinema Mode'}
                >
                  {theatreMode ? (
                    <>
                      <Sun className="w-3 h-3 text-[#FFB800]" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-[#FF6B00]" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Region Setting Item */}
            {onOpenRegionFilter && (
              <div className="p-3 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#121826] border border-white/10 flex items-center justify-center text-[#FFB800] shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span>Feed Region</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/10 text-[#FFB800] font-semibold truncate">
                        {feedMode === 'global' ? 'Global' : feedMode === 'regional' ? user.country : activeBrowseCountry || user.country}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {feedMode === 'global' ? 'Worldwide cinema stream' : `Localized to ${user.country}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenRegionFilter}
                  className="px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#E05300] text-white text-xs font-bold flex items-center gap-1 transition-all shrink-0 shadow-sm"
                  title="Configure Cinema Feed Country & Language"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tabs (Modern Icons Without Texts: Posts, Showreels, Tagged, Portfolio) */}
      <div className="flex items-center justify-around border border-white/10 bg-[#121826]/95 backdrop-blur-md rounded-2xl p-1.5 shadow-inner gap-1.5">
        {/* Posts */}
        <button
          onClick={() => setActiveTab('posts')}
          title={`Posts (${userPosts.length})`}
          aria-label="Posts"
          className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
            activeTab === 'posts'
              ? 'bg-[#FF6B00] text-white font-bold shadow-lg shadow-[#FF6B00]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Grid3X3 className="w-5 h-5 stroke-[2.2]" />
          {userPosts.length > 0 && activeTab !== 'posts' && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
          )}
        </button>

        {/* Showreels */}
        <button
          onClick={() => setActiveTab('showreels')}
          title="Showreels & Cinema Reels"
          aria-label="Showreels"
          className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
            activeTab === 'showreels'
              ? 'bg-[#FF6B00] text-white font-bold shadow-lg shadow-[#FF6B00]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className="w-5 h-5 stroke-[2.2]" />
          {(userShowreelPosts.length > 0 || user.showreelVideoUrl) && activeTab !== 'showreels' && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
          )}
        </button>

        {/* Tagged */}
        <button
          onClick={() => setActiveTab('tagged')}
          title="Tagged Credits"
          aria-label="Tagged"
          className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
            activeTab === 'tagged'
              ? 'bg-[#FF6B00] text-white font-bold shadow-lg shadow-[#FF6B00]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-5 h-5 stroke-[2.2]" />
          {taggedPosts.length > 0 && activeTab !== 'tagged' && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
          )}
        </button>

        {/* Portfolio */}
        <button
          onClick={() => setActiveTab('portfolio')}
          title={`Curated Portfolio (${userPortfolioPosts.length})`}
          aria-label="Portfolio"
          className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
            activeTab === 'portfolio'
              ? 'bg-[#FF6B00] text-white font-bold shadow-lg shadow-[#FF6B00]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Briefcase className="w-5 h-5 stroke-[2.2]" />
          {userPortfolioPosts.length > 0 && activeTab !== 'portfolio' && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
          )}
        </button>

        {/* Saved (only for account owner) */}
        {isMe && (
          <button
            onClick={() => setActiveTab('saved')}
            title={`Saved (${savedPosts.length})`}
            aria-label="Saved"
            className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
              activeTab === 'saved'
                ? 'bg-[#FF6B00] text-white font-bold shadow-lg shadow-[#FF6B00]/30'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
      </div>

      {/* TAB CONTENT: POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {userPosts.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
              No cinema posts yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {userPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 group"
                >
                  {post.content.mediaUrl ? (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="p-3 text-left font-mono text-[10px] text-neutral-300">
                      {post.content.text}
                    </div>
                  )}
                  {post.type === 'casting' && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#FF6B00] text-white text-[9px] font-bold font-bold shadow-sm">
                      CASTING
                    </span>
                  )}
                  {post.isPortfolio && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-[#FFB800]/90 text-black text-[9px] font-mono font-bold shadow-sm">
                      PORTFOLIO
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SHOWREELS */}
      {activeTab === 'showreels' && (
        <div className="space-y-4">
          {/* Main Showreel Featured Player if URL exists */}
          {user.showreelVideoUrl ? (
            <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#FFB800]" />
                  <span className="font-brand font-bold text-sm text-white">
                    Primary Cinema Showreel
                  </span>
                </div>
                <a
                  href={user.showreelVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] text-xs font-semibold hover:bg-[#FFB800]/25 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>External Reel</span>
                </a>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group">
                <img
                  src={userPosts[0]?.content.mediaUrl || user.avatar}
                  alt="Showreel Preview"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <a
                    href={user.showreelVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </a>
                </div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 text-white text-xs font-mono">
                  {user.name} · Directing & Cinematography Reel
                </div>
              </div>
            </div>
          ) : null}

          {/* Video Clips / Reels Grid */}
          {userShowreelPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {userShowreelPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-white/10 group"
                >
                  {post.content.mediaUrl && (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || 'Video Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 truncate text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded">
                    {post.content.title || 'Video Reel'}
                  </div>
                </button>
              ))}
            </div>
          ) : !user.showreelVideoUrl ? (
            <div className="p-8 text-center bg-[#121826] rounded-2xl border border-white/10 text-neutral-400 space-y-2">
              <Film className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="font-bold text-white text-sm">No showreels uploaded</h4>
              <p className="text-xs text-[#94A3B8]">
                Post cinema video cuts or link a showreel URL in profile settings.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB CONTENT: TAGGED */}
      {activeTab === 'tagged' && (
        <div className="space-y-4">
          {taggedPosts.length === 0 ? (
            <div className="p-8 text-center bg-[#121826] rounded-2xl border border-white/10 text-neutral-400 space-y-2">
              <UserCheck className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="font-bold text-white text-sm">No tagged film credits</h4>
              <p className="text-xs text-[#94A3B8]">
                When other directors or cinematographers tag {user.name} in their films, those projects will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {taggedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-white/10 group"
                >
                  {post.content.mediaUrl && (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || 'Tagged Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[#FFB800] text-[10px] truncate max-w-[85%] font-medium">
                    @{post.author.username}
                  </span>
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#FF6B00] text-white text-[9px] font-bold font-bold">
                    CREDIT
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PORTFOLIO (Curated Showcase & Share Portfolio) */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          {/* Portfolio Header Bar with Share Portfolio Button */}
          <div className="p-4 rounded-2xl bg-[#121826] border border-white/10 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-brand font-bold text-sm text-white tracking-tight">
                    {user.name}’s Cinema Portfolio
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFB800]/10 text-[#FFB800] font-mono text-[10px] font-semibold border border-[#FFB800]/20">
                    {userPortfolioPosts.length} {userPortfolioPosts.length === 1 ? 'Work' : 'Works'}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Curated film stills, cinematography grades, and directing work.
                </p>
              </div>
            </div>

            {/* Share Portfolio Button */}
            <button
              onClick={handleSharePortfolio}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                portfolioCopied
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-md shadow-[#FF6B00]/25'
              }`}
              title="Share portfolio link with producers & directors"
            >
              {portfolioCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Portfolio</span>
                </>
              )}
            </button>
          </div>

          {/* Portfolio Showcase Grid */}
          {userPortfolioPosts.length === 0 ? (
            <div className="p-8 text-center bg-[#121826] rounded-2xl border border-white/10 text-neutral-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-neutral-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Portfolio is empty</h4>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                  When creating posts, toggle <strong className="text-[#FFB800]">"Add to Portfolio"</strong> to curate your film stills and showcase your work to producers and directors.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userPortfolioPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl overflow-hidden bg-[#121826] border border-white/10 group flex flex-col hover:border-[#FFB800]/50 transition-all shadow-md"
                >
                  {/* Media Still */}
                  <div
                    onClick={() => onPostClick(post)}
                    className="relative aspect-video sm:aspect-[16/10] bg-black cursor-pointer overflow-hidden"
                  >
                    {post.content.mediaUrl ? (
                      <img
                        src={post.content.mediaUrl}
                        alt={post.content.title || 'Film still'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="p-4 font-mono text-xs text-neutral-300 h-full flex items-center bg-black/60">
                        {post.content.text}
                      </div>
                    )}

                    {/* Camera Spec Tag */}
                    {post.content.cameraSpec && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-white font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                        <span className="truncate max-w-[180px]">{post.content.cameraSpec}</span>
                      </div>
                    )}

                    {/* Credited Role Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-[#FF6B00] text-white font-bold text-[10px] tracking-wide shadow-sm">
                      {post.portfolioRole || user.roles[0] || 'Film Still'}
                    </div>

                    {/* Likes & Comments Count Pill */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-2">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.commentsCount}</span>
                    </div>
                  </div>

                  {/* Portfolio Details Footer */}
                  <div className="p-3 flex items-center justify-between gap-2 border-t border-white/5 bg-[#0A0E17]/40">
                    <div className="min-w-0">
                      <h4
                        onClick={() => onPostClick(post)}
                        className="font-brand font-bold text-xs text-white truncate cursor-pointer hover:text-[#FFB800]"
                      >
                        {post.content.title || post.castingDetails?.projectTitle || 'Untitled Cinema Work'}
                      </h4>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                        {post.content.text || 'Featured cinema lookbook entry'}
                      </p>
                    </div>

                    <button
                      onClick={() => onPostClick(post)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200 text-[11px] font-semibold transition-colors shrink-0"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SAVED */}
      {isMe && activeTab === 'saved' && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-neutral-500 text-xs">
              No saved posts or casting calls in your bag.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-white/10 group"
                >
                  {post.content.mediaUrl && (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || 'Saved'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[#FFB800] text-[10px] truncate max-w-[80%]">
                    @{post.author.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#121826] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-brand font-bold text-lg text-neutral-100">
              Edit Film Profile
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Bio / Cinema Vision
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Roles (Multi-select)
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/50 rounded-xl border border-white/10">
                {ALL_ROLES.map((r) => {
                  const active = editRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleToggle(r)}
                      className={`p-1.5 rounded-lg text-[11px] text-left truncate transition-colors ${
                        active
                          ? 'bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 font-bold'
                          : 'bg-white/5 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Showreel Video URL
              </label>
              <input
                type="url"
                value={editShowreel}
                onChange={(e) => setEditShowreel(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:border-[#FF6B00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  IMDb Link
                </label>
                <input
                  type="url"
                  value={editImdb}
                  onChange={(e) => setEditImdb(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Portfolio
                </label>
                <input
                  type="url"
                  value={editPortfolio}
                  onChange={(e) => setEditPortfolio(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:border-[#FF6B00]"
                />
              </div>
            </div>

            {/* Feed Region Setting in Edit Profile Modal */}
            {onOpenRegionFilter && (
              <div className="p-3 bg-black/50 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-neutral-200">
                    Cinema Feed Discovery Region
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {feedMode === 'global'
                      ? 'Global Feed (All Countries)'
                      : feedMode === 'regional'
                      ? `My Region (${user.country})`
                      : `Custom Filter (${activeBrowseCountry || user.country})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenRegionFilter();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#FFB800] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Change
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Monsoon / iOS Sheet with Inset Grouped Rows) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121826]/95 backdrop-blur-2xl border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Grabber */}
            <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-brand font-bold text-white text-base">
                    Settings
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">Display, Region & Account</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Section 1: Appearance & Cinema Theme */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {theatreMode ? <Moon className="w-3.5 h-3.5 text-[#FF6B00]" /> : <Sun className="w-3.5 h-3.5 text-[#FFB800]" />}
                    <span>Theme Appearance</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {theatreMode
                      ? 'Golden & Fluorescent Dark Mode (#0A0E17)'
                      : 'Studio Light Mode (#FAF9F5)'}
                  </p>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="p-1 rounded-xl bg-black/60 border border-white/5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!theatreMode && onToggleTheatreMode) onToggleTheatreMode();
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    theatreMode
                      ? 'bg-[#FF6B00] text-white font-bold shadow-md shadow-[#FF6B00]/25'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (theatreMode && onToggleTheatreMode) onToggleTheatreMode();
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    !theatreMode
                      ? 'bg-white text-neutral-900 font-bold shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Section 2: Cinema Feed Region & Localization */}
            {onOpenRegionFilter && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FFB800]" />
                      <span>Feed Region</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {feedMode === 'global'
                        ? 'Global Stream (All Countries)'
                        : feedMode === 'regional'
                        ? `${user.country} (${user.languages.join(', ')})`
                        : `${activeBrowseCountry || user.country}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      onOpenRegionFilter();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                  >
                    <SlidersHorizontal className="w-3 h-3" /> Change
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Profile & Account */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Filmmaker Account</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    <span className="text-neutral-200 font-semibold">{user.name}</span> · {user.roles[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    setIsEditing(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 border border-white/10"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-3 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white text-sm font-bold transition-all shadow-md active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
