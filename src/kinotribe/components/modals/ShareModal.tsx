import React, { useState } from 'react';
import { X, Copy, Check, Send, Film, Share2 } from 'lucide-react';
import { Post, User } from '../../types';
import { MOCK_USERS } from '../../data/mockCinemaData';

interface ShareModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSendDirectMessage?: (recipientUser: User, post: Post) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  isOpen,
  onClose,
  onSendDirectMessage,
}) => {
  if (!isOpen || !post) return null;

  const [copied, setCopied] = useState(false);
  const [sentUsers, setSentUsers] = useState<{ [userId: string]: boolean }>({});

  const shareUrl = `https://kinotribe.cinema/p/${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDM = (user: User) => {
    setSentUsers((prev) => ({ ...prev, [user.id]: true }));
    if (onSendDirectMessage) {
      onSendDirectMessage(user, post);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#121826] border border-white/10 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/60">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-brand font-bold text-sm">Share Cinema Post</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Copy Link Row */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-white/10">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-neutral-300 px-1 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shadow-[#FF6B00]/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Send via Direct Message */}
          <div>
            <span className="text-[11px] font-mono text-[#94A3B8] block mb-2 tracking-wider">
              SEND DIRECT MESSAGE TO FILMMAKER
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {MOCK_USERS.slice(1, 6).map((user) => {
                const wasSent = sentUsers[user.id];
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/15"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-neutral-200 block truncate">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          @{user.username} · {user.roles[0]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendDM(user)}
                      disabled={wasSent}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        wasSent
                          ? 'bg-white/10 text-[#FFB800]'
                          : 'bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold shadow-sm shadow-[#FF6B00]/20'
                      }`}
                    >
                      {wasSent ? 'Sent ✓' : 'Send'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
