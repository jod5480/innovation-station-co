import React, { useState } from "react";
import { X, Globe, MapPin, Check, Navigation, Loader2 } from "lucide-react";
import { detectLocation, type GeoLocation } from "../../lib/geo";
import { COUNTRIES_DATA, LANGUAGES_LIST } from "../../data/mockCinemaData";
import { FeedFilterMode } from "../../types";

interface RegionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterMode: FeedFilterMode;
  onSetFilterMode: (mode: FeedFilterMode) => void;
  activeCountry: string;
  onSelectCountry: (country: string) => void;
  activeLanguage: string;
  onSelectLanguage: (language: string) => void;
  userCountry: string;
  userLanguage: string;
  myLocation?: GeoLocation | null;
  nearbyRadius?: number;
  onSetNearbyRadius?: (km: number) => void;
}

export const RegionFilterModal: React.FC<RegionFilterModalProps> = ({
  isOpen,
  onClose,
  filterMode,
  onSetFilterMode,
  activeCountry,
  onSelectCountry,
  activeLanguage,
  onSelectLanguage,
  userCountry,
  userLanguage,
  myLocation,
  nearbyRadius = 25,
  onSetNearbyRadius,
}) => {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  if (!isOpen) return null;

  const locate = async () => {
    setLocating(true);
    setLocError("");
    try {
      await detectLocation();
      onSetFilterMode("nearby");
    } catch (e) {
      setLocError(e instanceof Error ? e.message : "Couldn't detect location");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md apple-glass-card border border-border text-neutral-100 rounded-[32px] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col backdrop-blur-3xl apple-modal-enter">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between apple-glass-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white" />
              <div>
                <h3 className="font-brand font-bold text-sm text-foreground">
                  Cinema Region & Language
                </h3>
                <span className="text-[9px] text-muted-foreground font-mono block">
                  REGIONAL & LANGUAGE DISCOVERY
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* GPS Nearby */}
          <div className={`p-4 rounded-2xl border space-y-3 ${filterMode === "nearby" ? "border-[var(--theme-color)] bg-[var(--theme-color)]/10" : "border-border bg-background/50"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[var(--theme-color)]" />
                <div>
                  <span className="font-bold text-xs text-foreground block">Nearby (GPS)</span>
                  <span className="text-[10px] text-muted-foreground">
                    {myLocation
                      ? `${myLocation.city ? myLocation.city + ", " : ""}${myLocation.country || ""}${myLocation.accuracy ? ` · ±${Math.round(myLocation.accuracy)} m` : ""}`
                      : "Posts from people around you"}
                  </span>
                </div>
              </div>
              <button
                onClick={myLocation ? () => onSetFilterMode("nearby") : locate}
                disabled={locating}
                className="px-3 py-1.5 rounded-full bg-[var(--theme-color)] text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-60"
              >
                {locating && <Loader2 className="w-3 h-3 animate-spin" />}
                {myLocation ? (filterMode === "nearby" ? "Active" : "Use") : "Enable location"}
              </button>
            </div>
            {myLocation && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 25, 50, 100, 250].map((km) => (
                    <button
                      key={km}
                      onClick={() => { onSetNearbyRadius?.(km); onSetFilterMode("nearby"); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] ${filterMode === "nearby" && nearbyRadius === km ? "bg-[var(--theme-color)] text-white font-bold" : "bg-muted text-neutral-300"}`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
                <button onClick={locate} disabled={locating} className="text-[11px] text-[var(--theme-color)] hover:underline">
                  {locating ? "Updating…" : "Refresh my location"}
                </button>
              </>
            )}
            {locError && <p className="text-[11px] text-red-400">{locError}</p>}
          </div>

          {/* Main 3 Modes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              CHOOSE FEED VIEW
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onSetFilterMode("regional");
                  onSelectCountry(userCountry);
                  onSelectLanguage(userLanguage);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === "regional"
                    ? "bg-[var(--theme-color)]/15 border-[var(--theme-color)] text-foreground"
                    : "bg-background/50 border-border text-muted-foreground hover:border-border"
                }`}
              >
                <MapPin className="w-4 h-4 mb-1 text-white" />
                <span className="font-bold text-xs">My Region</span>
                <span className="text-[10px] text-neutral-500 truncate mt-0.5">{userCountry}</span>
              </button>

              <button
                onClick={() => onSetFilterMode("global")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === "global"
                    ? "bg-[var(--theme-color)]/15 border-[var(--theme-color)] text-foreground"
                    : "bg-background/50 border-border text-muted-foreground hover:border-border"
                }`}
              >
                <Globe className="w-4 h-4 mb-1 text-white" />
                <span className="font-bold text-xs">Global Feed</span>
                <span className="text-[10px] text-neutral-500 truncate mt-0.5">All Countries</span>
              </button>

              <button
                onClick={() => onSetFilterMode("custom")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === "custom"
                    ? "bg-[var(--theme-color)]/15 border-[var(--theme-color)] text-foreground"
                    : "bg-background/50 border-border text-muted-foreground hover:border-border"
                }`}
              >
                <span className="text-base mb-1">🎯</span>
                <span className="font-bold text-xs">Custom Filter</span>
                <span className="text-[10px] text-neutral-500 truncate mt-0.5">
                  Select Specific
                </span>
              </button>
            </div>
          </div>

          {/* Select Specific Country */}
          {filterMode === "custom" && (
            <>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                  SELECT COUNTRY TO BROWSE
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 bg-background/50 rounded-xl border border-border">
                  {COUNTRIES_DATA.map((c) => {
                    const isSelected = activeCountry === c.name;
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          onSelectCountry(c.name);
                          onSelectLanguage(c.defaultLanguage);
                        }}
                        className={`p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? "bg-[var(--theme-color)]/20 text-foreground font-bold border border-[var(--theme-color)]/40"
                            : "text-neutral-300 hover:bg-muted/50"
                        }`}
                      >
                        <span className="truncate">
                          {c.flag} {c.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                  SELECT LANGUAGE
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-background/50 rounded-xl border border-border">
                  {LANGUAGES_LIST.map((l) => {
                    const isSelected = activeLanguage === l;
                    return (
                      <button
                        key={l}
                        onClick={() => onSelectLanguage(l)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                          isSelected
                            ? "bg-[var(--theme-color)] text-foreground font-bold"
                            : "bg-muted text-neutral-300 hover:bg-black/15"
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-xs shadow-md shadow-[var(--theme-color)]/20 transition-transform active:scale-95"
          >
            Apply Region & Refresh Feed
          </button>
        </div>
      </div>
    </div>
  );
};
