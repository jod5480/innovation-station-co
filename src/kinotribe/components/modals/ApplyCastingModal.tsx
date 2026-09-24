import React, { useState } from 'react';
import {
  X,
  Clapperboard,
  CheckCircle2,
  Video,
  Send,
  FileText,
  Sparkles,
  MapPin,
  Calendar,
  Globe,
  Banknote,
} from 'lucide-react';
import { Post, User, CinemaRole, Application } from '../../types';

interface ApplyCastingModalProps {
  post: Post | null;
  currentUser: User;
  onClose: () => void;
  onSubmitApplication: (application: Application) => void;
}

export const ApplyCastingModal: React.FC<ApplyCastingModalProps> = ({
  post,
  currentUser,
  onClose,
  onSubmitApplication,
}) => {
  if (!post || !post.castingDetails) return null;

  const casting = post.castingDetails;
  const [selectedRole, setSelectedRole] = useState<CinemaRole>(
    casting.rolesNeeded[0] || 'Acting'
  );
  const [coverNote, setCoverNote] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState(
    currentUser.showreelVideoUrl || currentUser.portfolioUrl || ''
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: Application = {
      id: `app_${Date.now()}`,
      postId: post.id,
      projectTitle: casting.projectTitle,
      applicantId: currentUser.id,
      applicant: currentUser,
      selectedRole,
      coverNote: coverNote || 'Excited to audition and collaborate on this vision.',
      portfolioUrl,
      status: 'Submitted',
      submittedAt: 'Just now',
    };
    onSubmitApplication(newApp);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121826] border border-white/10 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-base text-neutral-100">
                Apply for Audition / Crew Role
              </h3>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                {casting.projectTitle} · {casting.projectType}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold font-brand text-neutral-100">
              Application Submitted!
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Your profile, showreel, and cover note have been transmitted to{' '}
              <strong className="text-neutral-200">{post.author.name}</strong>. You can track status under "My Applications" on your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* FULL CASTING CALL OVERVIEW SECTION (as shown when user clicks Apply for Role) */}
            <div className="p-4 rounded-2xl bg-[#0A0E17] border border-white/10 space-y-3.5 shadow-sm">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                    <Clapperboard className="w-3 h-3" />
                    Casting Call
                  </div>
                  <span className="text-xs text-neutral-300 font-medium">
                    {casting.projectType}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#FFB800]">
                  {casting.applicationCount} applied
                </span>
              </div>

              {/* Title & Description (with poster thumbnail if available) */}
              <div className="flex items-start gap-3">
                {post.content.mediaUrl && (
                  <div className="relative shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-md bg-black">
                    <img
                      src={post.content.mediaUrl}
                      alt={casting.projectTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[7px] font-mono text-[#FFB800] font-bold">
                      POSTER
                    </div>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-brand font-bold text-base text-white tracking-tight leading-snug">
                    {casting.projectTitle}
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {post.content.text}
                  </p>
                </div>
              </div>

              {/* Roles Needed Tags */}
              <div className="space-y-1">
                <div className="text-[11px] text-[#94A3B8] font-medium">
                  Roles Needed:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {casting.rolesNeeded.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-neutral-200 text-xs font-medium whitespace-nowrap shadow-sm"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Production Specs & Compensation Row */}
              <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-neutral-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">{casting.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">{casting.languageRequirement}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                    <span className="truncate">Deadline: {casting.deadline}</span>
                  </div>
                </div>

                {/* Compensation Row */}
                <div className="pt-2 border-t border-white/5 flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] block font-semibold">
                      Compensation
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 leading-snug break-words">
                      {casting.compensationAmount || casting.compensationType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audition Tape requirement note */}
              {casting.requirementsNote && (
                <div className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Audition tape: {casting.requirementsNote}</span>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Select Role You Are Applying For
              </label>
              <div className="grid grid-cols-2 gap-2">
                {casting.rolesNeeded.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors ${
                      selectedRole === role
                        ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white font-bold'
                        : 'bg-black/50 border-white/10 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <span>{role}</span>
                    {selectedRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Attached Portfolio / Showreel */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Showreel / Self-Tape Video Link
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="url"
                  required
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://vimeo.com/showreel or YouTube"
                  className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Prefilled from your profile. Self-tapes or reel timestamps help casting directors evaluate quickly.
              </p>
            </div>

            {/* Note to Director / Casting Director */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Personal Note / Audition Pitch
              </label>
              <textarea
                rows={3}
                required
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Introduce yourself, mention relevant past credits or why you connect with this story..."
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-md shadow-[#FF6B00]/20"
              >
                <Send className="w-3.5 h-3.5" /> Submit Audition / Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
