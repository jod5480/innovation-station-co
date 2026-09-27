import React, { useState } from "react";
import { X, Copy, Check, Share2, Plus, Users, Share } from "lucide-react";
import { Post, User } from "../../types";

interface ShareModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSendDirectMessage?: (recipientUser: User, post: Post) => void;
  onAddToStory?: (post: Post) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  isOpen,
  onClose,
  onSendDirectMessage,
  onAddToStory,
}) => {
  if (!isOpen || !post) return null;

  const [copied, setCopied] = useState(false);

  const shareUrl = `https://cinetribe.cinema/p/${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Removed DM handlers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm apple-glass-card border border-border text-foreground rounded-[32px] shadow-2xl overflow-hidden flex flex-col apple-modal-enter">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between apple-glass-subtle">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[var(--theme-color)]" />
            <h3 className="font-brand font-bold text-sm text-foreground">Share Post</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Copy Link Row */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-background/50 border border-border">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-neutral-300 px-1 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shadow-[var(--theme-color)]/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Add to Story */}
            <button
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-background/40 border border-white/5 hover:border-white/15 transition-all"
              onClick={() => {
                if (onAddToStory && post) {
                  onAddToStory(post);
                } else {
                  alert("Send to Glimpse (Coming Soon)");
                }
              }}
            >
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#000000] to-[var(--theme-color)] shadow-lg">
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center border border-black">
                  <Plus className="w-5 h-5 text-foreground" strokeWidth={3} />
                </div>
              </div>
              <span className="text-[10px] font-bold text-neutral-300">Add to Glimpse</span>
            </button>

            {/* Send to Followers */}
            <button
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-background/40 border border-white/5 hover:border-white/15 transition-all"
              onClick={() => alert("Send to Followers (Coming Soon)")}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--theme-color)] flex items-center justify-center shadow-lg shadow-[var(--theme-color)]/30">
                <Users className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-[10px] font-bold text-neutral-300">Followers</span>
            </button>

            {/* Share to Other Apps */}
            <button
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-background/40 border border-white/5 hover:border-white/15 transition-all"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: "Check out this post on Cinetribe",
                      url: shareUrl,
                    })
                    .catch(() => {});
                } else {
                  handleCopyLink();
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-black/15 flex items-center justify-center text-foreground shadow-lg">
                <Share className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-neutral-300">Other Apps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
