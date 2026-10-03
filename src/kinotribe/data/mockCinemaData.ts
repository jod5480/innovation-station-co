import {
  User,
  Post,
  StoryItem,
  NotificationItem,
  DirectMessageConversation,
  CinemaRole,
} from "../types";

export const ALL_ROLES: CinemaRole[] = [
  "Acting",
  "Directing",
  "Screenwriting",
  "Cinematography",
  "Film Editing",
  "Producing",
  "Sound Design / Mixing",
  "VFX / Animation",
  "Costume & Makeup",
  "Casting Direction",
  "Music Composition",
  "Production Design",
];

export const COUNTRIES_DATA = [
  { code: "US", name: "United States", flag: "🇺🇸", defaultLanguage: "English" },
  { code: "FR", name: "France", flag: "🇫🇷", defaultLanguage: "French" },
  { code: "IN", name: "India", flag: "🇮🇳", defaultLanguage: "Hindi" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", defaultLanguage: "English" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", defaultLanguage: "Korean" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", defaultLanguage: "English" },
  { code: "JP", name: "Japan", flag: "🇯🇵", defaultLanguage: "Japanese" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", defaultLanguage: "Spanish" },
  { code: "DE", name: "Germany", flag: "🇩🇪", defaultLanguage: "German" },
  { code: "CA", name: "Canada", flag: "🇨🇦", defaultLanguage: "English" },
  { code: "AU", name: "Australia", flag: "🇦🇺", defaultLanguage: "English" },
  { code: "IT", name: "Italy", flag: "🇮🇹", defaultLanguage: "Italian" },
  { code: "ES", name: "Spain", flag: "🇪🇸", defaultLanguage: "Spanish" },
];

export const LANGUAGES_LIST = [
  "English",
  "French",
  "Hindi",
  "Spanish",
  "Korean",
  "Japanese",
  "German",
  "Italian",
  "Yoruba",
  "Tamil",
  "Telugu",
  "Mandarin",
  "Portuguese",
  "Swedish",
];

// Current active demo user (e.g. Maya Chen - Indie Director & Screenwriter)
export const CURRENT_USER: User = {
  id: "usr_current",
  name: "Maya Chen",
  username: "mayachen_film",
  email: "maya@cinetribe.cinema",
  phone: "+1 (310) 555-0192",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  coverImage:
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
  bio: "Indie filmmaker & writer. Sundance Ignite Fellow 2025. Exploring diaspora memory through 16mm & neon cinema.",
  country: "United States",
  countryCode: "US",
  languages: ["English", "Mandarin"],
  roles: ["Directing", "Screenwriting"],
  experienceLevel: "Experienced",
  portfolioUrl: "https://mayachen.film",
  imdbUrl: "https://imdb.com/name/nm9821412",
  instagramUrl: "https://instagram.com/mayachen_director",
  showreelVideoUrl: "https://player.vimeo.com/video/76979871",
  followersCount: 1420,
  followingCount: 388,
  isVerified: true,
  joinedDate: "Joined January 2025",
};

export const MOCK_USERS: User[] = [];

export const MOCK_POSTS: Post[] = [];

export const MOCK_STORIES: StoryItem[] = [];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_welcome",
    type: "casting_match",
    actor: CURRENT_USER,
    message:
      "Welcome to Cinetribe! Explore projects, connect with filmmakers, or post your first casting call.",
    timeAgo: "Just now",
    read: false,
  },
];

export const MOCK_CONVERSATIONS: DirectMessageConversation[] = [];
