import React, { useState } from 'react';
import { X, Bell, Clapperboard, UserPlus, Heart, MessageCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { NotificationItem, User, Post } from '../../types';

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

  const [filter, setFilter] = useState<'all' | 'casting' | 'activity'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'casting') return n.type === 'casting_match' || n.type === 'application_status';
    if (filter === 'activity') return n.type === 'like' || n.type === 'comment' || n.type === 'new_follower';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#121826] border-l border-white/10 text-neutral-100 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/80 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-brand font-bold text-base">Cinema Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Segmented Control */}
        <div className="p-3 bg-[#0A0E17] border-b border-white/10 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#121826] rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`py-1.5 font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-[#FF6B00] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('casting')}
              className={`py-1.5 font-medium rounded-lg transition-colors ${
                filter === 'casting'
                  ? 'bg-[#FF6B00] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Casting Calls
            </button>
            <button
              onClick={() => setFilter('activity')}
              className={`py-1.5 font-medium rounded-lg transition-colors ${
                filter === 'activity'
                  ? 'bg-[#FF6B00] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
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
                casting_match: <Clapperboard className="w-3.5 h-3.5 text-[#FF6B00]" />,
                new_follower: <UserPlus className="w-3.5 h-3.5 text-[#FFB800]" />,
                like: <Heart className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]" />,
                comment: <MessageCircle className="w-3.5 h-3.5 text-[#FFB800]" />,
                application_status: <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800]" />,
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => onNotificationClick(notif)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-start gap-3 ${
                    notif.read
                      ? 'bg-black/40 border-white/5 hover:border-white/15'
                      : 'bg-[#FF6B00]/10 border-[#FF6B00]/30 hover:border-[#FF6B00]/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={notif.actor.avatar}
                      alt={notif.actor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center">
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
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-1 block">
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
