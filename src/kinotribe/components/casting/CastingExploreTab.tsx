import React from "react";
import { Clapperboard, MapPin, Calendar, Globe, Bookmark, Banknote } from "lucide-react";
import { Post, User } from "../../types";
import { CinemaMediaFrame } from "../../utils/cinemaMedia";

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
  const castingPosts = posts.filter((p) => p.type === "casting" && p.castingDetails);

  return (
    <div className="w-full pb-20 pt-1">
      <div className="space-y-0">
        {castingPosts.length === 0 ? (
          <div className="p-12 text-center apple-glass-card rounded-[28px] border border-border shadow-xl">
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
              <article
                key={post.id}
                className="w-full bg-background border-b border-neutral-800/80 pb-3 mb-2 select-none text-left"
              >
                {/* Author Header */}
                <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onUserClick(post.author)}
                      className="relative shrink-0 active:scale-95 transition-transform"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-neutral-800 to-neutral-700 hover:from-[var(--theme-color)] hover:to-[#000000] transition-all overflow-hidden">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--theme-color)] text-foreground flex items-center justify-center text-[8px] font-bold ring-2 ring-black">
                        🎬
                      </span>
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onUserClick(post.author)}
                          className="font-semibold text-sm text-foreground hover:text-neutral-300 transition-colors"
                        >
                          {post.author.username}
                        </button>
                        <span className="text-neutral-500 text-xs">·</span>
                        <span className="text-muted-foreground text-xs">{post.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <button
                          onClick={() => onUserClick(post.author)}
                          className="text-neutral-300 hover:text-foreground font-medium"
                        >
                          {post.author.name}
                        </button>
                        <span>·</span>
                        <span className="text-[var(--theme-color)] font-medium">{casting.projectType}</span>
                        {post.country && (
                          <>
                            <span>·</span>
                            <span>{post.country}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSaveToggle(post.id)}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors active:scale-90"
                    title={post.isSaved ? "Saved" : "Save casting call"}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${post.isSaved ? "fill-white text-foreground" : ""}`}
                      strokeWidth={1.75}
                    />
                  </button>
                </div>

                {/* Full-width media with gradient overlay */}
                <div className="relative w-full overflow-hidden">
                  {post.content.mediaUrl ? (
                    <>
                      <CinemaMediaFrame
                        src={post.content.mediaUrl}
                        alt={casting.projectTitle || "Casting poster"}
                        aspect={post.content.aspect || "3:4"}
                        aspectRatio={post.content.aspectRatio}
                        title={post.content.title}
                        type={post.content.mediaType}
                      />
                      {/* Gradient overlay with title + caption */}
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
                      {/* Casting Call badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-color)]/90 backdrop-blur-sm text-foreground text-[11px] font-bold tracking-wide shadow-lg">
                        <Clapperboard className="w-3 h-3" />
                        <span>Casting Call</span>
                      </div>
                    </>
                  ) : (
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
                        <p className="text-sm text-neutral-300 leading-relaxed">
                          {post.content.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Casting Details Strip */}
                <div className="px-3.5 sm:px-4 pt-3 pb-1 space-y-3">
                  {/* Roles + applied count */}
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

                  {/* Meta chips */}
                  {(casting.location ||
                    casting.languageRequirement ||
                    casting.deadline ||
                    casting.compensationAmount ||
                    casting.compensationType) && (
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

                  {/* Apply CTA */}
                  <div className="flex items-center justify-between gap-3 pt-0.5 pb-1">
                    <p className="text-[11px] text-neutral-500 truncate flex-1">
                      {casting.requirementsNote || ""}
                    </p>
                    <button
                      onClick={() => onOpenApply(post)}
                      className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-lg bg-[var(--theme-color)] hover:bg-[#9d4edd] text-foreground font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-[var(--theme-color)]/20"
                    >
                      <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                      <span>Apply for Role</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
