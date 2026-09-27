import React from "react";
import { ChevronLeft } from "lucide-react";
import { Post, User } from "../../types";
import { PostCard } from "./PostCard";

interface PostDetailModalProps {
  post: Post | null;
  currentUser: User;
  allUsers?: User[];
  isOpen: boolean;
  onClose: () => void;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  isFollowing: boolean;
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onOpenApply: (post: Post) => void;
  onUserClick: (user: User) => void;
  onAddComment: (postId: string, text: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  allUsers,
  isOpen,
  onClose,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  isFollowing,
  onOpenComments,
  onOpenShare,
  onOpenApply,
  onUserClick,
  onAddComment,
  onDelete,
  onEdit,
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center h-[56px] px-3">
          <button
            onClick={onClose}
            className="p-2 -ml-1 text-foreground hover:text-neutral-300 active:scale-90 transition-transform flex items-center gap-1 focus:outline-none"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-foreground font-bold text-base flex-1 text-center pr-8">Post</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 pt-1 sm:pt-3">
        <div className="w-full max-w-xl mx-auto px-0 sm:px-2">
          <PostCard
            post={post}
            currentUser={currentUser}
            allUsers={allUsers}
            onLikeToggle={onLikeToggle}
            onSaveToggle={onSaveToggle}
            onFollowToggle={onFollowToggle}
            isFollowing={isFollowing}
            onOpenComments={onOpenComments}
            onOpenShare={onOpenShare}
            onOpenApply={onOpenApply}
            onUserClick={onUserClick}
            onAddComment={onAddComment}
            onDelete={(postId) => {
              if (onDelete) onDelete(postId);
              onClose();
            }}
            onEdit={(post) => {
              if (onEdit) onEdit(post);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
