import React, { useState } from "react";
import {
  Search,
  Heart,
  MessageCircle,
  Play,
  ChevronRight,
  MonitorPlay,
  Film,
  CalendarDays,
  MapPin,
  Banknote,
} from "lucide-react";
import { Post, User } from "../../types";
import { MOCK_USERS } from "../../data/mockCinemaData";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

type ExploreView = "posts" | "cards";

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
  const [activeView, setActiveView] = useState<ExploreView>("posts");
  const poolUsers = users && users.length > 0 ? users : MOCK_USERS;
  const query = searchTerm.trim().toLowerCase();

  // Filter creators
  const matchedUsers = poolUsers.filter((u) => {
    if (!query) return false;
    return (
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.country.toLowerCase().includes(query)
    );
  });

  const matchesQuery = (p: Post) => {
    if (!query) return true;
    const matchAuthor =
      p.author.name.toLowerCase().includes(query) || p.author.username.toLowerCase().includes(query);
    const matchText = (p.content.text || "").toLowerCase().includes(query);
    const matchTags = p.tags.some((t) => t.toLowerCase().includes(query));
    const casting = p.castingDetails;
    const matchCasting = Boolean(
      casting &&
        [
          casting.projectTitle,
          casting.projectType,
          casting.location,
          casting.country,
          casting.languageRequirement,
          casting.compensationType,
          ...casting.rolesNeeded,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query)),
    );
    return matchAuthor || matchText || matchTags || matchCasting;
  };

  const imagePosts = posts.filter((post) => Boolean(post.content.mediaUrl) && matchesQuery(post));
  const castingCards = posts.filter(
    (post) => post.type === "casting" && !post.content.mediaUrl && matchesQuery(post),
  );

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => setActiveView(value as ExploreView)}
      className="w-full h-full flex flex-col pb-20"
    >
      <div className="sticky top-0 z-30 bg-background">
        <div className="px-3.5 py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts, cards, people"
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </div>
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground">
          <TabsTrigger
            value="posts"
            className="h-full rounded-none border-b-2 border-transparent bg-transparent text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="cards"
            className="h-full rounded-none border-b-2 border-transparent bg-transparent text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Cards
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <TabsContent value="posts" className="mt-0 outline-none">
          <div className="animate-in fade-in duration-200">
            {searchTerm && matchedUsers.length > 0 && (
              <div className="px-4 py-3">
                <h3 className="text-foreground font-semibold mb-3">Accounts</h3>
                <div className="flex flex-col gap-3">
                  {matchedUsers.slice(0, 5).map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      onClick={() => onUserClick(user)}
                      className="h-auto w-full justify-between p-0 text-left hover:bg-transparent"
                    >
                      <span className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.username} className="h-12 w-12 rounded-full object-cover" />
                        <span>
                          <span className="block text-sm font-semibold leading-tight">{user.username}</span>
                          <span className="block text-xs leading-tight text-muted-foreground">{user.name}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-[2px] bg-background animate-in fade-in duration-300">
              {imagePosts.map((post, i) => {
              // Instagram Explore Grid Pattern (Repeats every 12 items)
              const patternIndex = i % 12;
              const isLargeLeft = patternIndex === 0;
              const isLargeRight = patternIndex === 7;
              const isLarge = isLargeLeft || isLargeRight;

              return (
                <Button
                  key={post.id}
                  variant="ghost"
                  onClick={() => onPostClick(post)}
                  className={`relative h-auto rounded-none p-0 group bg-secondary overflow-hidden focus:outline-none hover:bg-secondary ${
                    isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1 aspect-square"
                  }`}
                >
                  <img
                    src={post.content.mediaUrl}
                    alt={post.content.title || post.content.text || "Post"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

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
                </Button>
              );
              })}
            </div>
            {imagePosts.length === 0 && searchTerm && matchedUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="mb-4 h-12 w-12 opacity-50" strokeWidth={1} />
                <p>No posts found for “{searchTerm}”</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cards" className="mt-0 outline-none">
          <div className="divide-y divide-border animate-in fade-in duration-200">
            {castingCards.map((post) => {
              const casting = post.castingDetails;
              if (!casting) return null;
              return (
                <Button
                  key={post.id}
                  variant="ghost"
                  onClick={() => onPostClick(post)}
                  className="h-auto w-full justify-start rounded-none p-4 text-left hover:bg-muted/40"
                >
                  <span className="block w-full min-w-0">
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <MonitorPlay className="h-4 w-4" /> Casting call
                      <span className="font-normal normal-case">· {casting.projectType}</span>
                    </span>
                    <span className="block break-words text-base font-semibold text-foreground">
                      {casting.projectTitle || post.content.title || "Casting call"}
                    </span>
                    {post.content.text && (
                      <span className="mt-1 block line-clamp-2 whitespace-normal text-sm font-normal text-muted-foreground">
                        {post.content.text}
                      </span>
                    )}
                    <span className="mt-3 flex flex-wrap gap-2">
                      {casting.rolesNeeded.map((role) => (
                        <span key={role} className="rounded-sm border border-border px-2 py-1 text-xs font-normal text-foreground">
                          {role}
                        </span>
                      ))}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-normal text-muted-foreground">
                      {(casting.location || casting.country) && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{casting.location || casting.country}</span>
                      )}
                      <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />{casting.compensationType}{casting.compensationAmount ? ` · ${casting.compensationAmount}` : ""}</span>
                      {casting.deadline && (
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Deadline {casting.deadline}</span>
                      )}
                    </span>
                    <span className="mt-3 block text-xs font-normal text-muted-foreground">
                      {post.author.username} · {post.likes} likes · {post.commentsCount} comments
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
          {castingCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Film className="mb-4 h-12 w-12 opacity-50" strokeWidth={1} />
              <p>{searchTerm ? `No casting cards found for “${searchTerm}”` : "No casting cards yet"}</p>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
