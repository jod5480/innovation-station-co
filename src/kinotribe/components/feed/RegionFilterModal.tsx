import React from 'react';
import { X, Globe, MapPin, Check } from 'lucide-react';
import { COUNTRIES_DATA, LANGUAGES_LIST } from '../../data/mockCinemaData';
import { FeedFilterMode } from '../../types';

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121826] border border-white/10 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/60">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#FFB800]" />
            <div>
              <h3 className="font-brand font-bold text-base">Cinema Feed Region</h3>
              <span className="text-[10px] text-[#94A3B8] font-mono">
                REGIONAL & LANGUAGE DISCOVERY
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Main 3 Modes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block">
              CHOOSE FEED VIEW
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onSetFilterMode('regional');
                  onSelectCountry(userCountry);
                  onSelectLanguage(userLanguage);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === 'regional'
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white'
                    : 'bg-black/50 border-white/10 text-neutral-400 hover:border-white/20'
                }`}
              >
                <MapPin className="w-4 h-4 mb-1 text-[#FFB800]" />
                <span className="font-bold text-xs">My Region</span>
                <span className="text-[10px] text-neutral-500 truncate mt-0.5">
                  {userCountry}
                </span>
              </button>

              <button
                onClick={() => onSetFilterMode('global')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === 'global'
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white'
                    : 'bg-black/50 border-white/10 text-neutral-400 hover:border-white/20'
                }`}
              >
                <Globe className="w-4 h-4 mb-1 text-[#FFB800]" />
                <span className="font-bold text-xs">Global Feed</span>
                <span className="text-[10px] text-neutral-500 truncate mt-0.5">
                  All Countries
                </span>
              </button>

              <button
                onClick={() => onSetFilterMode('custom')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  filterMode === 'custom'
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white'
                    : 'bg-black/50 border-white/10 text-neutral-400 hover:border-white/20'
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
          {filterMode === 'custom' && (
            <>
              <div>
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
                  SELECT COUNTRY TO BROWSE
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 bg-black/50 rounded-xl border border-white/10">
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
                            ? 'bg-[#FF6B00]/20 text-white font-bold border border-[#FF6B00]/40'
                            : 'text-neutral-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">
                          {c.flag} {c.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
                  SELECT LANGUAGE
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/50 rounded-xl border border-white/10">
                  {LANGUAGES_LIST.map((l) => {
                    const isSelected = activeLanguage === l;
                    return (
                      <button
                        key={l}
                        onClick={() => onSelectLanguage(l)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#FF6B00] text-white font-bold'
                            : 'bg-white/10 text-neutral-300 hover:bg-white/15'
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
            className="w-full py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 transition-transform active:scale-95"
          >
            Apply Region & Refresh Feed
          </button>
        </div>
      </div>
    </div>
  );
};
