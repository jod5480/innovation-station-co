import React, { useState } from "react";
import {
  ChevronLeft,
  Activity,
  Bell,
  Store,
  BarChart2,
  CreditCard,
  Lock,
  Star,
  Ban,
  EyeOff,
  MessageSquare,
  AtSign,
  LogOut,
  MapPin,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

export interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenRegionFilter: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenRegionFilter,
}) => {
  const [activeSubMenu, setActiveSubMenu] = useState<{ id: string; title: string } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (activeSubMenu) {
      setActiveSubMenu(null);
    } else {
      onClose();
    }
  };

  const SectionTitle = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
    <h3 className="text-muted-foreground font-brand text-[12px] font-bold px-5 pt-6 pb-2 select-none uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
      {title}
    </h3>
  );

  const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-4 mb-2 bg-black/[0.03] border border-border rounded-[20px] overflow-hidden divide-y divide-white/[0.05] shadow-lg shadow-black/20">
      {children}
    </div>
  );

  const SettingsRow = ({
    icon: Icon,
    label,
    onClick,
    isDestructive = false,
    hasArrow = true,
    description,
  }: {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    isDestructive?: boolean;
    hasArrow?: boolean;
    description?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 bg-transparent hover:bg-black/[0.04] active:bg-black/[0.08] transition-all text-left group"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            isDestructive
              ? "bg-[#FF453A]/10 border-[#FF453A]/20 text-[#FF453A] group-hover:bg-[#FF453A]/20"
              : "bg-black/[0.06] border-border text-foreground group-hover:bg-black/[0.12] group-hover:border-border group-hover:text-white"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span
            className={`text-[15px] font-bold ${isDestructive ? "text-[#FF453A]" : "text-foreground"}`}
          >
            {label}
          </span>
          {description && (
            <span className="text-[12px] text-muted-foreground font-medium mt-0.5 leading-tight">
              {description}
            </span>
          )}
        </div>
      </div>
      {hasArrow && (
        <div className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:bg-muted transition-colors">
          <ChevronRight
            className="w-4 h-4 text-muted-foreground group-hover:text-foreground"
            strokeWidth={2}
          />
        </div>
      )}
    </button>
  );

  const renderSubMenuContent = () => {
    switch (activeSubMenu?.id) {
      case "activity":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            View your time spent on sets, links you've visited, and recently deleted cinema posts.
          </div>
        );
      case "notifications":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Manage push notifications for likes, casting call matches, and direct messages.
          </div>
        );
      case "professional":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Upgrade to a verified filmmaker or agency account to unlock advanced casting tools.
          </div>
        );
      case "creator":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            View analytics for your showreels, posts, and profile visits.
          </div>
        );
      case "ads":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Manage payment methods for promoted casting calls.
          </div>
        );
      case "privacy":
        return (
          <div className="p-4">
            <SettingsGroup>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-foreground font-bold text-[15px]">Private Account</span>
                  <p className="text-xs text-muted-foreground font-medium mt-1 pr-6 leading-relaxed">
                    When your account is private, only people you approve can see your photos,
                    showreels, and videos on Cinetribe.
                  </p>
                </div>
                <div className="w-12 h-6 bg-[var(--theme-color)] rounded-full relative shrink-0 shadow-[0_0_10px_var(--theme-color)] cursor-pointer opacity-90">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </div>
              </div>
            </SettingsGroup>
          </div>
        );
      case "close_friends":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Add crew members and trusted collaborators to your inner circle list.
          </div>
        );
      case "blocked":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            You haven't blocked anyone yet.
          </div>
        );
      case "story_live":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Hide your behind-the-scenes stories from specific people.
          </div>
        );
      case "messages":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Control who can message you or reply to your casting calls.
          </div>
        );
      case "tags":
        return (
          <div className="p-6 text-neutral-300 text-sm leading-relaxed text-center font-medium">
            Choose who can tag you in production photos, credits, or crew lists.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col apple-page-enter">
      {/* Cinematic Glass Header */}
      <header className="sticky top-0 z-20 apple-glass-subtle backdrop-blur-2xl px-2 py-3.5 flex items-center border-b border-border shadow-md">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-foreground active:scale-90 transition-transform ml-1"
        >
          <div className="w-8 h-8 rounded-full bg-black/[0.08] border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </button>
        <h1 className="flex-1 text-center font-brand text-foreground font-bold text-lg mr-11 tracking-tight drop-shadow-sm">
          {activeSubMenu ? activeSubMenu.title : "Settings"}
        </h1>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-24 no-scrollbar bg-gradient-to-b from-transparent to-black/20">
        {activeSubMenu ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {renderSubMenuContent()}
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 space-y-2 pt-2">
            <SectionTitle title="Your activity" icon={Activity} />
            <SettingsGroup>
              <SettingsRow
                icon={Activity}
                label="Your activity"
                description="Time spent, visited links, recently deleted"
                onClick={() => setActiveSubMenu({ id: "activity", title: "Your activity" })}
              />
              <SettingsRow
                icon={Bell}
                label="Notifications"
                description="Push notifications, emails, SMS"
                onClick={() => setActiveSubMenu({ id: "notifications", title: "Notifications" })}
              />
            </SettingsGroup>

            <SectionTitle title="Cinema insights & tools" icon={Sparkles} />
            <SettingsGroup>
              <SettingsRow
                icon={Store}
                label="Professional account"
                description="Upgrade to filmmaker or agency tools"
                onClick={() =>
                  setActiveSubMenu({ id: "professional", title: "Professional account" })
                }
              />
              <SettingsRow
                icon={BarChart2}
                label="Creator tools and controls"
                description="Analytics, branded content, monetization"
                onClick={() =>
                  setActiveSubMenu({ id: "creator", title: "Creator tools and controls" })
                }
              />
              <SettingsRow
                icon={CreditCard}
                label="Ads payments"
                onClick={() => setActiveSubMenu({ id: "ads", title: "Ads payments" })}
              />
              <SettingsRow
                icon={MapPin}
                label="Region & Language"
                description="Filter feed by location and spoken language"
                onClick={onOpenRegionFilter}
                hasArrow={false}
              />
            </SettingsGroup>

            <SectionTitle title="Who can see your content" icon={ShieldAlert} />
            <SettingsGroup>
              <SettingsRow
                icon={Lock}
                label="Account privacy"
                description="Public or Private mode"
                onClick={() => setActiveSubMenu({ id: "privacy", title: "Account privacy" })}
              />
              <SettingsRow
                icon={Star}
                label="Close Collaborators"
                description="Inner circle for stories and posts"
                onClick={() =>
                  setActiveSubMenu({ id: "close_friends", title: "Close Collaborators" })
                }
              />
              <SettingsRow
                icon={Ban}
                label="Blocked"
                onClick={() => setActiveSubMenu({ id: "blocked", title: "Blocked" })}
              />
              <SettingsRow
                icon={EyeOff}
                label="Glimpse, live and location"
                onClick={() =>
                  setActiveSubMenu({ id: "story_live", title: "Glimpse, live and location" })
                }
              />
            </SettingsGroup>

            <SectionTitle title="Interactions" icon={SlidersHorizontal} />
            <SettingsGroup>
              <SettingsRow
                icon={MessageSquare}
                label="Messages and story replies"
                onClick={() =>
                  setActiveSubMenu({ id: "messages", title: "Messages and story replies" })
                }
              />
              <SettingsRow
                icon={AtSign}
                label="Tags and mentions"
                onClick={() => setActiveSubMenu({ id: "tags", title: "Tags and mentions" })}
              />
            </SettingsGroup>

            <div className="mt-8 mb-4">
              <SettingsGroup>
                <SettingsRow
                  icon={LogOut}
                  label="Log out"
                  onClick={onLogout}
                  isDestructive={true}
                  hasArrow={false}
                />
              </SettingsGroup>
            </div>

            <div className="text-center pb-8 pt-4">
              <span className="font-brand font-black text-xl text-foreground/10 select-none">
                CINETRIBE
              </span>
              <p className="text-[10px] text-neutral-500 font-medium mt-1">
                Version 1.0.0 (Cinema)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
