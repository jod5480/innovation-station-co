import React, { useState } from 'react';
import {
  X,
  Clapperboard,
  Camera,
  Film,
  FileText,
  DollarSign,
  Calendar,
  Globe,
  MapPin,
  Sparkles,
  Plus,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { User, Post, CinemaRole, ProjectType } from '../../types';
import { ALL_ROLES, COUNTRIES_DATA, LANGUAGES_LIST } from '../../data/mockCinemaData';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPostCreated: (post: Post) => void;
  initialMode?: 'regular' | 'casting';
}

const PRESET_CINEMA_IMAGES = [
  {
    title: 'Anamorphic 35mm Night Diner',
    url: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1000&auto=format&fit=crop&q=80',
    spec: 'Cooke Anamorphic /i 40mm · T2.3',
  },
  {
    title: 'Joshua Tree 35mm Horizon',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80',
    spec: 'ARRI 416 Super 16mm · 500T',
  },
  {
    title: 'Parisian Cinema Scouting',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
    spec: 'Leica Summilux-C 35mm',
  },
  {
    title: 'Virtual Production LED Stage',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
    spec: 'RED V-Raptor XL 8K',
  },
];

export const PRESET_CASTING_POSTERS = [
  {
    title: 'Chasing Dusk (Indie Desert Drama)',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=80',
    aspect: '2:3' as const,
    label: 'Desert Sunset',
  },
  {
    title: 'Neon Noir Horizon (Sci-Fi Thriller)',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=900&auto=format&fit=crop&q=80',
    aspect: '2:3' as const,
    label: 'Cyberpunk Noir',
  },
  {
    title: 'Les Ombres Bleues (French Drama)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
    aspect: '3:4' as const,
    label: 'Arthouse Drama',
  },
  {
    title: 'Gully Noir (Monsoon Mumbai Street)',
    url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=900&auto=format&fit=crop&q=80',
    aspect: '2:3' as const,
    label: 'Mumbai Noir',
  },
  {
    title: 'Analog 35mm Clapper (Studio Film)',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&auto=format&fit=crop&q=80',
    aspect: '2:3' as const,
    label: 'Studio Film',
  },
  {
    title: 'The Bell of Deptford (Period Lookbook)',
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&auto=format&fit=crop&q=80',
    aspect: '16:9' as const,
    label: 'London Period',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  initialMode = 'regular',
}) => {
  if (!isOpen) return null;

  const [postMode, setPostMode] = useState<'regular' | 'casting'>(initialMode);

  // Regular post fields
  const [regularType, setRegularType] = useState<'photo' | 'video' | 'text'>('photo');
  const [captionText, setCaptionText] = useState('');
  const [mediaUrl, setMediaUrl] = useState(PRESET_CINEMA_IMAGES[0].url);
  const [cameraSpec, setCameraSpec] = useState(PRESET_CINEMA_IMAGES[0].spec);
  const [aspect, setAspect] = useState<'16:9' | '4:5' | '2.39:1' | '1:1'>('16:9');
  const [addToPortfolio, setAddToPortfolio] = useState(false);
  const [portfolioRole, setPortfolioRole] = useState<string>(currentUser.roles[0] || 'Cinematography');

  // Casting post fields
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Short Film');
  const [rolesNeeded, setRolesNeeded] = useState<CinemaRole[]>(['Acting']);
  const [locationStr, setLocationStr] = useState('Los Angeles, CA');
  const [castingCountry, setCastingCountry] = useState(currentUser.country);
  const [castingLanguage, setCastingLanguage] = useState(currentUser.languages[0] || 'English');
  const [compType, setCompType] = useState<'Paid' | 'Unpaid' | 'Negotiable'>('Paid');
  const [compAmount, setCompAmount] = useState('$500 / day + IMDB credit');
  const [deadline, setDeadline] = useState('2026-11-15');
  const [castingDescription, setCastingDescription] = useState('');
  const [auditionRequirements, setAuditionRequirements] = useState('Submit a 2-minute dramatic reel or monologue.');

  // Casting Artwork: Poster vs No Image (Text-Only Notice)
  const [castingPosterChoice, setCastingPosterChoice] = useState<'poster' | 'none'>('poster');
  const [castingPosterUrl, setCastingPosterUrl] = useState<string>(PRESET_CASTING_POSTERS[0].url);
  const [castingPosterAspect, setCastingPosterAspect] = useState<'2:3' | '3:4' | '16:9'>('2:3');
  const [customPosterInput, setCustomPosterInput] = useState<string>('');

  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCastingPosterUrl(reader.result);
        setCastingPosterChoice('poster');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRoleToggle = (role: CinemaRole) => {
    if (rolesNeeded.includes(role)) {
      if (rolesNeeded.length > 1) {
        setRolesNeeded(rolesNeeded.filter((r) => r !== role));
      }
    } else {
      setRolesNeeded([...rolesNeeded, role]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (postMode === 'regular') {
      const newPost: Post = {
        id: `post_${Date.now()}`,
        authorId: currentUser.id,
        author: currentUser,
        createdAt: 'Just now',
        type: regularType,
        country: currentUser.country,
        countryCode: currentUser.countryCode,
        language: currentUser.languages[0] || 'English',
        content: {
          text: captionText || 'Behind the scenes on our latest cinema project.',
          mediaUrl: regularType !== 'text' ? mediaUrl : undefined,
          mediaType: regularType === 'video' ? 'video' : 'image',
          aspect: aspect,
          title: `${currentUser.name} — Film Still`,
          cameraSpec: cameraSpec || 'Cinema 35mm Format',
        },
        likes: 1,
        isLiked: true,
        commentsCount: 0,
        comments: [],
        isSaved: false,
        isPortfolio: addToPortfolio,
        portfolioRole: addToPortfolio ? portfolioRole : undefined,
        tags: ['IndieFilm', 'Cinema', 'BTS', currentUser.roles[0] || 'Filmmaker'],
      };
      onPostCreated(newPost);
    } else {
      const countryObj = COUNTRIES_DATA.find((c) => c.name === castingCountry);
      const chosenPoster = customPosterInput.trim() || castingPosterUrl.trim();
      const finalPosterUrl = castingPosterChoice === 'poster' && chosenPoster ? chosenPoster : undefined;

      const newPost: Post = {
        id: `post_casting_${Date.now()}`,
        authorId: currentUser.id,
        author: currentUser,
        createdAt: 'Just now',
        type: 'casting',
        country: castingCountry,
        countryCode: countryObj ? countryObj.code : 'US',
        language: castingLanguage,
        content: {
          text: castingDescription || `Casting & hiring call for our upcoming project "${projectTitle}".`,
          mediaUrl: finalPosterUrl,
          mediaType: 'image',
          aspect: finalPosterUrl ? castingPosterAspect : '16:9',
          title: `${projectTitle} — ${finalPosterUrl ? 'Official Poster' : 'Production Call'}`,
          cameraSpec: finalPosterUrl ? 'Official Movie Poster' : 'Production Notice',
          isPoster: !!finalPosterUrl,
        },
        castingDetails: {
          projectTitle: projectTitle || 'Untitled Film Project',
          projectType,
          rolesNeeded,
          location: locationStr,
          country: castingCountry,
          countryCode: countryObj ? countryObj.code : 'US',
          languageRequirement: castingLanguage,
          compensationType: compType,
          compensationAmount: compAmount,
          deadline,
          requirementsNote: auditionRequirements,
          applicationCount: 0,
          howToApply: 'in_app',
        },
        likes: 0,
        isLiked: false,
        commentsCount: 0,
        comments: [],
        isSaved: false,
        tags: ['CastingCall', 'FilmAudition', projectType.replace(/\s+/g, ''), ...rolesNeeded],
      };
      onPostCreated(newPost);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Clapperboard Slate Header */}
        <div className="border-b border-white/10 bg-[#0A0E17]">
          {/* Film slate zebra stripes */}
          <div className="h-3 w-full flex overflow-hidden">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 transform -skew-x-12 ${
                  i % 2 === 0 ? 'bg-[#FF6B00]' : 'bg-[#0A0E17]'
                }`}
              />
            ))}
          </div>

          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-[#FF6B00]" />
              <div>
                <span className="font-brand font-bold text-sm tracking-wide text-white">
                  CREATE PRODUCTION CUT
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono block">
                  SCENE 01 / TAKE 01 · 24FPS
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Post Mode Segmented Controller: Regular ⇄ Casting Call */}
        <div className="p-3 bg-[#0A0E17] border-b border-white/10">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#121826] rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setPostMode('regular')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                postMode === 'regular'
                  ? 'bg-[#FF6B00] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Regular Cinema Post
            </button>
            <button
              type="button"
              onClick={() => setPostMode('casting')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                postMode === 'casting'
                  ? 'bg-[#FF6B00] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" /> Casting / Hiring Call
            </button>
          </div>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
          {postMode === 'regular' ? (
            /* REGULAR POST FIELDS */
            <>
              {/* Type selector */}
              <div className="flex gap-2">
                {(['photo', 'video', 'text'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRegularType(t)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border capitalize transition-colors ${
                      regularType === t
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-white font-bold'
                        : 'bg-black/50 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t === 'photo' && '📸 Film Still / Photo'}
                    {t === 'video' && '🎥 Reel / Showreel'}
                    {t === 'text' && '📜 Script / Excerpt'}
                  </button>
                ))}
              </div>

              {regularType !== 'text' && (
                <>
                  {/* Preset Quick Select or Custom URL */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Select Cinema Media Preset or Enter URL
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {PRESET_CINEMA_IMAGES.map((img) => (
                        <button
                          key={img.title}
                          type="button"
                          onClick={() => {
                            setMediaUrl(img.url);
                            setCameraSpec(img.spec);
                          }}
                          className={`relative rounded-lg overflow-hidden border aspect-video group ${
                            mediaUrl === img.url
                              ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/30'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  {/* Camera specs & Aspect Ratio */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Camera / Lens Spec
                      </label>
                      <input
                        type="text"
                        value={cameraSpec}
                        onChange={(e) => setCameraSpec(e.target.value)}
                        placeholder="e.g. Arri Alexa Mini · 35mm Anamorphic"
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Aspect Ratio
                      </label>
                      <select
                        value={aspect}
                        onChange={(e) => setAspect(e.target.value as any)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                      >
                        <option value="16:9">16:9 Widescreen</option>
                        <option value="2.39:1">2.39:1 Anamorphic Cinemascope</option>
                        <option value="4:5">4:5 Instagram Portrait</option>
                        <option value="1:1">1:1 Square Format</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  {regularType === 'text' ? 'Screenplay Excerpt / Dialogue' : 'Caption & Context'}
                </label>
                <textarea
                  rows={regularType === 'text' ? 6 : 3}
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder={
                    regularType === 'text'
                      ? 'INT. SOUNDSTAGE - NIGHT\n\nFade in on 35mm camera dolly...'
                      : 'Share production insights, lighting notes, or scene backstory...'
                  }
                  className={`w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00] ${
                    regularType === 'text' ? 'font-mono text-[11px]' : ''
                  }`}
                />
              </div>

              {/* Option to Add to Portfolio (Pro Showcase) */}
              <div className="p-3.5 bg-black/60 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Add to Portfolio</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#FFB800]/10 text-[#FFB800] font-semibold">
                          SHOWCASE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        Feature this work in your curated film portfolio to share with producers.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={addToPortfolio}
                      onChange={(e) => setAddToPortfolio(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6B00]"></div>
                  </label>
                </div>

                {addToPortfolio && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                    <label className="text-[11px] text-neutral-400 whitespace-nowrap">
                      Credited Role:
                    </label>
                    <select
                      value={portfolioRole}
                      onChange={(e) => setPortfolioRole(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFB800]"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r} className="bg-neutral-900 text-white">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* CASTING / HIRING CALL FIELDS */
            <>
              {/* Project Title & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. The Blue Hour"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Project Type
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Feature Film">Feature Film</option>
                    <option value="Short Film">Short Film</option>
                    <option value="Web Series">Web Series</option>
                    <option value="Commercial / Ad">Commercial / Ad</option>
                    <option value="Theatre / Stage">Theatre / Stage</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>
              </div>

              {/* POSTER OR NO-POSTER SELECTION (Key Feature) */}
              <div className="p-3.5 bg-black/60 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Production Artwork & Visuals
                  </label>
                  <span className="text-[11px] font-mono text-[#FFB800]">
                    {castingPosterChoice === 'poster' ? '🎬 Movie Poster' : '📝 Text-Only Notice'}
                  </span>
                </div>

                {/* Switcher Pills */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/80 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCastingPosterChoice('poster')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      castingPosterChoice === 'poster'
                        ? 'bg-[#FF6B00] text-white font-bold shadow-sm shadow-[#FF6B00]/30'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Add Movie Poster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCastingPosterChoice('none')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      castingPosterChoice === 'none'
                        ? 'bg-[#FFB800] text-black font-bold shadow-sm shadow-[#FFB800]/30'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>No Poster (Text Only)</span>
                  </button>
                </div>

                {castingPosterChoice === 'poster' ? (
                  <div className="space-y-3 pt-1">
                    {/* Cinema Movie Poster Presets */}
                    <div>
                      <div className="text-[11px] text-neutral-300 font-medium mb-1.5 flex items-center justify-between">
                        <span>Select a Cinematic Film Poster Preset:</span>
                        <span className="text-[10px] text-[#94A3B8]">2:3 / 3:4 Formats</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {PRESET_CASTING_POSTERS.map((poster) => {
                          const isSelected =
                            !customPosterInput && castingPosterUrl === poster.url;
                          return (
                            <button
                              key={poster.title}
                              type="button"
                              onClick={() => {
                                setCustomPosterInput('');
                                setCastingPosterUrl(poster.url);
                                setCastingPosterAspect(poster.aspect);
                              }}
                              className={`relative rounded-xl overflow-hidden border aspect-[2/3] group transition-all text-left ${
                                isSelected
                                  ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/40 scale-[1.03] z-10 shadow-lg'
                                  : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                              }`}
                            >
                              <img
                                src={poster.url}
                                alt={poster.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-1.5">
                                <span className="text-[9px] text-white font-bold leading-tight line-clamp-2">
                                  {poster.label}
                                </span>
                                <span className="text-[7px] text-[#FFB800] font-mono mt-0.5">
                                  {poster.aspect}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Poster URL or Upload Local Image */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customPosterInput}
                          onChange={(e) => {
                            setCustomPosterInput(e.target.value);
                            if (e.target.value) {
                              setCastingPosterUrl(e.target.value);
                            }
                          }}
                          placeholder="Or paste custom movie poster URL (https://...)"
                          className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                        />
                        <label className="shrink-0 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-xs text-neutral-200 cursor-pointer flex items-center gap-1.5 transition-colors">
                          <Plus className="w-3.5 h-3.5 text-[#FFB800]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Poster Aspect Ratio Selector */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                        <span className="text-[11px] text-[#94A3B8] font-medium">
                          Poster Frame Ratio:
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { val: '2:3', label: '2:3 Standard Poster' },
                            { val: '3:4', label: '3:4 Festival Lookbook' },
                            { val: '16:9', label: '16:9 Key Art Banner' },
                          ].map((fmt) => (
                            <button
                              key={fmt.val}
                              type="button"
                              onClick={() => setCastingPosterAspect(fmt.val as any)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                castingPosterAspect === fmt.val
                                  ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-white font-bold'
                                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {fmt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 rounded-xl border border-dashed border-[#FFB800]/30 text-center space-y-1">
                    <div className="text-xs font-semibold text-[#FFB800] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
                      <span>Text-Only Production Notice Active</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                      No poster image will be shown. Your casting call will be formatted cleanly as an official cinema production bulletin with roles, audition details, and compensation.
                    </p>
                  </div>
                )}
              </div>

              {/* Roles Needed */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Role(s) Needed (Multi-select)
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-black/50 rounded-xl border border-white/10">
                  {ALL_ROLES.map((r) => {
                    const active = rolesNeeded.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleToggle(r)}
                        className={`p-1.5 rounded-lg text-[11px] font-medium text-left truncate transition-colors ${
                          active
                            ? 'bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/50 font-bold'
                            : 'bg-white/5 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location, Country, Language */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    placeholder="Paris, France"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Country</label>
                  <select
                    value={castingCountry}
                    onChange={(e) => setCastingCountry(e.target.value)}
                    className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                  >
                    {COUNTRIES_DATA.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Language</label>
                  <select
                    value={castingLanguage}
                    onChange={(e) => setCastingLanguage(e.target.value)}
                    className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                  >
                    {LANGUAGES_LIST.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compensation & Deadline */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Compensation Type
                  </label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as any)}
                    className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Negotiable">Negotiable</option>
                    <option value="Unpaid">Unpaid / Indie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Rate / Pay Details
                  </label>
                  <input
                    type="text"
                    value={compAmount}
                    onChange={(e) => setCompAmount(e.target.value)}
                    placeholder="$500 / day"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Description & Audition notes */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Project Description & Synopsis
                </label>
                <textarea
                  rows={2}
                  required
                  value={castingDescription}
                  onChange={(e) => setCastingDescription(e.target.value)}
                  placeholder="Outline the story logline, tone references, and characters..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Audition / Self-tape Requirements
                </label>
                <input
                  type="text"
                  value={auditionRequirements}
                  onChange={(e) => setAuditionRequirements(e.target.value)}
                  placeholder="e.g. 2-minute monologue in character or showreel"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </>
          )}

          {/* Submit button */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-white/10 text-neutral-300 hover:bg-white/15 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-md shadow-[#FF6B00]/20"
            >
              <Clapperboard className="w-4 h-4" />
              {postMode === 'regular' ? 'Publish to Kinotribe Feed' : 'Broadcast Casting Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
