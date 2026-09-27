import React, { useState } from 'react';
import {
  Search,
  Clapperboard,
  Film,
  Camera,
  Heart,
  MessageCircle,
  MapPin,
  Sparkles,
  UserCheck,
  Globe,
  Star,
  ChevronRight,
  Play,
  Flame,
} from 'lucide-react';
import { Post, User, CinemaRole } from '../../types';
import { MOCK_USERS, ALL_ROLES } from '../../data/mockCinemaData';
import { CinemaMediaFrame } from '../../utils/cinemaMedia';

interface SearchExploreTabProps {
  posts: Post[];
  currentUser: User;
  onPostClick: (post: Post) => void;
  onUserClick: (user: User) => void;
  onFollowToggle: (userId: string) => void;
  followingIds: string[];
}

export const SearchExploreTab: React.FC<SearchExploreTabProps> = ({
  posts,
  currentUser,
  onPostClick,
  onUserClick,
  onFollowToggle,
  followingIds,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'People' | 'Reels' | 'Casting' | 'Tags'>('All');

  // Filter creators
  const matchedUsers = MOCK_USERS.filter((u) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.country.toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q)) ||
      u.languages.some((l) => l.toLowerCase().includes(q))
    );
  });

  // Filter posts
  const matchedPosts = posts.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const matchAuthor = p.author.name.toLowerCase().includes(q) || p.author.username.toLowerCase().includes(q);
    const matchText = (p.content.text || '').toLowerCase().includes(q);
    const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
    const matchCountry = p.country.toLowerCase().includes(q);
    return matchAuthor || matchText || matchTags || matchCountry;
  });

  return (
    <div className="w-full space-y-5 pb-20">
      {/* Search Input Bar (TikTok Rounded Pill) */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by filmmaker, role, country, language, #Cinematography..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#121826] border border-white/10 rounded-full text-xs text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#FF6B00] shadow-inner"
        />
      </div>

      {/* Filter Categories (TikTok Pill Capsules) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['All', 'People', 'Reels', 'Casting', 'Tags'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              activeFilter === tab
                ? 'bg-[#FF6B00] text-white font-bold shadow-md shadow-[#FF6B00]/25'
                : 'bg-[#121826] text-[#94A3B8] border border-white/10 hover:text-white'
            }`}
          >
            {tab === 'All' && 'All Discovery'}
            {tab === 'People' && 'Filmmakers & Actors'}
            {tab === 'Reels' && 'Showreel Cuts'}
            {tab === 'Casting' && 'Audition Calls'}
            {tab === 'Tags' && 'Cinema Tags'}
          </button>
        ))}
      </div>

      {/* NOW PLAYING CINEMA PREMIERES (Inspired directly by user reference image) */}
      {(activeFilter === 'All' || activeFilter === 'Reels') && (
        <div className="space-y-3 p-4 rounded-3xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                <h3 className="font-brand font-black text-base text-white tracking-tight flex items-center gap-1.5">
                  Now Playing in Cinema
                </h3>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Official Festival Premieres & Theatrical Screenings
              </p>
            </div>
            {/* The "See More" button with orange border & dark base as in the user reference image */}
            <button
              onClick={() => setActiveFilter('Reels')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5 hover:bg-[#FF6B00] hover:text-white transition-all duration-200 flex items-center gap-1 active:scale-95 shadow-sm shadow-[#FF6B00]/20"
            >
              See More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal Scrolling Cinema Cards */}
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 pt-1">
            {[
              {
                id: 'np-1',
                title: 'Chasing Dusk',
                genre: 'Psychological Thriller · 35mm',
                rating: '4.9',
                year: '2026',
                director: 'Elena Rostova',
                poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
                festival: 'Sundance Grand Jury',
              },
              {
                id: 'np-2',
                title: 'Midnight Solitude',
                genre: 'Neo-Noir Drama · 16mm',
                rating: '4.8',
                year: '2025',
                director: 'Maya Chen',
                poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
                festival: 'Cannes Special Screening',
              },
              {
                id: 'np-3',
                title: 'Gully Noir',
                genre: 'Crime Drama · Anamorphic',
                rating: '4.7',
                year: '2026',
                director: 'Kabir Sen',
                poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80',
                festival: 'Berlinale Panorama',
              },
              {
                id: 'np-4',
                title: 'The Queen of Balogun',
                genre: 'Historical Epic · 65mm',
                rating: '4.9',
                year: '2026',
                director: 'Amara Okafor',
                poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
                festival: 'TIFF Spotlight',
              },
            ].map((film) => (
              <div
                key={film.id}
                className="w-48 shrink-0 rounded-2xl bg-[#0A0E17] border border-white/10 overflow-hidden group hover:border-[#FF6B00]/60 transition-all duration-200 flex flex-col justify-between shadow-md"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                  <img
                    src={film.poster}
                    alt={film.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-transparent to-black/30" />
                  
                  {/* Golden Amber Star Rating Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 text-[#FFB800] fill-[#FFB800]" />
                    <span className="text-[11px] font-bold text-white font-mono">{film.rating}</span>
                  </div>

                  {/* Year Tag */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#FF6B00] text-white text-[9px] font-bold tracking-wider uppercase shadow-sm">
                    {film.year}
                  </div>

                  {/* Play Trailer Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 group-hover:scale-110 active:scale-95 transition-all">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3 text-left">
                  <h4 className="font-brand font-bold text-xs text-white truncate group-hover:text-[#FF6B00] transition-colors">
                    {film.title}
                  </h4>
                  <p className="text-[10px] text-[#94A3B8] truncate mt-0.5 font-medium">
                    {film.genre}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] text-[#FFB800] font-mono truncate max-w-[120px]">
                      {film.festival}
                    </span>
                    <span className="text-[9px] text-neutral-400">
                      {film.director.split(' ')[1]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation Indicators (Active orange pill, inactive dots) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>
      )}

      {/* Curated Cinema Talent Spotlight (Horizontal Cards) */}
      {(activeFilter === 'All' || activeFilter === 'People') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-brand font-bold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              Filmmakers to Connect With
            </span>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              Regional & Global Talent
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {matchedUsers.map((user) => {
              const isFollowing = followingIds.includes(user.id);
              const isMe = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className="w-44 p-4 rounded-[22px] bg-[#121826] border border-white/10 shrink-0 text-center flex flex-col items-center justify-between hover:border-white/20 transition-all shadow-sm"
                >
                  <button
                    onClick={() => onUserClick(user)}
                    className="focus:outline-none"
                  >
                    <div className="relative mx-auto mb-2">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#FF6B00]/40"
                      />
                      <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-[8px] font-mono text-[#FFB800]">
                        {user.countryCode}
                      </span>
                    </div>

                    <h4 className="font-brand font-bold text-xs text-neutral-100 truncate max-w-[150px]">
                      {user.name}
                    </h4>
                    <span className="text-[10px] text-[#FFB800] block truncate font-medium">
                      {user.roles.slice(0, 2).join(' / ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                      {user.country}
                    </span>
                  </button>

                  <div className="w-full mt-3">
                    {!isMe ? (
                      <button
                        onClick={() => onFollowToggle(user.id)}
                        className={`w-full py-1.5 rounded-full text-xs font-bold transition-colors ${
                          isFollowing
                            ? 'bg-white/10 text-neutral-300 hover:bg-white/15'
                            : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-sm shadow-[#FF6B00]/20'
                        }`}
                      >
                        {isFollowing ? 'Following' : '+ Connect'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-500 block py-1">You</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-Column Explore Grid */}
      {(activeFilter === 'All' || activeFilter === 'Reels' || activeFilter === 'Casting') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-brand font-bold text-sm text-neutral-100">
              Trending Cinema Showcase
            </span>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              35mm Stills & Showreels
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {matchedPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostClick(post)}
                className="relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 group focus:outline-none"
              >
                {post.content.mediaUrl ? (
                  <img
                    src={post.content.mediaUrl}
                    alt={post.content.title || 'Post'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full p-3 flex flex-col justify-between text-left bg-gradient-to-br from-neutral-900 to-neutral-950">
                    <span className="font-mono text-[9px] text-[#FFB800] uppercase">
                      SCRIPT EXCERPT
                    </span>
                    <p className="text-[10px] text-neutral-300 line-clamp-4 font-mono">
                      {post.content.text}
                    </p>
                    <span className="text-[9px] text-[#94A3B8]">
                      @{post.author.username}
                    </span>
                  </div>
                )}

                {/* Type Badge */}
                {post.type === 'casting' && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#FF6B00] text-white font-mono text-[9px] font-bold shadow-sm">
                    CASTING
                  </div>
                )}

                {/* Hover Overlay with Stats & Creator */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-left">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="font-bold truncate max-w-[100px]">
                      @{post.author.username}
                    </span>
                    <span className="text-[10px] text-[#FFB800] font-mono">
                      {post.countryCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-white text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-[#FF6B00] text-[#FF6B00]" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                      {post.commentsCount}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-300 truncate">
                    {post.content.title || post.castingDetails?.projectTitle || 'Cinema Post'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
