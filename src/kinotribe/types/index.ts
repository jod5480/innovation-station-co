export type CinemaRole =
  | "Acting"
  | "Directing"
  | "Screenwriting"
  | "Cinematography"
  | "Film Editing"
  | "Producing"
  | "Sound Design / Mixing"
  | "VFX / Animation"
  | "Costume & Makeup"
  | "Casting Direction"
  | "Music Composition"
  | "Production Design";

export type ExperienceLevel = "Newcomer" | "Mid-level" | "Experienced";

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  country: string;
  countryCode: string; // e.g. 'US', 'FR', 'IN', 'GB', 'KR', 'NG', 'JP'
  city?: string;
  latitude?: number;
  longitude?: number;
  languages: string[];
  roles: CinemaRole[];
  experienceLevel: ExperienceLevel;
  portfolioUrl?: string;
  imdbUrl?: string;
  instagramUrl?: string;
  showreelVideoUrl?: string;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  joinedDate: string;
}

export type ProjectType =
  | "Feature Film"
  | "Short Film"
  | "Web Series"
  | "Commercial / Ad"
  | "Theatre / Stage"
  | "Documentary";

export interface CastingDetails {
  projectTitle: string;
  projectType: ProjectType;
  rolesNeeded: CinemaRole[];
  location?: string;
  country: string;
  countryCode: string;
  languageRequirement: string;
  compensationType: "Paid" | "Unpaid" | "Negotiable";
  compensationAmount?: string;
  deadline: string; // e.g. '2026-10-15'
  requirementsNote?: string;
  applicationCount: number;
  howToApply: "in_app" | "external_link";
  externalContact?: string;
}

export interface CommentItem {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  createdAt: string;
  type: "photo" | "video" | "text" | "casting";
  content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    aspect?: "1:1" | "16:9" | "4:5" | "2.39:1" | "2:3" | "3:4" | "auto";
    aspectRatio?: number;
    title?: string;
    cameraSpec?: string; // e.g. "Arri Alexa Mini LF · Cooke Anamorphic /i"
    isPoster?: boolean;
    location?: string;
  };
  castingDetails?: CastingDetails;
  country: string;
  countryCode: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  language: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  comments: CommentItem[];
  isSaved: boolean;
  isPortfolio?: boolean;
  portfolioRole?: string;
  tags: string[];
  taggedUsers?: string[];
}

export interface Application {
  id: string;
  postId: string;
  projectTitle: string;
  applicantId: string;
  applicant: User;
  selectedRole: CinemaRole;
  coverNote: string;
  portfolioUrl: string;
  status: "Submitted" | "Under Review" | "Shortlisted" | "Selected";
  submittedAt: string;
}

export interface StoryItem {
  id: string;
  author: User;
  mediaUrl: string;
  caption: string;
  roleBadge: CinemaRole;
  timestamp: string;
  createdAt?: string; // ISO string, used for 24h expiry
  viewed?: boolean;
  linkedPostId?: string;
}

export interface NotificationItem {
  id: string;
  type: "casting_match" | "new_follower" | "like" | "comment" | "application_status";
  actor: User;
  message: string;
  targetPostId?: string;
  timeAgo: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMe?: boolean;
}

export interface DirectMessageConversation {
  conversationId: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export type FeedFilterMode = "regional" | "global" | "custom";
