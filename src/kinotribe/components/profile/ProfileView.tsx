import React, { useState } from "react";
import { User, Post, Application, CinemaRole, ExperienceLevel } from "../../types";
import { uploadMedia } from "../../lib/api";
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
  LayoutGrid,
  MonitorPlay,
  Contact,
  BookOpen,
  UserCheck,
  Briefcase,
  Share2,
  Copy,
  Check,
  Camera,
  Palette,
} from "lucide-react";

const THEMES = [
  { name: "Crimson", color: "#DC143C", hover: "#A40F2D" },
  { name: "Ocean", color: "#0095F6", hover: "#1877F2" },
  { name: "Emerald", color: "#10B981", hover: "#059669" },
  { name: "Amethyst", color: "#8B5CF6", hover: "#7C3AED" },
  { name: "Amber", color: "#F59E0B", hover: "#D97706" }
];
import { ALL_ROLES, COUNTRIES_DATA } from "../../data/mockCinemaData";

interface ProfileViewProps {
  user: User;
  currentUser: User;
  posts: Post[];
  myApplications: Application[];
  receivedApplications?: Application[];
  onUpdateApplicationStatus?: (
    appId: string,
    status: Application["status"],
    applicantId?: string,
    projectTitle?: string,
  ) => void;
  isFollowing: boolean;
  onFollowToggle: (userId: string) => void;
  onOpenMessage: (user: User) => void;
  onPostClick: (post: Post) => void;
  onUpdateProfile: (updated: User) => void;
  onOpenApply: (post: Post) => void;
  onOpenAuthModal?: (mode?: "login" | "signup") => void;
  feedMode?: "regional" | "global" | "custom" | "nearby";
  activeBrowseCountry?: string;
  activeBrowseLanguage?: string;
  onOpenRegionFilter?: () => void;
  activePalette?: "now-playing" | "neon-noir" | "monsoon-blue";
  onChangePalette?: (pal: "now-playing" | "neon-noir" | "monsoon-blue") => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  posts,
  myApplications,
  receivedApplications = [],
  onUpdateApplicationStatus,
  isFollowing,
  onFollowToggle,
  onOpenMessage,
  onPostClick,
  onUpdateProfile,
  onOpenApply,
  onOpenAuthModal,
  feedMode = "regional",
  activeBrowseCountry,
  activeBrowseLanguage,
  onOpenRegionFilter,
  activePalette = "now-playing",
  onChangePalette,
}) => {
  const isMe = user.id === currentUser.id;
  const [activeTab, setActiveTab] = useState<
    "posts" | "showreels" | "tagged" | "portfolio" | "saved"
  >("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [portfolioCopied, setPortfolioCopied] = useState(false);

  // Banner state
  const [editBannerUrl, setEditBannerUrl] = useState(user.coverImage || "");
  const [bannerPreview, setBannerPreview] = useState(user.coverImage || "");
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setBannerPreview(objectUrl);
    try {
      const url = await uploadMedia(file);
      setBannerPreview(url);
      setEditBannerUrl(url);
      onUpdateProfile({ ...user, coverImage: url });
    } catch (err) {
      alert("Could not upload banner: " + (err as Error).message);
    }
  };

  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadMedia(file);
      onUpdateProfile({ ...user, avatar: url });
    } catch (err) {
      alert("Could not upload photo: " + (err as Error).message);
    }
  };

  // Edit state
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editBio, setEditBio] = useState(user.bio);
  const [editPronouns, setEditPronouns] = useState((user as any).pronouns || "");
  const [editLink, setEditLink] = useState(user.portfolioUrl || user.imdbUrl || "");
  const [editRegion, setEditRegion] = useState(user.country || "");
  const [editRoles, setEditRoles] = useState<CinemaRole[]>(user.roles);
  const [editTheme, setEditTheme] = useState(() => localStorage.getItem("app_theme_color") || "#DC143C");

  const applyTheme = (theme: typeof THEMES[0]) => {
    setEditTheme(theme.color);
    document.documentElement.style.setProperty("--theme-color", theme.color);
    document.documentElement.style.setProperty("--theme-hover", theme.hover);
    localStorage.setItem("app_theme_color", theme.color);
    localStorage.setItem("app_theme_hover", theme.hover);
  };
  const [editExperience, setEditExperience] = useState<ExperienceLevel>(user.experienceLevel);
  const [editShowreel, setEditShowreel] = useState(user.showreelVideoUrl || "");
  const [editImdb, setEditImdb] = useState(user.imdbUrl || "");
  const [editPortfolio, setEditPortfolio] = useState(user.portfolioUrl || "");

  // User posts & categories
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userCastingPosts = userPosts.filter((p) => p.type === "casting");
  const userShowreelPosts = userPosts.filter(
    (p) =>
      p.content.mediaType === "video" ||
      p.type === "video" ||
      (p.content.cameraSpec && p.content.cameraSpec.toLowerCase().includes("reel")),
  );
  const userPortfolioPosts = userPosts.filter(
    (p) =>
      p.isPortfolio || (userPosts.length <= 4 && Boolean(p.content.mediaUrl) && p.type !== "text"),
  );
  const taggedPosts = posts.filter(
    (p) =>
      p.author.id !== user.id &&
      (p.tags.some((t) => t.toLowerCase() === user.username.toLowerCase()) ||
        p.comments.some((c) => c.author.id === user.id) ||
        p.content.text?.toLowerCase().includes(`@${user.username.toLowerCase()}`)),
  );
  const savedPosts = posts.filter((p) => p.isSaved);

  const handleSharePortfolio = () => {
    const portfolioShareUrl = `${window.location.origin}/?tab=profile&user=${user.username}&view=portfolio`;
    if (navigator.share) {
      navigator
        .share({
          title: `${user.name} — Cinema Portfolio`,
          text: `Check out ${user.name}'s (${user.roles.join(", ")}) film portfolio and stills on Kinotribe.`,
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
      country: editRegion,
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
      {/* Hidden banner file input */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerFileChange}
      />

      {/* Profile Header with Banner */}
      <div className="rounded-[28px] apple-glass-card border border-white/14 overflow-hidden shadow-2xl pb-4 space-y-3">
        {/* ── Banner strip ── */}
        <div className="relative w-full h-28 bg-gradient-to-br from-[#1a0a2e] via-[#2d0a4e] to-[#0a0a1a] overflow-hidden">
          {bannerPreview || user.coverImage ? (
            <img
              src={bannerPreview || user.coverImage}
              alt="Profile banner"
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            /* Cinematic default banner gradient */
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0033] via-[#3b0082] to-[#0d1117] pointer-events-none">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(131,58,180,0.15) 20px, rgba(131,58,180,0.15) 21px)",
                }}
              />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 opacity-40">
                <Film className="w-4 h-4 text-[var(--theme-color)]" />
                <span className="text-[11px] font-mono text-[var(--theme-color)] tracking-widest uppercase">
                  Your Banner
                </span>
              </div>
            </div>
          )}

          {/* Small edit button pinned to bottom-right (owner only) */}
          {isMe && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              title="Change banner photo"
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-border text-foreground hover:bg-background/80 active:scale-95 transition-all duration-150 shadow-lg z-10"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-semibold leading-none">Edit</span>
            </button>
          )}
        </div>

        {/* Remaining header content with horizontal padding */}
        <div className="px-4 pt-1 space-y-3">
          {/* Row 1: Avatar (left) + Stats (right) — exactly like Instagram */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-[2.5px] border-border shadow-xl bg-background"
              />
              {user.isVerified && (
                <div
                  className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center border-2 border-[#121212] font-bold shadow-sm"
                  title="Verified Cinema Professional"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Stats — posts / followers / following */}
            <div className="flex flex-1 items-center justify-around text-center">
              <div>
                <span className="block text-[17px] font-bold text-foreground font-brand">
                  {userPosts.length}
                </span>
                <span className="text-[12px] text-muted-foreground">posts</span>
              </div>
              <div>
                <span className="block text-[17px] font-bold text-foreground font-brand">
                  {user.followersCount}
                </span>
                <span className="text-[12px] text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="block text-[17px] font-bold text-foreground font-brand">
                  {user.followingCount}
                </span>
                <span className="text-[12px] text-muted-foreground">following</span>
              </div>
            </div>
          </div>

          {/* Row 2: Name, roles, bio, link */}
          <div className="space-y-0.5">
            {/* Display name */}
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-foreground">{user.name}</span>
              {user.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
            </div>

            {/* Role badge */}
            <div className="text-[12px] text-white font-medium">
              {user.roles[0] || "Filmmaker"}
              {user.roles.length > 1 ? ` · ${user.roles[1]}` : ""}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-[13px] text-neutral-300 leading-snug pt-0.5">{user.bio}</p>
            )}

            {/* Location + languages */}
            <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 pt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{user.country}</span>
              {user.languages.length > 0 && (
                <>
                  <span>·</span>
                  <span>{user.languages[0]}</span>
                </>
              )}
            </div>

            {/* Link */}
            {(user.portfolioUrl || user.imdbUrl || user.showreelVideoUrl) && (
              <a
                href={user.portfolioUrl || user.imdbUrl || user.showreelVideoUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[13px] text-[var(--theme-color)] font-medium hover:underline pt-0.5"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {(user.portfolioUrl || user.imdbUrl || user.showreelVideoUrl || "").replace(
                    /^https?:\/\//,
                    "",
                  )}
                </span>
              </a>
            )}
          </div>

          {/* Row 3: Action buttons — Edit profile style for own profile, Follow/Message for others */}
          {isMe ? (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex-1 py-[7px] rounded-lg border border-border bg-black/[0.06] hover:bg-black/[0.10] text-foreground text-[13px] font-semibold text-center transition-all active:scale-[0.97]"
              >
                Edit profile
              </button>

              {onOpenRegionFilter && (
                <button
                  type="button"
                  onClick={onOpenRegionFilter}
                  title="Configure Feed Region"
                  className="w-9 h-9 rounded-lg border border-border bg-black/[0.06] hover:bg-black/[0.10] flex items-center justify-center text-foreground transition-all active:scale-90 shrink-0"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onFollowToggle(user.id)}
                className={`flex-1 py-[7px] rounded-lg text-[13px] font-bold text-center transition-all active:scale-[0.97] ${
                  isFollowing
                    ? "border border-border bg-black/[0.06] hover:bg-black/[0.10] text-foreground"
                    : "bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground shadow-sm shadow-[var(--theme-color)]/25"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => onOpenMessage(user)}
                className="flex-1 py-[7px] rounded-lg border border-border bg-black/[0.06] hover:bg-black/[0.10] text-foreground text-[13px] font-semibold text-center transition-all active:scale-[0.97]"
              >
                Message
              </button>
            </div>
          )}
        </div>
        {/* end padded content */}
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center border border-border bg-muted/50 rounded-2xl p-1 shadow-xl gap-1">
        {/* Posts */}
        <button
          onClick={() => setActiveTab("posts")}
          title={`Posts (${userPosts.length})`}
          aria-label="Posts"
          className={`relative flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "posts"
              ? "bg-black/15 text-foreground shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <LayoutGrid className="w-5 h-5" strokeWidth={activeTab === "posts" ? 2 : 1.5} />
        </button>

        {/* Showreels */}
        <button
          onClick={() => setActiveTab("showreels")}
          title="Casting Calls"
          aria-label="Casting Calls"
          className={`relative flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "showreels"
              ? "bg-black/15 text-foreground shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Clapperboard className="w-5 h-5" strokeWidth={activeTab === "showreels" ? 2 : 1.5} />
        </button>

        {/* Tagged */}
        <button
          onClick={() => setActiveTab("tagged")}
          title="Tagged"
          aria-label="Tagged"
          className={`relative flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "tagged"
              ? "bg-black/15 text-foreground shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Contact className="w-5 h-5" strokeWidth={activeTab === "tagged" ? 2 : 1.5} />
        </button>

        {/* Saved (only for account owner) */}
        {isMe && (
          <button
            onClick={() => setActiveTab("saved")}
            title="Saved"
            aria-label="Saved"
            className={`relative flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeTab === "saved"
                ? "bg-black/15 text-foreground shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Bookmark className="w-5 h-5" strokeWidth={activeTab === "saved" ? 2 : 1.5} />
          </button>
        )}
      </div>

      {/* TAB CONTENT: POSTS */}
      {activeTab === "posts" && (
        <div key="profile-posts" className="space-y-3 apple-page-enter">
          {userPosts.length === 0 ? (
            <div className="p-8 text-center bg-secondary/60 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
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
                      alt={post.content.title || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="p-3 text-left font-mono text-[10px] text-neutral-300">
                      {post.content.text}
                    </div>
                  )}
                  {post.type === "casting" && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[var(--theme-color)] text-foreground text-[9px] font-bold font-bold shadow-sm">
                      CASTING
                    </span>
                  )}
                  {post.isPortfolio && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/90 text-black text-[9px] font-mono font-bold shadow-sm">
                      PORTFOLIO
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CASTING */}
      {activeTab === "showreels" && (
        <div key="profile-casting" className="space-y-4 apple-page-enter">
          {userCastingPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {userCastingPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 group"
                >
                  {post.content.mediaUrl ? (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || "Casting Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="p-3 text-left font-mono text-[10px] text-neutral-300">
                      {post.content.text}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[var(--theme-color)] text-foreground text-[9px] font-bold shadow-sm">
                    CASTING
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#121212] rounded-2xl border border-border text-muted-foreground space-y-2">
              <Clapperboard className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="font-bold text-foreground text-sm">No casting posts</h4>
              <p className="text-xs text-muted-foreground">
                Post a casting call to find talent for your next film.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TAGGED */}
      {activeTab === "tagged" && (
        <div key="profile-tagged" className="space-y-4 apple-page-enter">
          {taggedPosts.length === 0 ? (
            <div className="p-8 text-center bg-[#121212] rounded-2xl border border-border text-muted-foreground space-y-2">
              <UserCheck className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="font-bold text-foreground text-sm">No tagged film credits</h4>
              <p className="text-xs text-muted-foreground">
                When other directors or cinematographers tag {user.name} in their films, those
                projects will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {taggedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-border group"
                >
                  {post.content.mediaUrl && (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || "Tagged Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-background/80 text-white text-[10px] truncate max-w-[85%] font-medium">
                    @{post.author.username}
                  </span>
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[var(--theme-color)] text-foreground text-[9px] font-bold font-bold">
                    CREDIT
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SAVED */}
      {isMe && activeTab === "saved" && (
        <div key="profile-saved" className="space-y-3 apple-page-enter">
          {savedPosts.length === 0 ? (
            <div className="p-8 text-center bg-muted/50 rounded-2xl border border-border text-neutral-500 text-xs">
              No saved posts or casting calls in your bag.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-border group"
                >
                  {post.content.mediaUrl && (
                    <img
                      src={post.content.mediaUrl}
                      alt={post.content.title || "Saved"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-background/80 text-white text-[10px] truncate max-w-[80%]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md apple-glass-card border border-border rounded-[32px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto apple-modal-enter">
            <h3 className="font-brand font-bold text-lg text-neutral-100">Edit Film Profile</h3>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:border-[var(--theme-color)]"
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
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:border-[var(--theme-color)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Roles (Multi-select)
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-background/50 rounded-xl border border-border">
                {ALL_ROLES.map((r) => {
                  const active = editRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleToggle(r)}
                      className={`p-1.5 rounded-lg text-[11px] text-left truncate transition-colors ${
                        active
                          ? "bg-[var(--theme-color)]/20 text-[var(--theme-color)] border border-[var(--theme-color)]/40 font-bold"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground"
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
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:border-[var(--theme-color)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">IMDb Link</label>
                <input
                  type="url"
                  value={editImdb}
                  onChange={(e) => setEditImdb(e.target.value)}
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:border-[var(--theme-color)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={editPortfolio}
                  onChange={(e) => setEditPortfolio(e.target.value)}
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:border-[var(--theme-color)]"
                />
              </div>
            </div>

            {/* Feed Region Setting in Edit Profile Modal */}
            {onOpenRegionFilter && (
              <div className="p-3 bg-background/50 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-neutral-200">
                    Cinema Feed Discovery Region
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {feedMode === "global"
                      ? "Global Feed (All Countries)"
                      : feedMode === "regional"
                        ? `My Region (${user.country})`
                        : `Custom Filter (${activeBrowseCountry || user.country})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenRegionFilter();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-muted hover:bg-black/15 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Change
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-secondary text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-xs shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram-style Edit Profile Sheet */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex flex-col">
          {/* Instagram-style full-screen Edit Profile sheet */}
          <div className="flex flex-col w-full h-full max-w-lg mx-auto apple-sheet-enter">
            {/* Top bar — Cancel | Edit Profile | Done */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#121212]">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[15px] text-neutral-300 font-normal active:opacity-60 transition-opacity"
              >
                Cancel
              </button>
              <span className="text-[15px] font-bold text-foreground">Edit profile</span>
              <button
                onClick={() => {
                  const updated: User = {
                    ...user,
                    name: editName,
                    username: editUsername,
                    bio: editBio,
                    country: editRegion || user.country,
                    portfolioUrl: editLink || user.portfolioUrl,
                    coverImage: editBannerUrl || user.coverImage,
                    roles: editRoles.length > 0 ? editRoles : user.roles,
                    experienceLevel: editExperience,
                  };
                  onUpdateProfile(updated);
                  setBannerPreview(editBannerUrl || user.coverImage || "");
                  setIsSettingsModalOpen(false);
                }}
                className="text-[15px] font-bold text-[var(--theme-color)] active:opacity-60 transition-opacity"
              >
                Done
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto bg-[#121212]">
              {/* Banner edit row */}
              <div className="relative w-full h-24 bg-gradient-to-br from-[#1a0033] via-[#3b0082] to-[#0d1117] group overflow-hidden border-b border-white/[0.07]">
                {(bannerPreview || user.coverImage) && (
                  <img
                    src={bannerPreview || user.coverImage}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-background/0 group-hover:bg-background/50 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Camera className="w-5 h-5 text-foreground" />
                  <span className="text-[11px] text-foreground font-semibold">Change banner</span>
                </button>
                <span className="absolute top-2 left-3 text-[10px] text-foreground/50 font-mono uppercase tracking-widest">
                  Banner
                </span>
              </div>

              {/* Avatar edit row */}
              <div className="flex flex-col items-center py-6 border-b border-white/[0.07]">
                <div className="relative" onClick={() => avatarInputRef.current?.click()}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                  <div className="absolute inset-0 rounded-full bg-background/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Edit3 className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-2.5 text-[13px] font-semibold text-[var(--theme-color)] active:opacity-60"
                >
                  Edit photo
                </button>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* Field rows — Instagram inset grouped style */}
              <div className="divide-y divide-white/[0.07]">
                {/* Name */}
                <div className="flex items-center px-4 py-3.5">
                  <span className="w-28 text-[14px] font-semibold text-foreground shrink-0">Name</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div className="flex items-center px-4 py-3.5">
                  <span className="w-28 text-[14px] font-semibold text-foreground shrink-0">
                    Username
                  </span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(e.target.value.replace(/\s/g, "").toLowerCase())
                    }
                    placeholder="username"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Pronouns */}
                <div className="flex items-center px-4 py-3.5">
                  <span className="w-28 text-[14px] font-semibold text-foreground shrink-0">
                    Pronouns
                  </span>
                  <input
                    type="text"
                    value={editPronouns}
                    onChange={(e) => setEditPronouns(e.target.value)}
                    placeholder="Add pronouns"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Bio */}
                <div className="flex items-start px-4 py-3.5">
                  <span className="w-28 text-[14px] font-semibold text-foreground shrink-0 pt-0.5">
                    Bio
                  </span>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Bio"
                    rows={3}
                    maxLength={150}
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder-neutral-500 focus:outline-none resize-none leading-snug"
                  />
                </div>

                {/* Link */}
                <div className="flex items-center px-4 py-3.5">
                  <span className="w-28 text-[14px] font-semibold text-foreground shrink-0">Link</span>
                  <input
                    type="url"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="Add link"
                    className="flex-1 bg-transparent text-[14px] text-[var(--theme-color)] placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Region row */}
              <div className="flex items-center px-4 py-3.5 border-t border-white/[0.07]">
                <span className="w-28 text-[14px] font-semibold text-foreground shrink-0">Region</span>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  placeholder="e.g. United Kingdom, New York"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder-neutral-500 focus:outline-none"
                />
              </div>

              {/* ── Preferences section ── */}
              <div className="px-4 pt-5 pb-2">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                  Preferences
                </p>

                {/* App Theme */}
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Palette className="w-4 h-4 text-neutral-300" />
                    <p className="text-[13px] font-semibold text-neutral-300">App Theme</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => applyTheme(theme)}
                        className={`flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-95`}
                      >
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all`}
                          style={{ 
                            backgroundColor: theme.color, 
                            borderColor: editTheme === theme.color ? 'white' : 'transparent',
                            boxShadow: editTheme === theme.color ? `0 0 15px ${theme.color}60` : 'none'
                          }}
                        >
                          {editTheme === theme.color && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                        <span className={`text-[10px] font-semibold ${editTheme === theme.color ? 'text-white' : 'text-neutral-500'}`}>
                          {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <p className="text-[13px] font-semibold text-neutral-300 mb-2">Experience Level</p>
                <div className="flex gap-2 mb-5">
                  {(["Newcomer", "Mid-level", "Experienced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditExperience(lvl)}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-all active:scale-95 ${
                        editExperience === lvl
                          ? "bg-[var(--theme-color)] border-[var(--theme-color)] text-foreground shadow-md shadow-[var(--theme-color)]/30"
                          : "border-border bg-black/[0.04] text-muted-foreground hover:text-foreground hover:bg-black/[0.08]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Cinema Roles */}
                <p className="text-[13px] font-semibold text-neutral-300 mb-2">Cinema Roles</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const active = editRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all active:scale-95 ${
                          active
                            ? "bg-[var(--theme-color)]/20 border-[var(--theme-color)]/60 text-[var(--theme-color)]"
                            : "border-border bg-black/[0.04] text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom padding */}
              <div className="h-10" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
