import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { StoryItem, User, Post } from "../../types";

interface StoryViewerModalProps {
  stories: StoryItem[];
  posts?: Post[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (user: User) => void;
  onPostClick?: (post: Post) => void;
  currentUser?: User;
  onDeleteStory?: (storyId: string) => Promise<void>;
}

function getStoryDisplayTime(story?: StoryItem): string {
  if (!story) return "Just now";
  let createdMs: number | null = null;
  if (story.createdAt) {
    const t = new Date(story.createdAt).getTime();
    if (!isNaN(t) && t > 0) createdMs = t;
  }
  if (!createdMs) {
    const match = story.id.match(/\d{10,}/);
    if (match) {
      const t = parseInt(match[0], 10);
      if (!isNaN(t) && t > 1600000000000) createdMs = t;
    }
  }
  if (!createdMs) {
    return story.timestamp || "Just now";
  }

  const diffMs = Math.max(0, Date.now() - createdMs);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  posts,
  initialIndex,
  isOpen,
  onClose,
  onUserClick,
  currentUser,
  onDeleteStory,
  onPostClick,
}) => {
  if (!isOpen || stories.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGoToPost, setShowGoToPost] = useState(false);

  const pressStartTimeRef = useRef<number>(0);

  const activeStory = stories[currentIndex] || stories[0];
  const isOwnStory = currentUser && activeStory.author.id === currentUser.id;
  const linkedPost =
    activeStory.linkedPostId && posts
      ? posts.find((p) => String(p.id) === String(activeStory.linkedPostId))
      : null;

  const [storyTimeText, setStoryTimeText] = useState<string>(() =>
    getStoryDisplayTime(activeStory),
  );

  useEffect(() => {
    setStoryTimeText(getStoryDisplayTime(activeStory));
    const timer = setInterval(() => {
      setStoryTimeText(getStoryDisplayTime(activeStory));
    }, 10000);
    return () => clearInterval(timer);
  }, [activeStory]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
    setConfirmDelete(false);
    setShowGoToPost(false);
    setIsPaused(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    setShowGoToPost(false);
    setProgress(0);
  }, [currentIndex]);

  // Story progress timer (automatically advances stories)
  useEffect(() => {
    if (!isOpen || isPaused || confirmDelete || showGoToPost) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 1.25;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, isPaused, currentIndex, stories.length, onClose, confirmDelete, showGoToPost]);

  const handlePrev = () => {
    if (showGoToPost) {
      setShowGoToPost(false);
      setIsPaused(false);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
      setConfirmDelete(false);
      setShowGoToPost(false);
    }
  };

  const handleNext = () => {
    if (showGoToPost) {
      setShowGoToPost(false);
      setIsPaused(false);
      return;
    }
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      setConfirmDelete(false);
      setShowGoToPost(false);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDeleteStory) return;
    setIsDeleting(true);
    await onDeleteStory(activeStory.id);
    setIsDeleting(false);
    setConfirmDelete(false);
    if (stories.length > 1) {
      handleNext();
    } else {
      onClose();
    }
  };

  const handlePressDown = () => {
    pressStartTimeRef.current = Date.now();
    if (!showGoToPost) {
      setIsPaused(true);
    }
  };

  const handlePressUp = () => {
    if (!showGoToPost) {
      setIsPaused(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg animate-fade-in select-none">
      <div className="relative w-full max-w-sm h-[88vh] bg-neutral-950 rounded-[32px] overflow-hidden border border-border shadow-2xl flex flex-col justify-between apple-modal-enter">
        {/* Progress Bars */}
        <div className="absolute top-2.5 left-3 right-3 z-30 flex gap-1">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#000000] to-[var(--theme-color)] transition-all duration-75"
                style={{
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onUserClick(activeStory.author);
            }}
            className="flex items-center gap-2 text-left"
          >
            <img
              src={activeStory.author.avatar}
              alt={activeStory.author.name}
              className="w-8 h-8 rounded-full object-cover border border-[var(--theme-color)]"
            />
            <div>
              <span className="text-xs font-bold text-foreground block">
                {activeStory.author.username}
              </span>
              <span className="text-[10px] text-white font-mono">
                {activeStory.roleBadge} &middot; {storyTimeText}
              </span>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/80 hover:text-foreground"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            {isOwnStory && onDeleteStory && (
              <button
                onClick={() => {
                  setConfirmDelete(true);
                  setIsPaused(true);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-300"
                title="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/80 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media */}
        <div
          className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden"
          onMouseDown={handlePressDown}
          onMouseUp={handlePressUp}
          onTouchStart={handlePressDown}
          onTouchEnd={handlePressUp}
        >
          {activeStory.mediaUrl?.startsWith("data:video/") ||
          /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(activeStory.mediaUrl) ? (
            <video
              src={activeStory.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.caption}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

          {/* Dismiss Backdrop when View Post is visible */}
          {showGoToPost && (
            <div
              className="absolute inset-0 z-35 bg-background/45 backdrop-blur-[2px] cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setShowGoToPost(false);
                setIsPaused(false);
              }}
            />
          )}

          {/* Embedded Post Card if available */}
          {linkedPost && (
            <div className="absolute inset-0 flex items-center justify-center scale-[0.85] z-40 pointer-events-none">
              <div
                className={`relative w-[90%] max-w-[400px] bg-[#0E1118] border border-border rounded-3xl shadow-2xl p-5 flex flex-col pointer-events-auto cursor-pointer transition-all duration-200 ${
                  showGoToPost
                    ? "scale-[0.98] ring-2 ring-white/30 brightness-75"
                    : "hover:scale-[0.99] active:scale-95"
                }`}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (showGoToPost) {
                    setShowGoToPost(false);
                    setIsPaused(false);
                  } else {
                    setShowGoToPost(true);
                    setIsPaused(true);
                  }
                }}
              >
                {/* Author Info */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onUserClick(linkedPost.author);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex items-center gap-3 text-left group/author hover:opacity-90 active:scale-95 transition-all focus:outline-none"
                    title={`View @${linkedPost.author.username}'s profile`}
                  >
                    <img
                      src={linkedPost.author.avatar}
                      alt={linkedPost.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-border group-hover/author:border-white transition-colors"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm flex items-center gap-1 group-hover/author:text-white transition-colors">
                        <span>{linkedPost.author.username}</span>
                        {linkedPost.author.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {linkedPost.author.name} • {linkedPost.author.roles[0].split(" ")[0]} •{" "}
                        {linkedPost.country}
                      </div>
                    </div>
                  </button>
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Content */}
                {(linkedPost.content.title || linkedPost.content.text) && (
                  <div className="text-neutral-200 text-[15px] mb-4">
                    {linkedPost.content.title && (
                      <span className="font-bold block mb-1">{linkedPost.content.title}</span>
                    )}
                    {linkedPost.content.text && (
                      <p className="line-clamp-3">{linkedPost.content.text}</p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {linkedPost.tags && linkedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {linkedPost.tags.map((tag) => (
                      <span key={tag} className="text-white text-[13px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media preview inside card */}
                {linkedPost.content.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden mt-2 mb-4 bg-[#121212]">
                    <img
                      src={linkedPost.content.mediaUrl}
                      className="w-full object-cover max-h-[250px]"
                      alt=""
                    />
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                  <div className="flex items-center gap-4 text-foreground">
                    <Heart className="w-6 h-6" />
                    <MessageCircle className="w-6 h-6" />
                    <Send className="w-6 h-6" />
                  </div>
                  <Bookmark className="w-6 h-6 text-foreground" />
                </div>

                {/* View post Pill centered on the card */}
                {showGoToPost && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <button
                      type="button"
                      className="pointer-events-auto px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-black font-bold text-sm shadow-[0_8px_32px_rgba(0,0,0,0.9)] border border-black/10 flex items-center gap-2 active:scale-95 transition-transform animate-in zoom-in-90 fade-in duration-150 cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onPostClick && linkedPost) {
                          onPostClick(linkedPost);
                          onClose();
                        }
                      }}
                    >
                      <span>View post</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="mx-6 p-5 rounded-2xl bg-secondary border border-red-500/30 space-y-4 text-center shadow-2xl">
              <Trash2 className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-foreground font-bold text-sm">Delete this Glimpse?</p>
              <p className="text-muted-foreground text-xs">
                This will permanently remove it from your Glimpse.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setIsPaused(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-muted text-foreground text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-foreground text-sm font-bold disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tap nav for left / right navigation with hold-to-pause */}
        <button
          onClick={() => {
            const duration = Date.now() - pressStartTimeRef.current;
            if (duration < 250) {
              handlePrev();
            }
          }}
          onMouseDown={handlePressDown}
          onMouseUp={handlePressUp}
          onTouchStart={handlePressDown}
          onTouchEnd={handlePressUp}
          className="absolute left-0 top-16 bottom-16 w-1/3 z-20 focus:outline-none"
          aria-label="Previous story"
        />
        <button
          onClick={() => {
            const duration = Date.now() - pressStartTimeRef.current;
            if (duration < 250) {
              handleNext();
            }
          }}
          onMouseDown={handlePressDown}
          onMouseUp={handlePressUp}
          onTouchStart={handlePressDown}
          onTouchEnd={handlePressUp}
          className="absolute right-0 top-16 bottom-16 w-1/3 z-20 focus:outline-none"
          aria-label="Next story"
        />
      </div>

      {/* Desktop arrows */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="hidden md:flex absolute left-8 w-10 h-10 rounded-full bg-muted hover:bg-black/20 disabled:opacity-30 text-foreground items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 w-10 h-10 rounded-full bg-muted hover:bg-black/20 text-foreground items-center justify-center transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
