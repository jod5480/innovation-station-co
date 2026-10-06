import React from "react";
import { Plus } from "lucide-react";
import { StoryItem, User } from "../../types";
import { hapticMedium } from "../../utils/haptics";

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
  // The current user's own stories
  const myStories = stories.filter((s) => s.author.id === currentUser.id);
  const myLatestStory = myStories[0] ?? null;
  const hasMyStory = myStories.length > 0;

  // Other users' stories — one bubble per user, most recent first
  const otherStories = stories
    .filter((s) => s.author.id !== currentUser.id)
    .reduce<StoryItem[]>((acc, story) => {
      const alreadyExists = acc.some((s) => s.author.id === story.author.id);
      if (!alreadyExists) acc.push(story);
      return acc;
    }, []);

  return (
    <div className="w-full overflow-x-auto no-scrollbar pt-1.5 pb-2.5 px-3 flex items-center gap-3.5 border-b border-white/[0.08] mb-3 select-none">
      {/* Current User: "Your Cut" — shows ring if they have a story */}
      <div className="flex flex-col items-center shrink-0 cursor-pointer group spring-scale">
        <div className="relative">
          {hasMyStory ? (
            /* Has story: show gradient ring, click to view */
            <button
              onClick={() => {
                hapticMedium();
                const storyIdx = stories.findIndex((s) => s.id === myLatestStory!.id);
                onOpenStory(myLatestStory!, storyIdx >= 0 ? storyIdx : 0);
              }}
              className="block w-[64px] h-[64px] rounded-[22px] p-[2.5px] bg-gradient-to-tr from-[#000000] to-[var(--theme-color)] shadow-md"
            >
              <div className="w-full h-full rounded-[18px] bg-[#0E1118] p-[1.5px] overflow-hidden">
                <img
                  src={currentUser.avatar}
                  alt="Your Glimpse"
                  className="w-full h-full rounded-[16px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </button>
          ) : (
            /* No story: dashed border, click to add */
            <button
              onClick={() => {
                hapticMedium();
                onOpenCreateStory?.();
              }}
              className="block w-[64px] h-[64px] rounded-[22px] p-[2px] apple-glass-subtle border border-dashed border-[var(--theme-color)]/70 group-hover:border-[var(--theme-color)] transition-all overflow-hidden"
            >
              <img
                src={currentUser.avatar}
                alt="My Glimpse"
                className="w-full h-full rounded-[18px] object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </button>
          )}

          {/* Plus button always visible to add new story */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticMedium();
              onOpenCreateStory?.();
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--theme-color)] text-foreground flex items-center justify-center border-2 border-black font-bold shadow-md hover:scale-110 active:scale-90 transition-transform z-10"
            title="Add your Glimpse"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
        <span className="text-[11px] text-neutral-300 font-medium mt-1 truncate max-w-[64px] text-center">
          Your Glimpse
        </span>
      </div>

      {/* Other users' stories — one bubble per user */}
      {otherStories.map((story, index) => (
        <button
          key={story.author.id}
          onClick={() => {
            hapticMedium();
            const storyIdx = stories.findIndex((s) => s.id === story.id);
            onOpenStory(story, storyIdx >= 0 ? storyIdx : 0);
          }}
          className="flex flex-col items-center shrink-0 group focus:outline-none spring-scale"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="relative">
            <div className="w-[64px] h-[64px] rounded-[22px] p-[2.5px] bg-gradient-to-tr from-[#000000] to-[var(--theme-color)] group-hover:from-[var(--theme-color)] group-hover:to-[#000000] transition-all duration-500 shadow-md">
              <div className="w-full h-full rounded-[18px] bg-[#0E1118] p-[1.5px] overflow-hidden relative">
                <img
                  src={story.author.avatar}
                  alt={story.author.name}
                  className="w-full h-full rounded-[16px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-0.5 px-1.5 py-0.2 rounded-full apple-glass-subtle border border-border text-[8px] font-mono font-bold text-white shadow-sm">
              {story.roleBadge.split(" ")[0]}
            </span>
          </div>
          <span className="text-[11px] text-neutral-300 font-medium mt-1 truncate max-w-[64px] text-center group-hover:text-foreground transition-colors">
            {story.author.username}
          </span>
        </button>
      ))}
    </div>
  );
};
