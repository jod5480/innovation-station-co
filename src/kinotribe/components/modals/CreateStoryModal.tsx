import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Type,
  Smile,
  MapPin,
  Check,
  ChevronRight,
  Loader2,
  Trash2,
  Download,
  ArrowLeft,
  VolumeX,
  CheckCircle2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { User, CinemaRole, Post } from "../../types";
import { ALL_ROLES } from "../../data/mockCinemaData";
import { uploadMedia } from "../../lib/api";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onStoryCreated: (
    mediaUrl: string,
    caption: string,
    roleBadge: string,
    linkedPostId?: string,
  ) => Promise<void>;
  embeddedPost?: Post | null;
}

export interface InstagramFilter {
  id: string;
  name: string;
  css: string;
  previewColor: string;
}

export const INSTAGRAM_FILTERS: InstagramFilter[] = [
  { id: "normal", name: "Normal", css: "none", previewColor: "#ffffff" },
  {
    id: "clarendon",
    name: "Clarendon",
    css: "contrast(1.2) saturate(1.25) brightness(1.05)",
    previewColor: "#3897f0",
  },
  {
    id: "gingham",
    name: "Gingham",
    css: "sepia(0.2) contrast(1.1) brightness(1.1) hue-rotate(-8deg)",
    previewColor: "#e0c4a4",
  },
  {
    id: "juno",
    name: "Juno",
    css: "saturate(1.4) contrast(1.15) sepia(0.08)",
    previewColor: "#ff7555",
  },
  {
    id: "lark",
    name: "Lark",
    css: "brightness(1.15) contrast(1.05) saturate(1.12)",
    previewColor: "#84d2f6",
  },
  {
    id: "moon",
    name: "Moon",
    css: "grayscale(1) contrast(1.3) brightness(1.1)",
    previewColor: "#8e8e93",
  },
  {
    id: "valencia",
    name: "Valencia",
    css: "sepia(0.28) contrast(1.08) brightness(1.08)",
    previewColor: "#ffb347",
  },
  {
    id: "reyes",
    name: "Reyes",
    css: "sepia(0.22) brightness(1.15) contrast(0.92) saturate(0.85)",
    previewColor: "#d6c8b2",
  },
  {
    id: "cyber",
    name: "Cyberpunk",
    css: "hue-rotate(170deg) saturate(1.6) contrast(1.25)",
    previewColor: "#ff007f",
  },
];

