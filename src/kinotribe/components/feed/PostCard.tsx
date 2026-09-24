import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Clapperboard,
  MapPin,
  DollarSign,
  Calendar,
  Globe,
  CheckCircle2,
  Send,
  Sparkles,
  Banknote,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Post, User, Application } from '../../types';
import { CinemaMediaFrame } from '../../utils/cinemaMedia';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  isFollowing: boolean;
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onOpenApply: (post: Post) => void;
  onUserClick: (user: User) => void;
  onAddComment: (postId: string, text: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  isFollowing,
  onOpenComments,
  onOpenShare,
  onOpenApply,
  onUserClick,
  onAddComment,
}) => {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showInlineCastingDetails, setShowInlineCastingDetails] = useState(false);
  const [showInlineComments, setShowInlineComments] = useState(false);
  const isOwnPost = currentUser.id === post.author.id;

  const handleDoubleTap = () => {
    setShowHeartPop(true);
    if (!post.isLiked) {
      onLikeToggle(post.id);
    }
    setTimeout(() => setShowHeartPop(false), 900);
  };

  const handleQuickCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  const casting = post.castingDetails;

  return (
    <article className="w-full bg-[#121826] border border-white/10 rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all mb-4">
      {/* Post Top Bar: Creator Info */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onUserClick(post.author)}
            className="relative shrink-0 group focus:outline-none active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-[16px] p-[2px] bg-black/60 border border-white/10 group-hover:border-[#FF6B00] transition-colors overflow-hidden shadow-sm">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-full h-full rounded-[14px] object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            {post.type === 'casting' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-[#FF6B00] text-white flex items-center justify-center text-[9px] font-bold shadow">
                🎬
              </span>
            )}
          </button>

          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onUserClick(post.author)}
                className="font-brand font-bold text-sm text-white hover:text-[#FF6B00] transition-colors truncate"
              >
                {post.author.username}
              </button>
              {post.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
              )}
            </div>

            {/* Subtitle: Display name · Roles · Country */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] truncate">
              <span className="text-neutral-300 font-medium">
                {post.author.name}
              </span>
              <span>·</span>
              <span className="text-[#FFB800] font-medium">
                {post.author.roles[0] || 'Filmmaker'}
              </span>
              <span>·</span>
              <span>{post.country}</span>
            </div>
          </div>
        </div>

        {/* Follow / Post Options button */}
        {!isOwnPost && (
          <button
            onClick={() => onFollowToggle(post.author.id)}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              isFollowing
                ? 'bg-white/10 text-neutral-300 hover:bg-white/15'
                : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-sm shadow-[#FF6B00]/20'
            }`}
          >
            {isFollowing ? 'Following' : '+ Follow'}
          </button>
        )}
      </div>

      {/* Caption & Post Content ON TOP (Facebook Style) */}
      {post.type !== 'casting' && (post.content.title || post.content.text || post.tags.length > 0) && (
        <div className="px-4 pb-3 space-y-1.5 text-left">
          {post.content.title && (
            <h4 className="font-brand font-bold text-base text-white tracking-tight">
              {post.content.title}
            </h4>
          )}

          {post.content.text && (
            <p
              className={`text-xs sm:text-sm text-neutral-200 leading-relaxed ${
                post.type === 'text'
                  ? 'bg-black/50 p-3.5 rounded-2xl border border-white/5 text-xs whitespace-pre-wrap'
                  : ''
              }`}
            >
              <span
                onClick={() => onUserClick(post.author)}
                className="font-bold text-white mr-1.5 hover:text-[#FF6B00] cursor-pointer"
              >
                {post.author.username}
              </span>
              {post.content.text}
            </p>
          )}

          {/* Hashtags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5 text-xs text-[#FFB800] font-medium">
              {post.tags.map((tag) => (
                <span key={tag} className="hover:underline cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media / Video Frame / Movie Poster with Double-tap Heart Detection */}
      {post.content.mediaUrl && (
        <div className="relative">
          {post.type === 'casting' && (post.content.aspect === '2:3' || post.content.aspect === '3:4') ? (
            /* Centered Theatrical Film Poster Container with ambient backlight */
            <div className="w-full bg-gradient-to-b from-black/90 via-[#0a0a0c] to-black p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-125 pointer-events-none"
                style={{ backgroundImage: `url(${post.content.mediaUrl})` }}
              />
              <div className="relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 ring-1 ring-white/10">
                <CinemaMediaFrame
                  src={post.content.mediaUrl}
                  alt={post.content.title || casting?.projectTitle || 'Movie poster'}
                  aspect={post.content.aspect || '2:3'}
                  title={post.content.title}
                  cameraSpec={post.content.cameraSpec || 'Official Movie Poster'}
                  type={post.content.mediaType}
                  isPoster={true}
                  onDoubleTap={handleDoubleTap}
                />
              </div>
            </div>
          ) : (
            <CinemaMediaFrame
              src={post.content.mediaUrl}
              alt={post.content.title || casting?.projectTitle || 'Cinema post'}
              aspect={post.content.aspect || (post.type === 'casting' ? '16:9' : '16:9')}
              title={post.content.title}
              cameraSpec={post.content.cameraSpec}
              type={post.content.mediaType}
              isPoster={post.type === 'casting' || post.content.isPoster}
              onDoubleTap={handleDoubleTap}
            />
          )}

          {/* Animated Heart Pop on Double Tap */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="w-24 h-24 fill-[#FF6B00] text-[#FF6B00] animate-heart-pop drop-shadow-2xl" />
            </div>
          )}
        </div>
      )}

      {/* UNIFIED CASTING / HIRING POST CARD (Single clean container, no duplication) */}
      {post.type === 'casting' && casting && (
        <div className="mx-3 my-2 rounded-2xl bg-[#0A0E17] border border-white/10 shadow-md overflow-hidden transition-all duration-300">
          {/* Header Row (Always visible once, never duplicated) */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                <Clapperboard className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white font-mono text-[10px] font-bold tracking-wider uppercase shrink-0 whitespace-nowrap shadow-sm">
                  Casting Call
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-none">
                  {casting.projectTitle}
                </span>
                <span className="text-xs text-neutral-400 font-medium truncate">
                  · {casting.projectType}
                </span>
                <span className="text-[11px] font-mono text-[#FFB800] shrink-0 whitespace-nowrap">
                  · {casting.applicationCount} applied
                </span>
              </div>
            </div>

            {/* Toggle button ONLY for posts with posters/images */}
            {post.content.mediaUrl && (
              <button
                type="button"
                onClick={() => setShowInlineCastingDetails((prev) => !prev)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  showInlineCastingDetails
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-neutral-200 hover:text-white'
                }`}
              >
                <span>{showInlineCastingDetails ? 'Hide Details' : 'Details'}</span>
                {showInlineCastingDetails ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#FFB800]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#FF6B00]" />
                )}
              </button>
            )}
          </div>

          {/* Text-Only Production Notice Ribbon if no poster image */}
          {!post.content.mediaUrl && (
            <div className="mx-3.5 mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-[#FFB800]">
              <FileText className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
              <span>OFFICIAL PRODUCTION SLATE · TEXT-ONLY NOTICE</span>
            </div>
          )}

          {/* Expanded Details Body & Apply Button (Smooth fade & reveal, no duplication) */}
          {(!post.content.mediaUrl || showInlineCastingDetails) && (
            <div className="px-3.5 sm:px-4 pb-4 pt-3 space-y-3.5 border-t border-white/10 animate-fade-in">
              {/* Project Title & Description */}
              <div>
                <h4 className="font-brand font-bold text-base text-white tracking-tight leading-snug">
                  {casting.projectTitle}
                </h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  {post.content.text}
                </p>
              </div>

              {/* Roles Needed Tags */}
              <div className="space-y-1">
                <div className="text-[11px] text-[#94A3B8] font-medium">
                  Roles Needed:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {casting.rolesNeeded.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-neutral-200 text-xs font-medium whitespace-nowrap shadow-sm"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Production Specs & Compensation Row */}
              <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-neutral-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">{casting.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">{casting.languageRequirement}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">Deadline: {casting.deadline}</span>
                  </div>
                </div>

                {/* Compensation Row */}
                <div className="pt-2 border-t border-white/5 flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] block font-semibold">
                      Compensation
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 leading-snug break-words">
                      {casting.compensationAmount || casting.compensationType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Row for Casting: In-App Apply Button (Visible only here after clicking Details!) */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {casting.requirementsNote || 'Audition reel required'}
                  </p>
                </div>
                <button
                  onClick={() => onOpenApply(post)}
                  className="shrink-0 whitespace-nowrap px-4 py-2 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-[#FF6B00]/20"
                >
                  <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Apply for Role</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engagement Actions Row */}
      <div className="px-4 pt-3 pb-2.5 flex items-center justify-between text-neutral-300 border-t border-white/10">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Like */}
          <button
            onClick={() => onLikeToggle(post.id)}
            className="flex items-center gap-1.5 group focus:outline-none hover:text-white transition-colors active:scale-90"
            aria-label="Like post"
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                post.isLiked
                  ? 'fill-[#FF6B00] text-[#FF6B00]'
                  : 'group-hover:text-[#FF6B00]'
              }`}
            />
            <span className={`text-xs font-medium ${post.isLiked ? 'text-[#FF6B00] font-semibold' : 'text-neutral-300'}`}>
              Like {post.likes > 0 && `(${post.likes})`}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowInlineComments((prev) => !prev)}
            className={`flex items-center gap-1.5 transition-colors focus:outline-none active:scale-90 ${
              showInlineComments ? 'text-[#FFB800]' : 'hover:text-white text-neutral-300'
            }`}
            aria-label="Toggle comments"
          >
            <MessageCircle
              className={`w-4 h-4 transition-colors ${
                showInlineComments ? 'text-[#FFB800]' : 'text-[#94A3B8]'
              }`}
            />
            <span className="text-xs font-medium lowercase">
              comment {post.commentsCount > 0 && `(${post.commentsCount})`}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => onOpenShare(post)}
            className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none active:scale-90"
            aria-label="Share post"
          >
            <Share2 className="w-4 h-4 text-[#94A3B8] hover:text-[#FFB800] transition-colors" />
            <span className="text-xs font-medium text-neutral-300">
              Share
            </span>
          </button>
        </div>

        {/* Save / Bookmark */}
        <button
          onClick={() => onSaveToggle(post.id)}
          className="p-1 hover:text-[#FFB800] transition-colors focus:outline-none active:scale-90"
          aria-label="Save post"
          title="Save post"
        >
          <Bookmark
            className={`w-4 h-4 ${
              post.isSaved ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-[#94A3B8]'
            }`}
          />
        </button>
      </div>

      {/* Collapsible Comment Section (Closed by default) */}
      {showInlineComments && (
        <div className="border-t border-white/10 bg-[#0A0E17]/40 animate-fade-in">
          {/* Comment Section Teaser */}
          {post.commentsCount > 0 && (
            <div className="px-4 pt-3 pb-2">
              <button
                onClick={() => onOpenComments(post)}
                className="text-xs text-[#94A3B8] hover:text-[#FFB800] transition-colors font-medium block"
              >
                View all {post.commentsCount} comments
              </button>
              {post.comments.length > 0 && (
                <div className="text-xs text-neutral-300 mt-1.5 truncate">
                  <span className="font-semibold text-white mr-1.5">
                    {post.comments[0].author.username}
                  </span>
                  <span>{post.comments[0].text}</span>
                </div>
              )}
            </div>
          )}

          {/* Inline Quick Comment Form */}
          <form
            onSubmit={handleQuickCommentSubmit}
            className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2"
          >
            <div className="flex-1 flex items-center bg-white/5 rounded-full px-3.5 py-1.5 border border-white/10 focus-within:border-[#FF6B00]">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                autoFocus
                className="flex-1 bg-transparent text-xs text-white placeholder-[#94A3B8] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center disabled:opacity-40 disabled:bg-white/10 disabled:text-neutral-500 transition-all active:scale-90"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
