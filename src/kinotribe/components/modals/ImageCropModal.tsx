import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, Check, RotateCw, RotateCcw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { getCroppedImg } from "../../utils/cropImage";

export type AllowedPostAspect = "3:4" | "16:9";

interface ImageCropModalProps {
  imageFile: File | string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (
    croppedFile: File,
    aspect: AllowedPostAspect,
    aspectRatio: number,
    resolutionLabel: string,
  ) => void;
  initialAspect?: AllowedPostAspect;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageFile,
  isOpen,
  onClose,
  onCropComplete,
  initialAspect = "3:4",
}) => {
  const [aspectMode, setAspectMode] = useState<AllowedPostAspect>(initialAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stable image src managed via ref to avoid premature URL revocation
  const [imageSrc, setImageSrc] = useState<string>("");
  const blobUrlRef = useRef<string | null>(null);

  // Sync initial aspect if it changes
  useEffect(() => {
    if (initialAspect) {
      setAspectMode(initialAspect);
    }
  }, [initialAspect]);

  // Build stable image URL when imageFile changes
  useEffect(() => {
    // Revoke previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!imageFile) {
      setImageSrc("");
      return;
    }

    if (typeof imageFile === "string") {
      setImageSrc(imageFile);
    } else {
      const url = URL.createObjectURL(imageFile);
      blobUrlRef.current = url;
      setImageSrc(url);
    }

    // Reset cropper state for new image
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setIsProcessing(false);
  }, [imageFile]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const targetSpecs =
    aspectMode === "16:9"
      ? {
          aspectNumber: 16 / 9,
          width: 1920,
          height: 1080,
          label: "1920 × 1080 (16:9 Cinema)",
        }
      : {
          aspectNumber: 1080 / 1440, // 0.75 (3:4 portrait)
          width: 1080,
          height: 1440,
          label: "1080 × 1440 (4:3 Portrait)",
        };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc || isProcessing) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        { width: targetSpecs.width, height: targetSpecs.height },
      );

      if (croppedImage) {
        onCropComplete(croppedImage, aspectMode, targetSpecs.aspectNumber, targetSpecs.label);
      }
    } catch (err) {
      console.error("Failed to crop image:", err);
      alert("Could not apply crop. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageFile) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Top Bar: Title & Action Buttons */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border bg-background/70 z-20 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-2 -ml-2 text-neutral-300 hover:text-foreground rounded-full hover:bg-muted transition-colors active:scale-90 disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-foreground font-bold text-sm sm:text-base leading-tight">
          Crop & Adjust Photo
        </h2>

        <button
          type="button"
          onClick={handleApplyCrop}
          disabled={isProcessing || !croppedAreaPixels}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-[var(--theme-color)] shadow-lg shadow-[var(--theme-color)]/25"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Applying...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Done</span>
            </>
          )}
        </button>
      </div>

      {/* Main Interactive Crop Viewport */}
      <div className="relative flex-1 bg-[#0a0a0c] overflow-hidden">
        {imageSrc ? (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={targetSpecs.aspectNumber}
            minZoom={1}
            maxZoom={3.5}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteHandler}
            classes={{
              containerClassName: "h-full w-full",
              cropAreaClassName:
                "border-2 border-[var(--theme-color)] shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] rounded-sm",
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-color)]" />
          </div>
        )}

        {/* Framing Overlay Hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border text-[11px] text-neutral-300 pointer-events-none z-10 hidden sm:block">
          Drag photo to position · Pinch or scroll to scale
        </div>

        {/* Instagram-style Aspect Ratio Selector — bottom-left corner */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-background/60 backdrop-blur-md border border-border">
          {/* 4:3 Portrait */}
          <button
            type="button"
            onClick={() => setAspectMode("3:4")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-90 ${
              aspectMode === "3:4" ? "bg-black/20" : "hover:bg-muted"
            }`}
            title="Portrait 4:3 — 1080×1440"
          >
            <svg
              width="14"
              height="18"
              viewBox="0 0 14 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.75"
                y="0.75"
                width="12.5"
                height="16.5"
                rx="1.5"
                stroke={aspectMode === "3:4" ? "var(--theme-color)" : "white"}
                strokeWidth="1.5"
                fill={aspectMode === "3:4" ? "var(--theme-color)" : "none"}
                fillOpacity={aspectMode === "3:4" ? "0.25" : "0"}
              />
            </svg>
          </button>

          {/* 16:9 Landscape */}
          <button
            type="button"
            onClick={() => setAspectMode("16:9")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-90 ${
              aspectMode === "16:9" ? "bg-black/20" : "hover:bg-muted"
            }`}
            title="Landscape 16:9 — 1920×1080"
          >
            <svg
              width="20"
              height="13"
              viewBox="0 0 20 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.75"
                y="0.75"
                width="18.5"
                height="11.5"
                rx="1.5"
                stroke={aspectMode === "16:9" ? "var(--theme-color)" : "white"}
                strokeWidth="1.5"
                fill={aspectMode === "16:9" ? "var(--theme-color)" : "none"}
                fillOpacity={aspectMode === "16:9" ? "0.25" : "0"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Controls Bar: Zoom Slider & Actions */}
      <div className="p-3.5 sm:p-4 bg-[#141416] border-t border-border z-20 shrink-0 space-y-3">
        {/* Zoom Slider */}
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3.5}
            step={0.05}
            aria-label="Zoom photo"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-color)]"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-neutral-300 w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Utility Buttons: Rotate & Reset */}
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-xs font-medium text-neutral-300">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors active:scale-95"
            title="Rotate 90 degrees clockwise"
          >
            <RotateCw className="w-3.5 h-3.5 text-[var(--theme-color)]" />
            <span>Rotate 90°</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors active:scale-95"
            title="Reset framing"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
