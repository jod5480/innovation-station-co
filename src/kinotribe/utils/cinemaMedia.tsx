import React, { useState } from "react";
import { Film, Clapperboard, Camera, Video, Sparkles } from "lucide-react";

interface CinemaMediaFrameProps {
  src?: string;
  alt: string;
  aspect?: "1:1" | "16:9" | "4:5" | "2.39:1" | "2:3" | "3:4" | "auto";
  aspectRatio?: number;
  title?: string;
  cameraSpec?: string;
  type?: "image" | "video";
  isPoster?: boolean;
  onDoubleTap?: () => void;
  className?: string;
}

export const CinemaMediaFrame: React.FC<CinemaMediaFrameProps> = ({
  src,
  alt,
  aspect = "auto",
  aspectRatio,
  title,
  cameraSpec,
  type = "image",
  isPoster = false,
  onDoubleTap,
  className = "",
}) => {
  const [hasError, setHasError] = useState(!src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [lastTap, setLastTap] = useState(0);

  React.useEffect(() => {
    setHasError(!src);
  }, [src]);

  const isAuto = aspect === "auto" || !aspect;

  const aspectClass = isAuto
    ? ""
    : {
        "1:1": "aspect-square",
        "16:9": "aspect-video",
        "4:5": "aspect-instagram",
        "2.39:1": "aspect-cinemascope",
        "2:3": "aspect-[2/3] max-h-[520px]",
        "3:4": "aspect-[3/4] max-h-[85vh]",
      }[aspect] || "";

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
      className={`relative w-full overflow-hidden bg-background select-none group cursor-pointer ${aspectClass} ${className}`}
      style={
        aspectRatio
          ? { aspectRatio: `${aspectRatio}` }
          : aspect === "3:4"
            ? { aspectRatio: "3/4" }
            : aspect === "16:9"
              ? { aspectRatio: "16/9" }
              : undefined
      }
    >
      {/* 2.39:1 Anamorphic framing guidelines / letterbox markers */}
      {aspect === "2.39:1" && (
        <div className="absolute inset-0 pointer-events-none z-10 border-y border-border" />
      )}

      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-full ${
            isAuto ? "h-auto max-h-[85vh] object-contain block mx-auto" : "h-full object-cover"
          } transition-transform duration-500 group-hover:scale-[1.01]`}
        />
      ) : (
        /* Cinema Fallback Styled Frame (Zero-Broken-Image Policy) */
        <div
          className={`w-full ${isAuto ? "aspect-video" : "h-full"} flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 relative overflow-hidden`}
        >
          {/* Subtle film grain & viewfinder crosshair */}
          <div className="absolute inset-4 border border-white/15 pointer-events-none flex items-center justify-center">
            <div className="w-3 h-3 border-t border-l border-white/50 absolute top-0 left-0" />
            <div className="w-3 h-3 border-t border-r border-white/50 absolute top-0 right-0" />
            <div className="w-3 h-3 border-b border-l border-white/50 absolute bottom-0 left-0" />
            <div className="w-3 h-3 border-b border-r border-white/50 absolute bottom-0 right-0" />
            <div className="w-4 h-[1px] bg-black/20" />
            <div className="h-4 w-[1px] bg-black/20 absolute" />
          </div>

          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 border border-border mb-3 text-[var(--theme-color)]">
            {type === "video" ? (
              <Video className="w-6 h-6" />
            ) : (
              <Clapperboard className="w-6 h-6" />
            )}
          </div>
          <p className="text-sm font-medium text-neutral-200 text-center max-w-xs font-brand tracking-wide">
            {title || alt || "35mm Film Still"}
          </p>
          {cameraSpec && (
            <span className="text-[11px] text-muted-foreground font-mono mt-1 tracking-wider uppercase">
              {cameraSpec}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
