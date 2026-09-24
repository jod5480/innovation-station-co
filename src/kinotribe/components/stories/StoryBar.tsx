import React from 'react';
import { Plus, Clapperboard } from 'lucide-react';
import { StoryItem, User } from '../../types';

interface StoryBarProps {
  stories: StoryItem[];
  currentUser: User;
  onOpenStory: (story: StoryItem, index: number) => void;
  onOpenCreateStory?: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({
  stories,
  currentUser,
  onOpenStory,
  onOpenCreateStory,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 px-1 mb-3 flex items-center gap-3.5 border-b border-white/[0.06]">
      {/* Current User: Add Story (TikTok Squircle Card) */}
      <div className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-transform">
        <div className="relative">
          <div className="w-[66px] h-[66px] rounded-[22px] p-[2.5px] bg-[#121826] border-2 border-dashed border-[#FF6B00]/50 group-hover:border-[#FF6B00] transition-all flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src={currentUser.avatar}
              alt="My Story"
              className="w-full h-full rounded-[18px] object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <button
            onClick={onOpenCreateStory}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center border-2 border-[#121826] font-bold shadow-md hover:scale-105 active:scale-90 transition-transform"
            title="Add your showreel snippet"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
        <span className="text-[11px] text-neutral-300 font-medium mt-1.5 truncate max-w-[68px]">
          Your Cut
        </span>
      </div>

      {/* Story Squircles from Community (TikTok Chromatic Gradient Rings) */}
      {stories.map((story, index) => (
        <button
          key={story.id}
          onClick={() => onOpenStory(story, index)}
          className="flex flex-col items-center shrink-0 group focus:outline-none active:scale-95 transition-transform"
        >
          <div className="relative">
            {/* TikTok Chromatic Continuous Gradient Ring */}
            <div className="w-[66px] h-[66px] rounded-[22px] p-[2.5px] bg-gradient-to-tr from-[#FFB800] via-[#FF6B00] to-[#FFB800] group-hover:scale-105 transition-all shadow-md">
              <div className="w-full h-full rounded-[18px] bg-black p-[1.5px] overflow-hidden relative">
                <img
                  src={story.author.avatar}
                  alt={story.author.name}
                  className="w-full h-full rounded-[16px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-0.5 px-1.5 py-0.5 rounded-full bg-[#121826] border border-white/10 text-[8px] font-mono font-bold text-[#FFB800] shadow">
              {story.roleBadge.split(' ')[0]}
            </span>
          </div>
          <span className="text-[11px] text-neutral-300 font-medium mt-1.5 truncate max-w-[68px]">
            {story.author.username}
          </span>
        </button>
      ))}
    </div>
  );
};

