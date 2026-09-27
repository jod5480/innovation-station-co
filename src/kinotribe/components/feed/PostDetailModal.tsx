import React from 'react';
import { X } from 'lucide-react';
import { Post, User } from '../../types';
import { PostCard } from './PostCard';

interface PostDetailModalProps {
  post: Post | null;
  currentUser: User;
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
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
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
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
        <PostCard
          post={post}
          currentUser={currentUser}
          onLikeToggle={onLikeToggle}
          onSaveToggle={onSaveToggle}
          onFollowToggle={onFollowToggle}
          isFollowing={isFollowing}
          onOpenComments={onOpenComments}
          onOpenShare={onOpenShare}
          onOpenApply={onOpenApply}
          onUserClick={onUserClick}
          onAddComment={onAddComment}
        />
      </div>
    </div>
  );
};