const TEXT_COLORS = ["#FFFFFF", "#000000", "#000000", "var(--theme-color)", "#00F0FF", "#FF2D55", "#4CD964"];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStoryCreated,
  embeddedPost,
}) => {
  // Removed early return to allow hooks to run properly and clean up the camera

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Mode: 'camera' (live camera viewfinder) | 'preview' (photo captured/uploaded)
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  // Active Media & Filter
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<InstagramFilter>(INSTAGRAM_FILTERS[0]);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  // Text Overlay ('Aa')
  const [isEditingText, setIsEditingText] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [textHighlight, setTextHighlight] = useState<"box" | "solid" | "transparent">("box");

  // Stickers / Badges
  const [showStickers, setShowStickers] = useState(false);
  const [activeSticker, setActiveSticker] = useState<string | null>(null);
  const [roleBadge, setRoleBadge] = useState<CinemaRole>(currentUser.roles?.[0] || "Directing");
  const [locationTag, setLocationTag] = useState(currentUser.country);
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Submission
  const [isPublishing, setIsPublishing] = useState(false);

  // Swipe to change filter
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartX - touchEndX; // positive means swipe left

      if (Math.abs(diffX) > 50) {
        const currentIndex = INSTAGRAM_FILTERS.findIndex((f) => f.id === selectedFilter.id);
        if (diffX > 0) {
          // Swipe left -> next filter
          const nextIndex = (currentIndex + 1) % INSTAGRAM_FILTERS.length;
          setSelectedFilter(INSTAGRAM_FILTERS[nextIndex]);
        } else {
          // Swipe right -> prev filter
          const prevIndex =
            (currentIndex - 1 + INSTAGRAM_FILTERS.length) % INSTAGRAM_FILTERS.length;
          setSelectedFilter(INSTAGRAM_FILTERS[prevIndex]);
        }
      }
      setTouchStartX(null);
    },
    [touchStartX, selectedFilter],
  );

  // Start live webcam / camera stream
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setIsCameraStarting(true);
    setCameraError(null);

    // Stop existing stream if any
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera is not supported on this browser or device.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Camera access issue:", err);
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. You can upload from your gallery below."
          : "Could not access camera. Please select a photo from your gallery.",
      );
    } finally {
      setIsCameraStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (embeddedPost) {
        setMode("preview");
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
          grad.addColorStop(0, "#000000");
          const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim() || "#DC143C";
          grad.addColorStop(1, themeColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1080, 1920);
          setCapturedImage(canvas.toDataURL("image/jpeg", 0.8));
        }
      } else {
        setMode("camera");
        setCapturedImage(null);
        setStoryText("");
        setIsEditingText(false);
        setActiveSticker(null);
      }
    } else {
      stopCamera();
    }
  }, [isOpen, embeddedPost, stopCamera]);

  // Handle camera stream based on mode
  useEffect(() => {
    if (isOpen && mode === "camera" && !embeddedPost) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode, startCamera, stopCamera, embeddedPost]);

  // Flip front / back camera
  const handleFlipCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
  };

  // Shutter button: snap photo from live camera feed
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply active filter directly into the photo capture
    if (selectedFilter.css !== "none") {
      ctx.filter = selectedFilter.css;
    }

    // Mirror horizontal if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    setIsVideo(false);
    setCapturedImage(dataUrl);
    stopCamera();
    setMode("preview");
  };

  // Gallery file upload handler
  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isVid = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      setIsVideo(isVid);
      const url = await uploadMedia(file);
      setCapturedImage(url);
      stopCamera();
      setMode("preview");
    } catch (err) {
      console.error("Gallery select error:", err);
      alert(err instanceof Error ? err.message : "Could not upload that file");
    }
  };

  // Return to live camera (Retake)
  const handleRetake = () => {
    if (embeddedPost) {
      onClose();
      return;
    }
    setIsVideo(false);
    setCapturedImage(null);
    setStoryText("");
    setActiveSticker(null);
    setMode("camera");
  };

  // Generate composite story image on canvas if text overlay exists
  const getFinalStoryImage = async (): Promise<string> => {
    if (!capturedImage) return "";

    // If video or no text overlay / stickers, return media directly
    if (isVideo || (!storyText && !activeSticker)) {
      return capturedImage;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(capturedImage);
          return;
        }

        // Draw image covering 1080x1920
        ctx.drawImage(img, 0, 0, 1080, 1920);

        // Draw Text Overlay
        if (storyText) {
          ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (textHighlight === "box" || textHighlight === "solid") {
            const metrics = ctx.measureText(storyText);
            const textWidth = metrics.width + 80;
            const textHeight = 110;
            ctx.fillStyle = textHighlight === "solid" ? "#FFFFFF" : "rgba(0,0,0,0.75)";
            ctx.beginPath();
            ctx.roundRect((1080 - textWidth) / 2, 960 - textHeight / 2, textWidth, textHeight, 28);
            ctx.fill();
            ctx.fillStyle = textHighlight === "solid" ? "#000000" : selectedColor;
          } else {
            ctx.fillStyle = selectedColor;
            ctx.shadowColor = "rgba(0,0,0,0.85)";
            ctx.shadowBlur = 12;
          }

          ctx.fillText(storyText, 540, 960);
        }

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(capturedImage);
      img.src = capturedImage;
    });
  };

  // Publish story to feed
  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      let finalUrl = (await getFinalStoryImage()) as string;
      if (finalUrl && finalUrl.startsWith("data:")) {
        const blob = await (await fetch(finalUrl)).blob();
        const ext = blob.type.includes("video") ? "mp4" : "jpg";
        finalUrl = await uploadMedia(new File([blob], `glimpse.${ext}`, { type: blob.type || "image/jpeg" }));
      }
      const caption = storyText || (activeSticker ? `${activeSticker}` : "Glimpse");
      await onStoryCreated(finalUrl, caption, roleBadge, embeddedPost?.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not publish story");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/95 backdrop-blur-xl animate-fade-in select-none">
      {/* 9:16 Instagram Smartphone Frame */}
      <div className="relative w-full max-w-[390px] h-[720px] max-h-[94vh] rounded-[40px] overflow-hidden flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.98)] border border-border bg-background apple-modal-enter">
        {/* ==================================================================== */}
        {/* VIEW 1: LIVE CAMERA VIEWFINDER (Instagram Camera Mode)               */}
        {/* ==================================================================== */}
        {mode === "camera" && (
          <div
            className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-neutral-950"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Live Video Feed */}
            {!cameraError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: selectedFilter.css !== "none" ? selectedFilter.css : undefined,
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              /* Camera Unavailable / Permission Denied Fallback */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-foreground bg-gradient-to-b from-neutral-900 to-black space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Camera Access</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                    {cameraError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-full bg-[var(--theme-color)] text-foreground text-xs font-bold hover:bg-[var(--theme-hover)] transition-colors flex items-center gap-2 shadow-lg"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose from Gallery</span>
                </button>
              </div>
            )}

            {/* Top Bar: Close & Camera Controls */}
            <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between text-foreground drop-shadow-md">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-background/40 hover:bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="w-10 h-10 rounded-full bg-background/40 hover:bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground transition-colors"
                  title="Flip Camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Controls Area: Filter Carousel + Shutter + Gallery */}
            <div className="relative z-20 pb-6 pt-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center gap-2">
              {/* Active Filter Pill indicator */}
              <div className="h-8 flex items-center justify-center">
                {selectedFilter.id !== "normal" && (
                  <button
                    type="button"
                    onClick={() => setSelectedFilter(INSTAGRAM_FILTERS[0])}
                    className="px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md text-[13px] font-bold text-white border border-white/40 flex items-center gap-2 shadow-lg transition-transform active:scale-95 animate-fade-in"
                  >
                    <span>{selectedFilter.name}</span>
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                )}
              </div>

              {/* Shutter Bar (Gallery on left, Big Shutter center, Flip right) */}
              <div className="w-full px-8 flex items-center justify-between">
                {/* 1. Gallery Access Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-2xl bg-black/15 hover:bg-black/25 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center text-foreground active:scale-90 transition-transform shadow-lg group"
                  title="Open Gallery"
                >
                  <ImageIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                  <span className="text-[8px] font-bold mt-0.5 tracking-tight uppercase text-foreground/80">
                    Gallery
                  </span>
                </button>

                {/* 2. Instagram Shutter Button (Click to Snap) */}
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-90 transition-all hover:scale-105 focus:outline-none"
                  title="Snap Glimpse Photo"
                >
                  <div className="w-full h-full rounded-full bg-white transition-colors" />
                </button>

                {/* 3. Flip Camera Switcher */}
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="w-12 h-12 rounded-2xl bg-black/15 hover:bg-black/25 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center text-foreground active:scale-90 transition-transform shadow-lg"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[8px] font-bold mt-0.5 tracking-tight uppercase text-foreground/80">
                    Flip
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: INSTAGRAM STORY PREVIEW & EDITOR (After Photo Capture/Gallery) */}
        {/* ==================================================================== */}
        {mode === "preview" && (
          <div
            className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-background"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Captured / Uploaded Photo or Video Canvas */}
            <div className="absolute inset-0 flex items-center justify-center">
              {capturedImage &&
                (isVideo ? (
                  <video
                    src={capturedImage}
                    autoPlay
                    loop
                    playsInline
                    muted
                    style={{
                      filter: selectedFilter.css !== "none" ? selectedFilter.css : undefined,
                    }}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <img
                    src={capturedImage}
                    alt="Glimpse preview"
                    style={{
                      filter: selectedFilter.css !== "none" ? selectedFilter.css : undefined,
                    }}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ))}

              {/* Embedded Post UI */}
              {embeddedPost && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-[0.85]">
                  <div className="w-[90%] max-w-[400px] bg-[#0E1118] border border-border rounded-3xl shadow-2xl p-5 flex flex-col pointer-events-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={embeddedPost.author?.avatar}
                        alt={embeddedPost.author?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1">
                          {embeddedPost.author?.username}
                          {embeddedPost.author?.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {embeddedPost.author?.name} • {embeddedPost.author?.roles?.[0]?.split(" ")[0] || "Creative"}{" "}
                          • {embeddedPost.country}
                        </div>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {(embeddedPost.content?.title || embeddedPost.content?.text) && (
                      <div className="text-neutral-200 text-[15px] mb-4">
                        {embeddedPost.content?.title && (
                          <span className="font-bold block mb-1">{embeddedPost.content.title}</span>
                        )}
                        {embeddedPost.content?.text && (
                          <p className="line-clamp-3">{embeddedPost.content.text}</p>
                        )}
                      </div>
                    )}

                    {embeddedPost.tags && embeddedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {embeddedPost.tags.map((tag) => (
                          <span key={tag} className="text-white text-[13px] font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {embeddedPost.content?.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden mt-2 mb-4 bg-[#121212]">
                        <img
                          src={embeddedPost.content?.mediaUrl}
                          className="w-full object-cover max-h-[250px]"
                          alt=""
                        />
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                      <div className="flex items-center gap-4 text-foreground">
                        <Heart className="w-6 h-6" />
                        <MessageCircle className="w-6 h-6" />
                        <Send className="w-6 h-6" />
                      </div>
                      <Bookmark className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Text Overlay on Story */}
              {storyText && !isEditingText && (
                <div
                  onClick={() => setIsEditingText(true)}
                  className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    style={{ color: selectedColor }}
                    className={`inline-block px-4 py-2 rounded-2xl text-xl sm:text-2xl font-black tracking-tight leading-snug break-words max-w-full ${
                      textHighlight === "box"
                        ? "bg-background/75 backdrop-blur-md shadow-2xl"
                        : textHighlight === "solid"
                          ? "bg-white text-black shadow-xl"
                          : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                    }`}
                  >
                    {storyText}
                  </span>
                </div>
              )}

              {/* Sticker Badge on Story */}
              {activeSticker && (
                <div
                  onClick={() => setShowStickers(true)}
                  className="absolute top-20 left-4 cursor-pointer active:scale-95 transition-transform shadow-xl"
                >
                  <div className="px-3.5 py-1.5 rounded-full bg-background/75 backdrop-blur-md border border-border text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>{activeSticker}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Bar in Preview Mode (Back to Camera, Aa Text, Stickers, Filters) */}
            <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between text-foreground drop-shadow-md">
              <button
                type="button"
                onClick={handleRetake}
                className="w-10 h-10 rounded-full bg-background/40 hover:bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground transition-colors"
                title="Retake / Return to Camera"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {/* Filter Selector Button (Sparkles) */}
                <button
                  type="button"
                  onClick={() => setShowFilterPicker(!showFilterPicker)}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    showFilterPicker || selectedFilter.id !== "normal"
                      ? "bg-[var(--theme-color)] text-foreground shadow-md"
                      : "bg-background/40 hover:bg-background/60 text-foreground"
                  }`}
                  title="Change Instagram Filter"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                {/* Aa Text Tool */}
                <button
                  type="button"
                  onClick={() => setIsEditingText(true)}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    isEditingText
                      ? "bg-white text-black"
                      : "bg-background/40 hover:bg-background/60 text-foreground"
                  }`}
                  title="Add Text"
                >
                  <Type className="w-4 h-4 font-bold" />
                </button>

                {/* Sticker Drawer */}
                <button
                  type="button"
                  onClick={() => setShowStickers(!showStickers)}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    showStickers
                      ? "bg-white text-black font-bold"
                      : "bg-background/40 hover:bg-background/60 text-foreground"
                  }`}
                  title="Add Stickers & Badges"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Picker Drawer in Preview Mode */}
            {showFilterPicker && (
              <div className="relative z-30 px-4 py-2 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {INSTAGRAM_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(f);
                        setShowFilterPicker(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        selectedFilter.id === f.id
                          ? "bg-white text-black font-bold shadow"
                          : "bg-black/15 text-foreground hover:bg-black/25"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fullscreen Typing Overlay (Instagram Aa Tool) */}
            {isEditingText && (
              <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-md flex flex-col justify-between p-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  {/* Style Toggle (Box / Solid / Transparent) */}
                  <button
                    type="button"
                    onClick={() =>
                      setTextHighlight((prev) =>
                        prev === "box" ? "solid" : prev === "solid" ? "transparent" : "box",
                      )
                    }
                    className="px-3.5 py-1 rounded-full bg-black/20 text-xs font-bold text-foreground flex items-center gap-1.5"
                  >
                    <span>A</span>
                    <span className="text-[10px] text-foreground/70 uppercase">({textHighlight})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingText(false)}
                    className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs shadow hover:bg-neutral-200 transition-colors"
                  >
                    Done
                  </button>
                </div>

                {/* Centered Large Text Input */}
                <div className="my-auto text-center px-4">
                  <input
                    type="text"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Type something..."
                    autoFocus
                    style={{ color: selectedColor }}
                    className={`w-full bg-transparent border-0 text-center text-2xl font-black focus:outline-none placeholder-white/40 ${
                      textHighlight === "box"
                        ? "bg-background/60 py-2.5 px-4 rounded-2xl"
                        : textHighlight === "solid"
                          ? "bg-white py-2.5 px-4 rounded-2xl text-black"
                          : ""
                    }`}
                  />
                </div>

                {/* Color Swatches */}
                <div className="flex items-center justify-center gap-2.5 pb-2 overflow-x-auto no-scrollbar">
                  {TEXT_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        selectedColor === col
                          ? "border-white scale-125 shadow-lg"
                          : "border-black/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sticker Drawer */}
            {showStickers && (
              <div className="absolute inset-x-0 bottom-24 z-30 bg-[#121212]/98 backdrop-blur-2xl border-t border-border rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 text-foreground shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Glimpse Stickers & Badges
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStickers(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Production Role Badges */}
                <div>
                  <span className="block text-[11px] font-semibold text-muted-foreground mb-2">
                    Film Role Badge
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {ALL_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRoleBadge(r);
                          setActiveSticker(`🎬 ${r}`);
                          setShowStickers(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          roleBadge === r
                            ? "bg-[var(--theme-color)] text-foreground shadow-md"
                            : "bg-muted hover:bg-black/20 text-neutral-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cinema Stickers */}
                <div>
                  <span className="block text-[11px] font-semibold text-muted-foreground mb-2">
                    Quick Stamps
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "🎬 Behind The Scenes",
                      "🍿 Now Screening",
                      "🔥 New Cut",
                      "🎥 16mm Reel",
                      "🏆 Award Winner",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setActiveSticker(s);
                          setShowStickers(false);
                        }}
                        className="px-3 py-1 rounded-full bg-muted hover:bg-black/20 text-xs text-foreground font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Instagram Share Sheet */}
            <div className="relative z-20 mt-auto px-4 py-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between">
              {/* Instagram "Your Story" Button */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="flex items-center gap-2.5 group active:scale-95 transition-transform focus:outline-none"
              >
                {/* Colorful Instagram Story Gradient Ring */}
                <div className="w-11 h-11 rounded-full p-[2.5px] bg-gradient-to-tr from-[#000000] to-[var(--theme-color)] shadow-md group-hover:scale-105 transition-transform">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover border border-black"
                  />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-foreground block leading-tight">
                    Your Glimpse
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">24 Hours</span>
                </div>
              </button>

              {/* Instant Share Pill */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <span>Share</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Picker for Gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleGallerySelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
