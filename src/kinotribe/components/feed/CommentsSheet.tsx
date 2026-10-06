import React, { useState } from "react";
import { X, Heart, Send, Sparkles } from "lucide-react";
import { Post, User, CommentItem } from "../../types";

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

  const [newCommentText, setNewCommentText] = useState("");
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
    setNewCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg apple-glass-card border border-border text-neutral-100 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[85vh] h-[650px] flex flex-col backdrop-blur-3xl apple-sheet-enter sm:apple-modal-enter">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between apple-glass-subtle shrink-0">
          <div>
            <h3 className="font-brand font-bold text-sm text-foreground">
              Comments ({post.commentsCount})
            </h3>
            <span className="text-[10px] text-muted-foreground block">
              {post.author.name} · {post.type === "casting" ? "Casting Call" : "Cinema Post"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Summary banner */}
        <div className="p-3 bg-black/60 border-b border-border flex items-start gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onUserClick(post.author)}
            className="shrink-0 focus:outline-none hover:opacity-80 transition-opacity"
            title={`View @${post.author.username}'s profile`}
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>
          <div className="text-xs text-neutral-300">
            <button
              type="button"
              onClick={() => onUserClick(post.author)}
              className="font-bold text-foreground mr-1.5 hover:text-white transition-colors focus:outline-none"
            >
              {post.author.username}
            </button>
            <span className="line-clamp-2">{post.content.text}</span>
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {post.comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Sparkles className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-xs font-medium">No comments yet.</p>
              <p className="text-[11px] text-neutral-500">
                Be the first to share your cinema thoughts!
              </p>
            </div>
          ) : (
            post.comments.map((comment) => {
              const isLiked = !!commentLikes[comment.id] || !!comment.isLiked;
              const likesCount = (comment.likes || 0) + (commentLikes[comment.id] ? 1 : 0);

              return (
                <div key={comment.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button onClick={() => onUserClick(comment.author)} className="shrink-0">
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
                          className="font-bold text-neutral-200 hover:text-[var(--theme-color)] mr-1.5"
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
                          className="hover:text-foreground"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCommentLike(comment.id)}
                    className="p-1 shrink-0 text-muted-foreground hover:text-[var(--theme-color)] transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isLiked ? "fill-[var(--theme-color)] text-[var(--theme-color)]" : ""}`}
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
          className="p-3 bg-black border-t border-border flex items-center gap-2 shrink-0"
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
            className="flex-1 px-3.5 py-2 apple-glass-input rounded-full text-xs text-foreground placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-3.5 py-2 rounded-full bg-[var(--theme-color)] hover:brightness-110 disabled:opacity-40 text-foreground font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-[var(--theme-color)]/20"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
