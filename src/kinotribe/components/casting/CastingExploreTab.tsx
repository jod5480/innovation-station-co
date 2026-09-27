import React from 'react';
import {
  Clapperboard,
  MapPin,
  Calendar,
  Globe,
  Bookmark,
  Banknote,
  Users,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Post, User } from '../../types';

interface CastingExploreTabProps {
  posts: Post[];
  currentUser: User;
  onOpenApply: (post: Post) => void;
  onOpenCreateCasting: () => void;
  onSaveToggle: (postId: string) => void;
  onUserClick: (user: User) => void;
}

export const CastingExploreTab: React.FC<CastingExploreTabProps> = ({
  posts,
  onOpenApply,
  onSaveToggle,
  onUserClick,
}) => {
  // Filter casting posts
  const castingPosts = posts.filter((p) => p.type === 'casting' && p.castingDetails);

  return (
    <div className="w-full space-y-4 pb-20 pt-1">
      {/* Casting Post Cards Stream */}
      <div className="space-y-4">
        {castingPosts.length === 0 ? (
          <div className="p-12 text-center bg-neutral-900/60 rounded-2xl border border-neutral-800">
            <Clapperboard className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-300">No active casting calls</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Broadcast a new production audition or casting opportunity to filmmakers worldwide.
            </p>
          </div>
        ) : (
          castingPosts.map((post) => {
            const casting = post.castingDetails!;
            return (
              <div
                key={post.id}
                className="p-5 rounded-[24px] bg-[#121826] border border-white/10 hover:border-[#FF6B00]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-3.5"
              >
                {/* Poster & Type Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onUserClick(post.author)}
                      className="shrink-0 active:scale-95 transition-transform"
                    >
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#FF6B00]/40 shadow-sm"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onUserClick(post.author)}
                          className="font-brand font-bold text-sm text-white hover:text-[#FF6B00] truncate"
                        >
                          {post.author.name}
                        </button>
                        <span className="text-xs text-[#94A3B8] truncate">
                          @{post.author.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] truncate">
                        <span className="text-[#FFB800] font-medium">{casting.projectType}</span>
                        <span>·</span>
                        <span>{post.country}</span>
                        <span>·</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => onSaveToggle(post.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-[#FFB800] hover:bg-white/10 transition-colors active:scale-90 shrink-0 border border-white/5"
                    title={post.isSaved ? 'Saved to bookmarks' : 'Save casting call'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        post.isSaved ? 'fill-[#FF6B00] text-[#FF6B00]' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Project Title, Poster & Description */}
                <div className="flex items-start gap-3.5">
                  {post.content.mediaUrl ? (
                    <div className="relative shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-md bg-black group">
                      <img
                        src={post.content.mediaUrl}
                        alt={casting.projectTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[8px] font-mono text-[#FFB800] font-bold">
                        POSTER
                      </div>
                    </div>
                  ) : (
                    <div className="shrink-0 w-12 sm:w-14 h-16 sm:h-20 rounded-xl bg-black/60 border border-dashed border-white/15 flex flex-col items-center justify-center text-[#94A3B8] p-1 text-center">
                      <Clapperboard className="w-4 h-4 text-[#FF6B00] mb-1" />
                      <span className="text-[8px] font-mono leading-none">SLATE</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-brand font-bold text-lg text-white tracking-tight leading-snug">
                        {casting.projectTitle}
                      </h3>
                      {!post.content.mediaUrl && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#FFB800] text-[10px] font-mono font-medium flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" /> Text-Only Notice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                      {post.content.text}
                    </p>
                  </div>
                </div>

                {/* Roles Needed Badges */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {casting.rolesNeeded.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-neutral-200 text-xs font-medium whitespace-nowrap shadow-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>

                {/* Production Specs & Compensation Inset Box */}
                <div className="p-3.5 bg-black/60 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-neutral-300 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                      <span className="truncate">{casting.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                      <span className="truncate">{casting.languageRequirement}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                      <span className="truncate">Deadline: {casting.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300 min-w-0 font-mono text-[11px]">
                      <Users className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                      <span>{casting.applicationCount} Applied</span>
                    </div>
                  </div>

                  {/* Clean Dedicated Compensation Row */}
                  <div className="pt-2 border-t border-white/5 flex items-start gap-2.5 text-xs">
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

                {/* In-App Apply Call to action with non-collapsing pill button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {casting.requirementsNote || 'Self-tapes accepted'}
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
            );
          })
        )}
      </div>
    </div>
  );
};
