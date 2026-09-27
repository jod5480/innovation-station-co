import React, { useState } from 'react';
import { X, Heart, Send, Sparkles } from 'lucide-react';
import { Post, User, CommentItem } from '../../types';

interface CommentsSheetProps {
  post: Post | null;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onUserClick: (user: User) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  post,
  currentUser,
  isOpen,
  onClose,
  onAddComment,
  onUserClick,
}) => {
  if (!isOpen || !post) return null;

  const [newCommentText, setNewCommentText] = useState('');
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: boolean }>({});

  const handleToggleCommentLike = (commentId: string) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(post.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121826] border border-white/10 text-neutral-100 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] h-[650px] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/80 shrink-0">
          <div className="text-center flex-1">
            <h3 className="font-brand font-bold text-sm tracking-wide">
              Comments ({post.commentsCount})
            </h3>
            <span className="text-[10px] text-[#94A3B8]">
              {post.author.name} · {post.type === 'casting' ? 'Casting Call' : 'Cinema Post'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Summary banner */}
        <div className="p-3 bg-[#0A0E17]/60 border-b border-white/10 flex items-start gap-2.5 shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="text-xs text-neutral-300">
            <span className="font-bold text-white mr-1.5">
              {post.author.username}
            </span>
            <span className="line-clamp-2">{post.content.text}</span>
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {post.comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Sparkles className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-xs font-medium">No comments yet.</p>
              <p className="text-[11px] text-neutral-500">Be the first to share your cinema thoughts!</p>
            </div>
          ) : (
            post.comments.map((comment) => {
              const isLiked = !!commentLikes[comment.id] || !!comment.isLiked;
              const likesCount = (comment.likes || 0) + (commentLikes[comment.id] ? 1 : 0);

              return (
                <div key={comment.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={() => onUserClick(comment.author)}
                      className="shrink-0"
                    >
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>
                    <div className="min-w-0 text-left">
                      <div className="text-xs">
                        <button
                          onClick={() => onUserClick(comment.author)}
                          className="font-bold text-neutral-200 hover:text-[#FF6B00] mr-1.5"
                        >
                          {comment.author.username}
                        </button>
                        <span className="text-neutral-300">{comment.text}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                        <span>{comment.createdAt}</span>
                        {likesCount > 0 && <span>{likesCount} likes</span>}
                        <button
                          onClick={() => setNewCommentText(`@${comment.author.username} `)}
                          className="hover:text-white"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCommentLike(comment.id)}
                    className="p-1 shrink-0 text-neutral-400 hover:text-[#FF6B00] transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? 'fill-[#FF6B00] text-[#FF6B00]' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-[#0A0E17] border-t border-white/10 flex items-center gap-2 shrink-0"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={`Comment as @${currentUser.username}...`}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-neutral-100 placeholder-[#94A3B8] focus:outline-none focus:border-[#FF6B00]"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-3 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05300] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm shadow-[#FF6B00]/20"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
