import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Sparkles, Clapperboard } from 'lucide-react';
import { StoryItem, User } from '../../types';

interface StoryViewerModalProps {
  stories: StoryItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (user: User) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  isOpen,
  onClose,
  onUserClick,
}) => {
  if (!isOpen || stories.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeStory = stories[currentIndex] || stories[0];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused) return;

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
  }, [isOpen, isPaused, currentIndex, stories.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg animate-fade-in select-none">
      {/* Container simulating a mobile cinema story frame */}
      <div className="relative w-full max-w-sm h-[88vh] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col justify-between">
        {/* Story Progress Bars */}
        <div className="absolute top-2.5 left-3 right-3 z-30 flex gap-1">
          {stories.map((s, idx) => (
            <div
              key={s.id}
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-[#FFB800] to-[#FF6B00] transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Creator Info Header */}
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
              className="w-8 h-8 rounded-full object-cover border border-[#FF6B00]"
            />
            <div>
              <span className="text-xs font-bold text-white block">
                {activeStory.author.username}
              </span>
              <span className="text-[10px] text-[#FFB800] font-mono">
                {activeStory.roleBadge} · {activeStory.timestamp}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Visual Media */}
        <div
          className="relative w-full h-full flex items-center justify-center bg-black"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={activeStory.mediaUrl}
            alt={activeStory.caption}
            className="w-full h-full object-cover"
          />

          {/* Vignette & subtitle scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

          {/* Caption text */}
          <div className="absolute bottom-6 left-4 right-4 z-20">
            <div className="p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-neutral-100 font-medium">
              <span className="text-[#FF6B00] font-mono text-[10px] block mb-0.5">
                SHOWREEL DISPATCH · 24FPS
              </span>
              {activeStory.caption}
            </div>
          </div>
        </div>

        {/* Tap areas for Prev / Next */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-16 w-1/3 z-20 focus:outline-none"
          aria-label="Previous story"
        />
        <button
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-16 w-1/3 z-20 focus:outline-none"
          aria-label="Next story"
        />
      </div>

      {/* Outer Next/Prev Arrows for Desktop */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="hidden md:flex absolute left-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
