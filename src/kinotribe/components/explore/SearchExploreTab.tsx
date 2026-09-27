import React, { useState } from "react";
import {
  Search,
  Heart,
  MessageCircle,
  Play,
  Copy,
  ChevronRight,
  MonitorPlay,
  Film,
} from "lucide-react";
import { Post, User } from "../../types";
import { MOCK_USERS } from "../../data/mockCinemaData";

interface SearchExploreTabProps {
  posts: Post[];
  currentUser: User;
  users?: User[];
  onPostClick: (post: Post) => void;
  onUserClick: (user: User) => void;
  onFollowToggle: (userId: string) => void;
  followingIds: string[];
}

export const SearchExploreTab: React.FC<SearchExploreTabProps> = ({
  posts,
  currentUser,
  users,
  onPostClick,
  onUserClick,
  onFollowToggle,
  followingIds,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const poolUsers = users && users.length > 0 ? users : MOCK_USERS;

  // Filter creators
  const matchedUsers = poolUsers.filter((u) => {
    if (!searchTerm) return false;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.country.toLowerCase().includes(q)
    );
  });

  // Filter posts
  const matchedPosts = posts.filter((p) => {
    if (!searchTerm) return false;
    const q = searchTerm.toLowerCase();
    const matchAuthor =
      p.author.name.toLowerCase().includes(q) || p.author.username.toLowerCase().includes(q);
    const matchText = (p.content.text || "").toLowerCase().includes(q);
    const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
    return matchAuthor || matchText || matchTags;
  });

  return (
    <div className="w-full h-full flex flex-col pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-black px-3.5 py-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-black/[0.1] rounded-xl text-sm text-foreground placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {searchTerm ? (
          /* Search Results View */
          <div className="animate-in fade-in duration-200">
            {/* Matching Accounts */}
            {matchedUsers.length > 0 && (
              <div className="px-4 py-3">
                <h3 className="text-foreground font-semibold mb-3">Accounts</h3>
                <div className="flex flex-col gap-3">
                  {matchedUsers.slice(0, 5).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onUserClick(user)}
                      className="flex items-center justify-between group active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="text-left">
                          <span className="text-sm font-semibold text-foreground block leading-tight">
                            {user.username}
                          </span>
                          <span className="text-xs text-muted-foreground block leading-tight">
                            {user.name}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Posts */}
            {matchedPosts.length > 0 && (
              <div className="mt-2">
                <h3 className="text-foreground font-semibold mb-3 px-4">Posts</h3>
                <div className="grid grid-cols-3 gap-[2px]">
                  {matchedPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => onPostClick(post)}
                      className="relative aspect-square bg-secondary group overflow-hidden focus:outline-none"
                    >
                      {post.content.mediaUrl ? (
                        <img
                          src={post.content.mediaUrl}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-800 p-2 flex items-center justify-center">
                          <p className="text-[8px] text-foreground/50 text-center line-clamp-3 font-mono">
                            {post.content.text}
                          </p>
                        </div>
                      )}
                      {post.type === "video" && (
                        <Play className="w-4 h-4 text-foreground absolute top-2 right-2 drop-shadow-md" />
                      )}
                      {post.type === "casting" && (
                        <MonitorPlay className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchedUsers.length === 0 && matchedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <Search className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                <p>No results found for "{searchTerm}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Instagram-Style Staggered Explore Grid */
          <div className="grid grid-cols-3 gap-[2px] animate-in fade-in duration-300 bg-background">
            {posts.map((post, i) => {
              // Instagram Explore Grid Pattern (Repeats every 12 items)
              const patternIndex = i % 12;
              const isLargeLeft = patternIndex === 0;
              const isLargeRight = patternIndex === 7;
              const isLarge = isLargeLeft || isLargeRight;

              return (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className={`relative group bg-secondary overflow-hidden focus:outline-none ${
                    isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1 aspect-square"
                  }`}
                >
                  {post.content.mediaUrl ? (
                    <img
                      src={post.content.mediaUrl}
                      alt="Explore"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#121212] to-[#000000] p-3 flex flex-col items-center justify-center border border-white/5">
                      <Film className="w-5 h-5 text-neutral-600 mb-2" strokeWidth={1} />
                      <p className="text-[10px] text-muted-foreground text-center line-clamp-3 font-mono italic px-2">
                        {post.content.text}
                      </p>
                    </div>
                  )}

                  {/* Icon indicators for media type */}
                  {post.type === "video" && (
                    <Play
                      className="w-5 h-5 text-foreground absolute top-2 right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-white/20"
                      strokeWidth={1.5}
                    />
                  )}
                  {post.type === "casting" && (
                    <MonitorPlay
                      className="w-5 h-5 text-foreground absolute top-2 right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-[var(--theme-color)]"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Instagram-style Hover Overlay (likes/comments) */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-foreground text-sm font-bold z-10">
                    <span className="flex items-center gap-1.5 drop-shadow-md">
                      <Heart className="w-5 h-5 fill-white" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5 drop-shadow-md">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      {post.commentsCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
