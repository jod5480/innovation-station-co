import React, { useState, useRef } from "react";
import {
  X,
  MapPin,
  Tag,
  ChevronDown,
  Clapperboard,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  Loader2,
  UserPlus,
  Users,
  Crop,
} from "lucide-react";
import { User, Post, CinemaRole, ProjectType } from "../../types";
import { ALL_ROLES, MOCK_USERS } from "../../data/mockCinemaData";
import { uploadMedia } from "../../lib/api";
import { ImageCropModal, AllowedPostAspect } from "./ImageCropModal";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPostCreated: (post: Post) => void;
  onPostUpdated?: (post: Post) => void;
  initialMode?: "regular" | "casting";
  initialPost?: Post;
  availableUsers?: User[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  onPostUpdated,
  initialMode = "regular",
  initialPost,
  availableUsers,
}) => {
  if (!isOpen) return null;

  // Core post state
  const [caption, setCaption] = useState(initialPost?.content.text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extras
  const [location, setLocation] = useState(initialPost?.content.location || "");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Tagging People (with ID or Username)
  const [taggedUsers, setTaggedUsers] = useState<string[]>(initialPost?.taggedUsers || []);
  const [userInput, setUserInput] = useState("");
  const [showUserInput, setShowUserInput] = useState(false);

  const userPool = availableUsers && availableUsers.length > 0 ? availableUsers : MOCK_USERS;

  const handleAddTaggedUser = (userTag: string) => {
    const clean = userTag.trim().replace(/^@/, "");
    if (clean && !taggedUsers.includes(clean)) {
      setTaggedUsers([...taggedUsers, clean]);
      setUserInput("");
    }
  };

  const handleRemoveTaggedUser = (tagToRemove: string) => {
    setTaggedUsers(taggedUsers.filter((u) => u !== tagToRemove));
  };

  const handleUserKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (userInput.trim()) {
        handleAddTaggedUser(userInput.trim());
      }
    }
  };

  const filteredSuggestions = userInput.trim()
    ? userPool
        .filter(
          (u) =>
            u.id !== currentUser.id &&
            !taggedUsers.includes(u.username) &&
            !taggedUsers.includes(u.id),
        )
        .filter((u) => {
          const q = userInput.trim().replace(/^@/, "").toLowerCase();
          return (
            u.username.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  // Media Attachment (Strictly 1080x1440 & 1920x1080)
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialPost?.content.mediaUrl || null);
  const [aspectMode, setAspectMode] = useState<AllowedPostAspect>(
    initialPost?.content.aspect === "16:9" ? "16:9" : "3:4",
  );
  const [imageAspect, setImageAspect] = useState<number | null>(
    initialPost?.content.aspectRatio || (initialPost?.content.aspect === "16:9" ? 16 / 9 : 3 / 4),
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop & Adjust modal state
  const [cropSourceImage, setCropSourceImage] = useState<File | string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strictly enforce image files only - no videos on posts
    if (!file.type.startsWith("image/")) {
      setUploadError(
        "Only photos & images can be added to posts. Videos can be shared via Glimpse.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadError(null);
    setCropSourceImage(file);
    setIsCropModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (
    croppedFile: File,
    aspect: AllowedPostAspect,
    aspectRatioNum: number,
    _resolutionLabel?: string,
  ) => {
    setIsCropModalOpen(false);
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const url = await uploadMedia(croppedFile);
      setMediaUrl(url);
      setAspectMode(aspect);
      setImageAspect(aspectRatioNum);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError("Could not upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Optional Casting details extension
  const [isCastingMode, setIsCastingMode] = useState(
    initialPost ? initialPost.type === "casting" : initialMode === "casting",
  );
  const [projectTitle, setProjectTitle] = useState(
    initialPost?.content.title || initialPost?.castingDetails?.projectTitle || "",
  );
  const [projectType, setProjectType] = useState<ProjectType>(
    initialPost?.castingDetails?.projectType || "Short Film",
  );
  const [rolesNeeded, setRolesNeeded] = useState<CinemaRole[]>(
    initialPost?.castingDetails?.rolesNeeded || [currentUser.roles[0] || "Acting"],
  );
  const [compType, setCompType] = useState<"Paid" | "Unpaid" | "Negotiable">(
    initialPost?.castingDetails?.compensationType || "Paid",
  );
  const [compAmount, setCompAmount] = useState(
    initialPost?.castingDetails?.compensationAmount || "$500 / day",
  );
  const [deadline, setDeadline] = useState(initialPost?.castingDetails?.deadline || "2026-11-15");
  const [auditionNote, setAuditionNote] = useState(
    initialPost?.castingDetails?.requirementsNote || "",
  );
  const [languageReq, setLanguageReq] = useState(
    initialPost?.castingDetails?.languageRequirement || "",
  );

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const canSubmit =
    !isUploadingImage &&
    (caption.trim().length > 0 || (isCastingMode && projectTitle.trim().length > 0) || !!mediaUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    // Only include tags explicitly entered by the user
    const postTags = tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    const manualTagged = taggedUsers.map((u) => u.trim().replace(/^@/, "")).filter(Boolean);
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const captionMentions = Array.from(caption.matchAll(mentionRegex), (m) => m[1]);
    const cleanTaggedUsers = Array.from(new Set([...manualTagged, ...captionMentions]));

    const newPost: Post = {
      id: initialPost ? initialPost.id : `post_${Date.now()}`,
      authorId: currentUser.id,
      author: currentUser,
      createdAt: initialPost ? initialPost.createdAt : "Just now",
      type: isCastingMode ? "casting" : mediaUrl ? "photo" : "text",
      country: currentUser.country,
      countryCode: currentUser.countryCode,
      language: currentUser.languages[0] || "English",
      content: {
        text:
          caption.trim() ||
          (isCastingMode ? `Casting call for ${projectTitle || "our upcoming film"}.` : undefined),
        title: projectTitle.trim() || undefined,
        location: location.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? "image" : undefined,
        aspect: mediaUrl ? aspectMode : "auto",
        aspectRatio: mediaUrl ? (aspectMode === "16:9" ? 16 / 9 : 3 / 4) : undefined,
      },
      castingDetails: isCastingMode
        ? {
            projectTitle: projectTitle || "Untitled Production",
            projectType,
            rolesNeeded,
            location: location.trim() || undefined,
            country: currentUser.country,
            countryCode: currentUser.countryCode,
            languageRequirement: languageReq.trim() || "",
            compensationType: compType,
            compensationAmount: compAmount,
            deadline,
            requirementsNote: auditionNote || "Submit showreel or audition tape.",
            applicationCount: 0,
            howToApply: "in_app",
          }
        : undefined,
      likes: initialPost ? initialPost.likes : 0,
      isLiked: initialPost ? initialPost.isLiked : false,
      commentsCount: initialPost ? initialPost.commentsCount : 0,
      comments: initialPost ? initialPost.comments : [],
      isSaved: initialPost ? initialPost.isSaved : false,
      tags: postTags,
      taggedUsers: cleanTaggedUsers.length > 0 ? cleanTaggedUsers : undefined,
    };

    if (initialPost && onPostUpdated) {
      onPostUpdated(newPost);
    } else {
      onPostCreated(newPost);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[500px] bg-[#1c1c1e] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-[#1c1c1e] z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-brand font-bold text-sm text-foreground">
              {isCastingMode ? "Post Casting Call" : "New Cinema Post"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground disabled:opacity-40 disabled:hover:bg-[var(--theme-color)] transition-all active:scale-95 shadow-sm"
          >
            {isSubmitting ? "Sharing..." : "Share"}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {/* Post Mode Selector */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCastingMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !isCastingMode
                  ? "bg-black/15 text-foreground shadow-sm border border-border"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussion Post</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCastingMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isCastingMode
                  ? "bg-[var(--theme-color)] text-foreground shadow-sm shadow-[var(--theme-color)]/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-white/5"
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Casting Call</span>
            </button>
          </div>

          {/* User Info Bar */}
          <div className="px-4 pt-2.5 pb-1 flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate leading-tight">
                @{currentUser.username} · {currentUser.roles[0] || "Filmmaker"}
              </span>
            </div>
          </div>

          {/* Headline / Topic Input */}
          <div className="px-4 pt-3 pb-1">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder={
                isCastingMode
                  ? "Project Title (e.g. Echoes of Tomorrow)"
                  : "Headline or Topic (Optional)"
              }
              className="w-full bg-transparent border-b border-border pb-2 text-sm font-semibold text-foreground placeholder-neutral-500 focus:outline-none focus:border-[var(--theme-color)]"
            />
          </div>

          {/* Caption / Discussion Text Area */}
          <div className="px-4 pt-2 pb-2">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                isCastingMode
                  ? "Describe the production, story logline, or character overview..."
                  : "Write your cinema note, filmmaking discussion, or update..."
              }
              rows={4}
              className="w-full bg-transparent border-0 resize-none text-sm text-foreground placeholder-neutral-500 focus:outline-none focus:ring-0 leading-relaxed"
            />
          </div>

          {/* Photo Preview (1080x1440 or 1920x1080 with Adjust & Crop action) */}
          {mediaUrl && (
            <div
              className={`mx-4 mb-3 relative rounded-xl overflow-hidden border border-border bg-background flex items-center justify-center group ${
                aspectMode === "16:9" ? "aspect-video" : "aspect-[3/4] max-h-[420px]"
              }`}
            >
              <img
                src={mediaUrl}
                alt="Post attachment"
                className="w-full h-full object-cover block mx-auto rounded-lg"
              />

              {/* Action buttons (Top Right) */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setCropSourceImage(cropSourceImage || mediaUrl);
                    setIsCropModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-background/75 hover:bg-background text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-90 shadow-lg border border-white/15 backdrop-blur-md"
                  title="Adjust framing & aspect ratio"
                >
                  <Crop className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                  <span>Adjust & Crop</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setCropSourceImage(null);
                    setImageAspect(null);
                  }}
                  className="p-1.5 rounded-full bg-background/75 hover:bg-background text-foreground/90 hover:text-foreground transition-all active:scale-90 shadow-lg border border-border"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* Uploading Spinner */}
          {isUploadingImage && (
            <div className="mx-4 mb-3 h-32 rounded-xl border border-dashed border-[var(--theme-color)]/40 bg-[var(--theme-color)]/5 flex flex-col items-center justify-center gap-2 text-neutral-300">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-color)]" />
              <span className="text-xs font-medium">Attaching photo...</span>
            </div>
          )}

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Casting Call Fields (when in casting mode) */}
          {isCastingMode && (
            <div className="mx-4 mb-3 space-y-3.5 p-3.5 bg-muted/50 rounded-xl border border-border text-xs text-foreground">
              <div className="flex items-center gap-2 text-[var(--theme-color)] font-semibold text-[11px] uppercase tracking-wider pb-1 border-b border-border">
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Production & Audition Details</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    Production Format
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  >
                    <option value="Short Film">Short Film</option>
                    <option value="Feature Film">Feature Film</option>
                    <option value="Web Series">Web Series</option>
                    <option value="Commercial / Ad">Commercial / Ad</option>
                    <option value="Theatre / Stage">Theatre / Stage</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Role Needed</label>
                  <select
                    value={rolesNeeded[0] || "Acting"}
                    onChange={(e) => setRolesNeeded([e.target.value as CinemaRole])}
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Compensation</label>
                  <select
                    value={compType}
                    onChange={(e) =>
                      setCompType(e.target.value as "Paid" | "Unpaid" | "Negotiable")
                    }
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid / Collaboration</option>
                    <option value="Negotiable">Negotiable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    Pay Rate / Notes
                  </label>
                  <input
                    type="text"
                    value={compAmount}
                    onChange={(e) => setCompAmount(e.target.value)}
                    placeholder="e.g. $500 / day"
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    Audition Requirements
                  </label>
                  <input
                    type="text"
                    value={auditionNote}
                    onChange={(e) => setAuditionNote(e.target.value)}
                    placeholder="e.g. 1-min self-tape reel"
                    className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">
                  Language Requirement (Optional)
                </label>
                <input
                  type="text"
                  value={languageReq}
                  onChange={(e) => setLanguageReq(e.target.value)}
                  placeholder="e.g. English, Hindi, Tamil..."
                  className="w-full bg-[#262626] border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-[var(--theme-color)]"
                />
              </div>
            </div>
          )}

          {/* Additional Options List */}
          <div className="border-t border-border divide-y divide-white/5">
            {/* Photo Attachment (Strictly Image Only) */}
            <div className="px-4 py-3 text-xs text-foreground">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full flex items-center justify-between text-neutral-300 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                  <span>{mediaUrl ? "Photo Attached" : "Add Photo"}</span>
                </span>
                <span className="text-[11px] text-[var(--theme-color)] font-medium">
                  {mediaUrl ? "Change" : "+ Add Photo"}
                </span>
              </button>
            </div>

            {/* Tag People (with ID / Username) */}
            <div className="px-4 py-3 text-xs text-foreground">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserInput(!showUserInput)}
                  className="w-full flex items-center justify-between text-neutral-300 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                    <span>Tag People (with ID / @username)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {taggedUsers.length > 0 && (
                      <span className="text-[11px] text-[var(--theme-color)] font-medium">
                        {taggedUsers.length} tagged
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showUserInput ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {showUserInput && (
                  <div className="pt-1 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-[var(--theme-color)] font-bold text-xs">
                        @
                      </div>
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleUserKeyDown}
                        placeholder="Type @username, user ID, or name and press Enter..."
                        className="w-full bg-[#262626] border border-border rounded-lg pl-7 pr-16 py-2 focus:outline-none focus:border-[var(--theme-color)] text-foreground text-xs placeholder-neutral-500"
                        autoFocus
                      />
                      {userInput.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAddTaggedUser(userInput.trim())}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground text-[11px] font-semibold transition-colors"
                        >
                          Tag
                        </button>
                      )}
                    </div>

                    {/* Suggestions list */}
                    {filteredSuggestions.length > 0 && (
                      <div className="rounded-xl bg-[#262626] border border-border overflow-hidden divide-y divide-white/5 shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                        {filteredSuggestions.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleAddTaggedUser(u.username)}
                            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-foreground block truncate leading-tight group-hover:text-[var(--theme-color)]">
                                  {u.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground block truncate leading-tight">
                                  @{u.username} · ID: {u.id}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-[var(--theme-color)] font-medium shrink-0 ml-2">
                              + Tag
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tagged pills */}
                    {taggedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {taggedUsers.map((tag) => {
                          const matched = userPool.find(
                            (u) =>
                              u.username.toLowerCase() === tag.toLowerCase() ||
                              u.id.toLowerCase() === tag.toLowerCase(),
                          );
                          return (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-full bg-muted border border-white/15 text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm"
                            >
                              {matched?.avatar && (
                                <img
                                  src={matched.avatar}
                                  alt=""
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                              )}
                              <span className="text-[var(--theme-color)]">@</span>
                              <span>{matched ? matched.username : tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTaggedUser(tag)}
                                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                                title="Remove tag"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location (Optional) */}
            <div className="px-4 py-3 text-xs text-foreground">
              {showLocationInput ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location (e.g. London, Los Angeles)..."
                    className="flex-1 bg-transparent focus:outline-none text-foreground text-xs"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowLocationInput(false)}>
                    <X className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLocationInput(true)}
                  className="w-full flex items-center justify-between text-neutral-300 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{location || "Add Location (Optional)"}</span>
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {location ? "Change" : "+ Add"}
                  </span>
                </button>
              )}
            </div>

            {/* Tags (Optional) */}
            <div className="px-4 py-3 text-xs text-foreground">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="w-full flex items-center justify-between text-neutral-300 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tag Topics (Optional)</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showTagInput ? "rotate-180" : ""}`}
                  />
                </button>

                {showTagInput && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type a tag and press Enter"
                      className="w-full bg-[#262626] border border-border rounded-lg px-2.5 py-1.5 focus:outline-none text-foreground text-xs"
                    />
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full bg-[var(--theme-color)]/15 border border-[var(--theme-color)]/30 text-[var(--theme-color)] text-[11px] font-medium flex items-center gap-1"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-foreground"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Picker: Strictly accept="image/*", no videos allowed on posts */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Interactive Crop & Adjust Modal */}
      {isCropModalOpen && cropSourceImage && (
        <ImageCropModal
          imageFile={cropSourceImage}
          isOpen={isCropModalOpen}
          initialAspect={aspectMode}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
