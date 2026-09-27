import React, { useState, useCallback, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Clapperboard,
  MapPin,
  Calendar,
  Globe,
  CheckCircle2,
  Send,
  Banknote,
  ChevronDown,
  ChevronUp,
  Trash2,
  MoreHorizontal,
  Edit3,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Post, User } from "../../types";
import { CinemaMediaFrame } from "../../utils/cinemaMedia";
import { hapticMedium, hapticHeavy, hapticLight, hapticSuccess } from "../../utils/haptics";
import { MOCK_USERS } from "../../data/mockCinemaData";

interface PostCardProps {
  post: Post;
  currentUser: User;
  allUsers?: User[];
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  isFollowing: boolean;
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onOpenApply: (post: Post) => void;
  onUserClick: (user: User) => void;
  onAddComment: (postId: string, text: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  /** Staggered entrance delay in ms */
  entranceDelay?: number;
}

const formatPostTime = (dateStr?: string): string => {
  if (!dateStr || dateStr === "Just now") return "Just now";
  try {
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return dateStr;
    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks}w`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  allUsers,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  isFollowing,
  onOpenComments,
  onOpenShare,
  onOpenApply,
  onUserClick,
  onAddComment,
  onDelete,
  onEdit,
  entranceDelay = 0,
}) => {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [likeScale, setLikeScale] = useState(false);
  const [saveScale, setSaveScale] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showInlineCastingDetails, setShowInlineCastingDetails] = useState(false);
  const [showInlineComments, setShowInlineComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwnPost = currentUser.id === post.author.id;

  const resolveUser = (identifier: string): User | undefined => {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, "");
    const pool = allUsers && allUsers.length > 0 ? allUsers : MOCK_USERS;
    return pool.find(
      (u) =>
        u.username.toLowerCase().replace(/^@/, "") === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId,
    );
  };

  const handleTaggedUserClick = (identifier: string) => {
    hapticLight();
    const resolved = resolveUser(identifier);
    const cleanHandle = identifier.trim().replace(/^@/, "");
    const userToPass: User = resolved || {
      id: identifier,
      name: `@${cleanHandle}`,
      username: `@${cleanHandle}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}`,
      roles: ["Directing"],
      bio: "",
      country: "Global",
      countryCode: "US",
      languages: ["English"],
      experienceLevel: "Experienced",
      isVerified: false,
      followersCount: 0,
      followingCount: 0,
      joinedDate: "Joined Cinetribe",
    };
    onUserClick(userToPass);
  };

  // Double-tap detection
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < 300) {
      setShowHeartPop(true);
      hapticHeavy();
      if (!post.isLiked) {
        onLikeToggle(post.id);
        setLikeScale(true);
        setTimeout(() => setLikeScale(false), 400);
      }
      setTimeout(() => setShowHeartPop(false), 950);
    }
  }, [post.id, post.isLiked, onLikeToggle]);

  const handleLike = useCallback(() => {
    hapticMedium();
    setLikeScale(true);
    setTimeout(() => setLikeScale(false), 400);
    onLikeToggle(post.id);
  }, [post.id, onLikeToggle]);

  const handleSave = useCallback(() => {
    hapticLight();
    setSaveScale(true);
    setTimeout(() => setSaveScale(false), 350);
    onSaveToggle(post.id);
  }, [post.id, onSaveToggle]);

  const handleShare = useCallback(() => {
    hapticLight();
    onOpenShare(post);
  }, [post, onOpenShare]);

  const handleQuickCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    hapticSuccess();
    onAddComment(post.id, commentInput.trim());
    setCommentInput("");
  };

  const casting = post.castingDetails;

  // Only show tags that the user explicitly added (filter out auto-injected casting tags & tags in text)
  const displayTags = (post.tags || []).filter((tag) => {
    const clean = tag.trim().replace(/^#/, "");
    if (!clean) return false;
    // Filter out auto-injected casting tags if they match rolesNeeded or 'castingcall'
    if (post.type === "casting") {
      if (clean.toLowerCase() === "castingcall" || clean.toLowerCase() === "casting") return false;
      if (post.castingDetails?.rolesNeeded.some((r) => r.toLowerCase() === clean.toLowerCase()))
        return false;
    }
    // Filter out if already written in post text
    if (post.content.text && post.content.text.toLowerCase().includes(`#${clean.toLowerCase()}`))
      return false;
    return true;
  });

  return (
    <article
      className="w-full bg-background border-b border-neutral-800/80 pb-3 mb-2 sm:mb-4 select-none text-left relative post-card-enter"
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      {/* 1. Creator Header (Instagram Native Style) */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              hapticLight();
              onUserClick(post.author);
            }}
            className="relative shrink-0 group focus:outline-none active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-neutral-800 to-neutral-700 group-hover:from-[var(--theme-color)] group-hover:to-[#000000] transition-all overflow-hidden">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {post.type === "casting" && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--theme-color)] text-foreground flex items-center justify-center text-[8px] font-bold ring-2 ring-black">
                🎬
              </span>
            )}
          </button>

          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  hapticLight();
                  onUserClick(post.author);
                }}
                className="font-semibold text-sm text-foreground hover:text-neutral-300 transition-colors truncate"
              >
                {post.author.username}
              </button>
              {post.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-color)] shrink-0" />
              )}
              {post.taggedUsers && post.taggedUsers.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal inline-flex items-center gap-1 flex-wrap">
                  <span className="text-neutral-500">with</span>
                  {post.taggedUsers.slice(0, 2).map((identifier, idx) => {
                    const u = resolveUser(identifier);
                    const label = u
                      ? `@${u.username.replace(/^@/, "")}`
                      : `@${identifier.replace(/^@/, "")}`;
                    return (
                      <React.Fragment key={identifier}>
                        {idx > 0 && <span className="text-neutral-500">,</span>}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaggedUserClick(identifier);
                          }}
                          className="text-foreground hover:text-[var(--theme-color)] font-medium hover:underline transition-colors"
                        >
                          {label}
                        </button>
                      </React.Fragment>
                    );
                  })}
                  {post.taggedUsers.length > 2 && (
                    <span className="text-muted-foreground">+{post.taggedUsers.length - 2} more</span>
                  )}
                </span>
              )}
              <span className="text-neutral-500 text-xs font-normal">·</span>
              <span className="text-muted-foreground text-xs font-normal">
                {formatPostTime(post.createdAt)}
              </span>
            </div>

            {/* Subtitle: Display name · Role · Location */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onUserClick(post.author);
                }}
                className="text-neutral-300 hover:text-foreground font-medium transition-colors focus:outline-none"
              >
                {post.author.name}
              </button>
              <span>·</span>
              <span className="text-[var(--theme-color)] font-medium">
                {post.author.roles[0] || "Filmmaker"}
              </span>
              {post.content.location && (
                <>
                  <span>·</span>
                  <span className="truncate">{post.content.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Follow Button or Post Options */}
        <div className="flex items-center gap-2">
          {!isOwnPost ? (
            <button
              onClick={() => {
                hapticMedium();
                onFollowToggle(post.author.id);
              }}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isFollowing
                  ? "bg-secondary text-neutral-300 hover:bg-neutral-700"
                  : "bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          ) : onDelete || onEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors active:scale-95 outline-none"
                  title="Post options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-card border-border text-foreground rounded-xl shadow-xl"
              >
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(post)}
                    className="gap-2 cursor-pointer focus:bg-muted focus:text-foreground"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Post</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2 cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* 2. Post Content: Heading, Text & Hashtags (LinkedIn / Facebook style - on top of image) */}
      {post.type !== "casting" &&
        (post.content.title ||
          post.content.text ||
          displayTags.length > 0 ||
          (post.taggedUsers && post.taggedUsers.length > 0)) && (
          <div
            className="px-3.5 sm:px-4 pt-0.5 pb-2 text-left relative cursor-pointer"
            onClick={handleDoubleTap}
          >
            {post.content.title && (
              <h3 className="font-bold text-[15px] sm:text-base text-foreground mb-1 leading-snug tracking-tight">
                {post.content.title}
              </h3>
            )}
            {post.content.text && (
              <p className="text-[14px] sm:text-[15px] text-neutral-100 font-normal leading-relaxed whitespace-pre-wrap select-text">
                {post.content.text}
              </p>
            )}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5 text-xs sm:text-[13px] text-[var(--theme-color)] font-medium">
                {displayTags.map((tag) => (
                  <span key={tag} className="hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tagged People Badges */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mr-0.5">
                  <Users className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                  <span>Tagged:</span>
                </div>
                {post.taggedUsers.map((identifier) => {
                  const u = resolveUser(identifier);
                  const displayLabel = u
                    ? `@${u.username.replace(/^@/, "")}`
                    : `@${identifier.replace(/^@/, "")}`;
                  return (
                    <button
                      key={identifier}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaggedUserClick(identifier);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/30 text-[var(--theme-color)] hover:bg-[var(--theme-color)]/20 hover:border-[var(--theme-color)]/50 text-xs font-medium transition-all active:scale-95"
                    >
                      {u?.avatar ? (
                        <img
                          src={u.avatar}
                          alt={displayLabel}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-[var(--theme-color)]/30 text-[9px] flex items-center justify-center font-bold">
                          @
                        </span>
                      )}
                      <span>{displayLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Heart Pop on Double Tap (when double-tapping pure text posts) */}
            {!post.content.mediaUrl && showHeartPop && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart className="w-20 h-20 fill-white text-foreground ig-heart-pop drop-shadow-2xl" />
              </div>
            )}
          </div>
        )}

      {/* 3. Media / Video Frame (Flush Edge-to-Edge Instagram style) */}
      {post.content.mediaUrl && post.type !== "casting" && (
        <div className="relative w-full" onClick={handleDoubleTap}>
          <CinemaMediaFrame
            src={post.content.mediaUrl}
            alt={post.content.title || "Cinema post"}
            aspect={post.content.aspect || "auto"}
            aspectRatio={post.content.aspectRatio}
            title={post.content.title}
            cameraSpec={post.content.cameraSpec}
            type={post.content.mediaType}
            isPoster={post.content.isPoster}
            onDoubleTap={handleDoubleTap}
          />
          {/* Instagram-style Heart Pop on Double Tap */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="w-24 h-24 fill-white text-foreground ig-heart-pop drop-shadow-2xl" />
            </div>
          )}
        </div>
      )}

      {/* 4. Casting Post — Seamless Professional Layout */}
      {post.type === "casting" && casting && (
        <div className="w-full text-left">
          {/* Poster / Media (full-width, with gradient overlay showing title + caption) */}
          <div className="relative w-full overflow-hidden" onClick={handleDoubleTap}>
            {post.content.mediaUrl ? (
              <>
                <CinemaMediaFrame
                  src={post.content.mediaUrl}
                  alt={casting.projectTitle || "Casting poster"}
                  aspect={post.content.aspect || "3:4"}
                  aspectRatio={post.content.aspectRatio}
                  title={post.content.title}
                  type={post.content.mediaType}
                  onDoubleTap={handleDoubleTap}
                />
                {/* Gradient overlay — title + caption on top of image */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pt-12 pb-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                  {post.content.title && (
                    <h3 className="font-bold text-base text-foreground leading-snug mb-0.5 drop-shadow">
                      {post.content.title}
                    </h3>
                  )}
                  {post.content.text && (
                    <p className="text-[13px] text-neutral-300 leading-relaxed line-clamp-2">
                      {post.content.text}
                    </p>
                  )}
                </div>
                {/* Casting Call badge — top left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-color)]/90 backdrop-blur-sm text-foreground text-[11px] font-bold tracking-wide shadow-lg">
                  <Clapperboard className="w-3 h-3" />
                  <span>Casting Call</span>
                </div>
              </>
            ) : (
              /* No media — text-only casting banner */
              <div className="mx-3.5 sm:mx-4 my-1.5 rounded-2xl bg-neutral-900/80 border border-white/10 overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--theme-color)]/30 border border-[var(--theme-color)]/40 flex items-center justify-center text-[var(--theme-color)] shrink-0">
                    <Clapperboard className="w-3.5 h-3.5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--theme-color)] text-foreground text-[10px] font-bold tracking-wider uppercase">
                    Casting Call
                  </span>
                </div>
                {post.content.title && (
                  <h3 className="font-bold text-base text-foreground leading-snug mb-1">
                    {post.content.title}
                  </h3>
                )}
                {post.content.text && (
                  <p className="text-sm text-neutral-300 leading-relaxed">{post.content.text}</p>
                )}
              </div>
            )}
            {/* Heart pop on double tap */}
            {showHeartPop && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart className="w-24 h-24 fill-white text-foreground ig-heart-pop drop-shadow-2xl" />
              </div>
            )}
          </div>

          {/* Casting Details Strip */}
          <div className="px-3.5 sm:px-4 pt-3 pb-1 space-y-3">
            {/* Project title (if no media, already shown above; here as fallback when media exists) */}

            {/* Roles Needed */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider shrink-0">
                Roles
              </span>
              {casting.rolesNeeded.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-0.5 rounded-full bg-black/8 border border-border text-neutral-200 text-xs font-medium"
                >
                  {r}
                </span>
              ))}
              <span className="ml-auto text-[11px] text-neutral-500 font-mono">
                {casting.applicationCount} applied
              </span>
            </div>

            {/* Meta chips row */}
            {(casting.location ||
              casting.languageRequirement ||
              casting.deadline ||
              casting.compensationAmount) && (
              <div className="flex flex-wrap gap-2">
                {casting.location && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/50 border border-white/8 text-neutral-300 text-[11px]">
                    <MapPin className="w-3 h-3 text-[var(--theme-color)] shrink-0" />
                    <span>{casting.location}</span>
                  </div>
                )}
                {casting.languageRequirement && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/50 border border-white/8 text-neutral-300 text-[11px]">
                    <Globe className="w-3 h-3 text-[var(--theme-color)] shrink-0" />
                    <span>{casting.languageRequirement}</span>
                  </div>
                )}
                {casting.deadline && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/50 border border-white/8 text-neutral-300 text-[11px]">
                    <Calendar className="w-3 h-3 text-[var(--theme-color)] shrink-0" />
                    <span>{casting.deadline}</span>
                  </div>
                )}
                {(casting.compensationAmount || casting.compensationType) && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
                    <Banknote className="w-3 h-3 shrink-0" />
                    <span>{casting.compensationAmount || casting.compensationType}</span>
                  </div>
                )}
              </div>
            )}

            {/* Hashtags */}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-xs text-[var(--theme-color)] font-medium">
                {displayTags.map((tag) => (
                  <span key={tag} className="hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tagged people */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Users className="w-3 h-3 text-[var(--theme-color)]" />
                {post.taggedUsers.map((identifier) => {
                  const u = resolveUser(identifier);
                  const label = u
                    ? `@${u.username.replace(/^@/, "")}`
                    : `@${identifier.replace(/^@/, "")}`;
                  return (
                    <button
                      key={identifier}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaggedUserClick(identifier);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/25 text-[var(--theme-color)] text-[11px] font-medium hover:bg-[var(--theme-color)]/20 transition-all"
                    >
                      {u?.avatar && (
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Audition note + Apply CTA */}
            <div className="flex items-center justify-between gap-3 pt-0.5 pb-1">
              <p className="text-[11px] text-neutral-500 truncate flex-1">
                {casting.requirementsNote || ""}
              </p>
              <button
                onClick={() => {
                  hapticMedium();
                  onOpenApply(post);
                }}
                className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-lg bg-[var(--theme-color)] hover:bg-[#9d4edd] text-foreground font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-[var(--theme-color)]/20"
              >
                <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                <span>Apply for Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Action Row (Heart, Comment, Share ... Bookmark) */}
      <div className="px-3.5 sm:px-4 pt-2.5 pb-1 flex items-center justify-between text-neutral-200">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center group focus:outline-none"
            aria-label="Like post"
          >
            <span
              className={`inline-flex transition-transform duration-200 ${likeScale ? "ig-like-bounce" : ""}`}
            >
              <Heart
                className={`w-[24px] h-[24px] transition-all duration-150 ${
                  post.isLiked
                    ? "fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                    : "text-neutral-200 group-hover:text-muted-foreground"
                }`}
                strokeWidth={1.75}
              />
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => {
              hapticLight();
              setShowInlineComments((prev) => !prev);
            }}
            className="flex items-center focus:outline-none group"
            aria-label="Toggle comments"
          >
            <MessageCircle
              className="w-[24px] h-[24px] text-neutral-200 group-hover:text-muted-foreground transition-colors"
              strokeWidth={1.75}
            />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center group focus:outline-none"
            aria-label="Share post"
          >
            <Send
              className="w-[24px] h-[24px] text-neutral-200 group-hover:text-muted-foreground transition-colors"
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Save / Bookmark */}
        <button
          onClick={handleSave}
          className={`focus:outline-none transition-transform ${saveScale ? "ig-save-bounce" : ""}`}
          aria-label="Save post"
          title="Save post"
        >
          <Bookmark
            className={`w-[24px] h-[24px] transition-all duration-150 ${
              post.isSaved
                ? "fill-white text-foreground drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                : "text-neutral-200 hover:text-muted-foreground"
            }`}
            strokeWidth={1.75}
          />
        </button>
      </div>

      {/* 6. Engagement Metrics */}
      <div className="px-3.5 sm:px-4 space-y-1 text-left">
        {/* Likes Count */}
        {post.likes > 0 && (
          <div className="font-semibold text-xs sm:text-sm text-foreground">
            {post.likes.toLocaleString()} {post.likes === 1 ? "like" : "likes"}
          </div>
        )}

        {/* View All Comments Link */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => {
              hapticLight();
              onOpenComments(post);
            }}
            className="text-xs text-muted-foreground hover:text-neutral-300 font-medium block pt-0.5 focus:outline-none"
          >
            View all {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
          </button>
        )}

        {/* First Comment Preview (if comments exist) */}
        {post.comments.length > 0 && (
          <div className="text-xs text-neutral-300 truncate">
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onUserClick(post.comments[0].author);
              }}
              className="font-semibold text-foreground mr-1.5 hover:underline focus:outline-none"
            >
              {post.comments[0].author.username}
            </button>
            <span>{post.comments[0].text}</span>
          </div>
        )}
      </div>

      {/* 7. Inline Quick Comment Form (when expanded) */}
      {showInlineComments && (
        <form
          onSubmit={handleQuickCommentSubmit}
          className="mx-3.5 sm:mx-4 mt-2.5 pt-2 border-t border-neutral-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add a comment..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-foreground placeholder-neutral-500 focus:outline-none py-1"
          />
          <button
            type="submit"
            disabled={!commentInput.trim()}
            className="text-xs font-semibold text-[var(--theme-color)] hover:text-[var(--theme-hover)] disabled:opacity-30 disabled:hover:text-[var(--theme-color)] transition-colors"
          >
            Post
          </button>
        </form>
      )}

      {/* 8. Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border border-border text-foreground rounded-2xl max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-brand text-left">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-left text-[14px]">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel className="flex-1 rounded-xl bg-secondary text-foreground border-0 hover:bg-neutral-700 hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-foreground border-0"
              onClick={() => {
                if (onDelete) onDelete(post.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};
