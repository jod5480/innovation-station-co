import React, { useState } from 'react';
import { Film, Clapperboard, Camera, Video, Sparkles } from 'lucide-react';

interface CinemaMediaFrameProps {
  src?: string;
  alt: string;
  aspect?: '1:1' | '16:9' | '4:5' | '2.39:1' | '2:3' | '3:4';
  title?: string;
  cameraSpec?: string;
  type?: 'image' | 'video';
  isPoster?: boolean;
  onDoubleTap?: () => void;
  className?: string;
  theatreMode?: boolean;
}

export const CinemaMediaFrame: React.FC<CinemaMediaFrameProps> = ({
  src,
  alt,
  aspect = '16:9',
  title,
  cameraSpec,
  type = 'image',
  isPoster = false,
  onDoubleTap,
  className = '',
  theatreMode = true,
}) => {
  const [hasError, setHasError] = useState(!src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [lastTap, setLastTap] = useState(0);

  const aspectClass = {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '4:5': 'aspect-instagram',
    '2.39:1': 'aspect-cinemascope',
    '2:3': 'aspect-[2/3] max-h-[520px]',
    '3:4': 'aspect-[3/4] max-h-[520px]',
  }[aspect];

  const handleTouchOrClick = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (onDoubleTap) onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <div
      onClick={handleTouchOrClick}
      className={`relative w-full overflow-hidden bg-neutral-900 select-none group cursor-pointer ${aspectClass} ${className}`}
    >
      {/* 2.39:1 Anamorphic framing guidelines / letterbox markers */}
      {aspect === '2.39:1' && (
        <div className="absolute inset-0 pointer-events-none z-10 border-y border-white/10" />
      )}

      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        /* Cinema Fallback Styled Frame (Zero-Broken-Image Policy) */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 relative overflow-hidden">
          {/* Subtle film grain & viewfinder crosshair */}
          <div className="absolute inset-4 border border-white/15 pointer-events-none flex items-center justify-center">
            <div className="w-3 h-3 border-t border-l border-[#FFB800]/50 absolute top-0 left-0" />
            <div className="w-3 h-3 border-t border-r border-[#FFB800]/50 absolute top-0 right-0" />
            <div className="w-3 h-3 border-b border-l border-[#FFB800]/50 absolute bottom-0 left-0" />
            <div className="w-3 h-3 border-b border-r border-[#FFB800]/50 absolute bottom-0 right-0" />
            <div className="w-4 h-[1px] bg-white/20" />
            <div className="h-4 w-[1px] bg-white/20 absolute" />
          </div>

          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/10 mb-3 text-[#FF6B00]">
            {type === 'video' ? <Video className="w-6 h-6" /> : <Clapperboard className="w-6 h-6" />}
          </div>
          <p className="text-sm font-medium text-neutral-200 text-center max-w-xs font-brand tracking-wide">
            {title || alt || '35mm Film Still'}
          </p>
          {cameraSpec && (
            <span className="text-[11px] text-neutral-400 font-mono mt-1 tracking-wider uppercase">
              {cameraSpec}
            </span>
          )}
        </div>
      )}

      {/* Camera / Lens tech overlay or Poster Badge */}
      {(cameraSpec || isPoster) && (
        <div className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {isPoster ? (
            <Clapperboard className="w-2.5 h-2.5 text-[#FF6B00]" />
          ) : (
            <Camera className="w-2.5 h-2.5 text-[#FFB800]" />
          )}
          <span>{isPoster ? (cameraSpec || 'Official Movie Poster') : cameraSpec}</span>
        </div>
      )}

      {/* Aspect Ratio / Poster Badge */}
      <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
        {isPoster && aspect === '2:3'
          ? '2:3 POSTER'
          : isPoster && aspect === '3:4'
          ? '3:4 ONE-SHEET'
          : aspect === '2.39:1'
          ? '2.39:1 SCOPE'
          : aspect.toUpperCase()}
      </div>
    </div>
  );
};
