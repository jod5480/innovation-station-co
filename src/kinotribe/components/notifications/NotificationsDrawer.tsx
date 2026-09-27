import React, { useState } from "react";
import {
  X,
  Bell,
  Clapperboard,
  UserPlus,
  Heart,
  MessageCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { NotificationItem, User, Post } from "../../types";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onNotificationClick: (notif: NotificationItem) => void;
  onUserClick: (user: User) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onUserClick,
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<"all" | "casting" | "activity">("all");

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "casting") return n.type === "casting_match" || n.type === "application_status";
    if (filter === "activity")
      return n.type === "like" || n.type === "comment" || n.type === "new_follower";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md apple-glass-card border-l border-white/15 text-neutral-100 h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col backdrop-blur-3xl apple-drawer-enter">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between apple-glass-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--theme-color)]" />
              <h3 className="font-brand font-bold text-sm text-foreground">Notifications</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Segmented Control */}
        <div className="p-3 apple-glass-subtle border-b border-border shrink-0">
          <div className="flex w-full p-1 gap-1 apple-segmented-group text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 px-2 font-medium rounded-full transition-all text-center ${
                filter === "all" ? "apple-segmented-item-active" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter("casting")}
              className={`flex-1 py-1.5 px-2 font-medium rounded-full transition-all text-center ${
                filter === "casting"
                  ? "apple-segmented-item-active"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Casting Calls
            </button>
            <button
              onClick={() => setFilter("activity")}
              className={`flex-1 py-1.5 px-2 font-medium rounded-full transition-all text-center ${
                filter === "activity"
                  ? "apple-segmented-item-active"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Social
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Sparkles className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-xs">No notifications in this tab.</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const iconMap = {
                casting_match: <Clapperboard className="w-3.5 h-3.5 text-[var(--theme-color)]" />,
                new_follower: <UserPlus className="w-3.5 h-3.5 text-white" />,
                like: <Heart className="w-3.5 h-3.5 text-[var(--theme-color)] fill-[var(--theme-color)]" />,
                comment: <MessageCircle className="w-3.5 h-3.5 text-white" />,
                application_status: <CheckCircle2 className="w-3.5 h-3.5 text-white" />,
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => onNotificationClick(notif)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-start gap-3 ${
                    notif.read
                      ? "bg-background/40 border-white/5 hover:border-white/15"
                      : "bg-[var(--theme-color)]/10 border-[var(--theme-color)]/30 hover:border-[var(--theme-color)]/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={notif.actor.avatar}
                      alt={notif.actor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                      {iconMap[notif.type]}
                    </span>
                  </div>

                  <div className="flex-1 text-xs text-left">
                    <p className="text-neutral-300 leading-snug">
                      <strong className="font-semibold text-neutral-100 mr-1">
                        {notif.actor.name}
                      </strong>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                      {notif.timeAgo}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
