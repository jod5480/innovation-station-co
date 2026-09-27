import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  Film,
  Sparkles,
  Clapperboard,
  Globe,
  Camera,
  User as UserIcon,
  Video,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { User, CinemaRole, ExperienceLevel } from "../../types";
import { ALL_ROLES, COUNTRIES_DATA, LANGUAGES_LIST, MOCK_USERS } from "../../data/mockCinemaData";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLoginSuccess: (user: User) => void;
  initialView?: "login" | "signup";
}

type AuthView =
  | "login"
  | "signup"
  | "forgot_password"
  | "otp_verify"
  | "onboarding_step_1"
  | "onboarding_step_2"
  | "onboarding_step_3";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  initialView = "signup",
}) => {
  if (!isOpen) return null;

  const [authView, setAuthView] = useState<AuthView>(initialView);

  useEffect(() => {
    setAuthView(initialView);
  }, [isOpen, initialView]);
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Form states
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState("842915");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(45);
  const [otpError, setOtpError] = useState("");

  // Post-Signup Onboarding Wizard state
  const [wizardData, setWizardData] = useState<{
    name: string;
    username: string;
    avatar: string;
    country: string;
    countryCode: string;
    languages: string[];
    roles: CinemaRole[];
    experienceLevel: ExperienceLevel;
    bio: string;
    showreelVideoUrl: string;
    imdbUrl: string;
    portfolioUrl: string;
  }>({
    name: "Julian Vance",
    username: "julianvance_film",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    country: "United States",
    countryCode: "US",
    languages: ["English"],
    roles: ["Acting", "Directing"],
    experienceLevel: "Experienced",
    bio: "Narrative actor & indie director. Dedicated to high-contrast cinematic realism.",
    showreelVideoUrl: "https://vimeo.com/76979871",
    imdbUrl: "https://imdb.com/name/nm0001",
    portfolioUrl: "https://julianvance.com",
  });

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authView === "otp_verify" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authView, otpTimer]);

  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpTimer(45);
    setAuthView("otp_verify");
  };

  const handleFillDemoOtp = () => {
    setOtpDigits(generatedOtp.split(""));
    setOtpError("");
  };

  const handleVerifyOtp = () => {
    const entered = otpDigits.join("");
    if (entered.length < 6) {
      setOtpError("Please enter all 6 digits of the verification code.");
      return;
    }
    if (entered !== generatedOtp && entered !== "123456") {
      setOtpError(`Invalid code. Demo code is ${generatedOtp}`);
      return;
    }

    setOtpError("");
    // If we were in forgot_password or passwordless login:
    if (loginMethod === "otp" && authView === "otp_verify") {
      // Log in
      onLoginSuccess(currentUser);
      onClose();
    } else {
      // Advance to 3-step onboarding wizard
      setAuthView("onboarding_step_1");
    }
  };

  const handleRoleToggle = (role: CinemaRole) => {
    setWizardData((prev) => {
      const exists = prev.roles.includes(role);
      if (exists) {
        return { ...prev, roles: prev.roles.filter((r) => r !== role) };
      } else {
        return { ...prev, roles: [...prev.roles, role] };
      }
    });
  };

  const handleLanguageToggle = (lang: string) => {
    setWizardData((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists) {
        if (prev.languages.length === 1) return prev; // keep at least one
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      } else {
        return { ...prev, languages: [...prev.languages, lang] };
      }
    });
  };

  const finishOnboarding = () => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: wizardData.name || "Cinema Creator",
      username: wizardData.username || "cinematographer",
      email: emailInput || "filmmaker@cinetribe.cinema",
      phone: phoneInput || selectedCountryCode + " 555-0199",
      avatar: wizardData.avatar,
      bio: wizardData.bio,
      country: wizardData.country,
      countryCode: wizardData.countryCode,
      languages: wizardData.languages,
      roles: wizardData.roles.length > 0 ? wizardData.roles : ["Directing"],
      experienceLevel: wizardData.experienceLevel,
      portfolioUrl: wizardData.portfolioUrl,
      imdbUrl: wizardData.imdbUrl,
      showreelVideoUrl: wizardData.showreelVideoUrl,
      followersCount: 1,
      followingCount: 3,
      isVerified: true,
      joinedDate: "Joined September 2026",
    };
    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md apple-glass-card border border-border text-neutral-100 rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col apple-modal-enter">
        {/* Header with cinema branding */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between apple-glass-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--theme-color)]/15 border border-[var(--theme-color)]/30 flex items-center justify-center text-[var(--theme-color)]">
              <Clapperboard className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-brand font-bold text-sm tracking-wider text-[var(--theme-color)]">
                CINETRIBE
              </span>
              <span className="text-[9px] text-muted-foreground block font-mono">
                CINEMA COMMUNITY AUTH
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Demo Switcher Bar */}
          <div className="p-2.5 rounded-xl bg-background/50 border border-border text-xs text-neutral-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Fast Demo Switch
              </span>
              <span className="text-[11px] text-muted-foreground">Instant test login</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {MOCK_USERS.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onLoginSuccess(u);
                    onClose();
                  }}
                  className="px-2 py-1 rounded-full bg-muted hover:bg-black/15 text-[11px] text-neutral-200 flex items-center gap-1 transition-colors"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[85px]">{u.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* VIEW: SIGNUP */}
          {authView === "signup" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-brand tracking-tight">
                  Join the Film Community
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect with directors, crew & audition for regional casting calls.
                </p>
              </div>

              {/* Method Toggle: Email OR Phone */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-background/50 rounded-xl border border-border">
                <button
                  onClick={() => setSignupMethod("email")}
                  className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    signupMethod === "email"
                      ? "bg-[var(--theme-color)] text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </button>
                <button
                  onClick={() => setSignupMethod("phone")}
                  className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    signupMethod === "phone"
                      ? "bg-[var(--theme-color)] text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </button>
              </div>

              {signupMethod === "email" ? (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="director@studios.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Phone Number (with SMS OTP)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="bg-background/50 border border-border rounded-xl text-xs text-neutral-200 px-2 py-2.5 focus:outline-none focus:border-[var(--theme-color)]"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+82">🇰🇷 +82</option>
                      <option value="+234">🇳🇬 +234</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="310 555 0192"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                className="w-full py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md shadow-[var(--theme-color)]/20"
              >
                Verify with OTP <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
                Already have an account?{" "}
                <button
                  onClick={() => setAuthView("login")}
                  className="text-white hover:underline font-semibold ml-1"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {authView === "login" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-brand tracking-tight">
                  Sign in to Kinotribe
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Access your film portfolio, casting calls, and network.
                </p>
              </div>

              {/* Login Method Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-background/50 rounded-xl border border-border">
                <button
                  onClick={() => setLoginMethod("password")}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                    loginMethod === "password"
                      ? "bg-[var(--theme-color)] text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Password Login
                </button>
                <button
                  onClick={() => setLoginMethod("otp")}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                    loginMethod === "otp"
                      ? "bg-[var(--theme-color)] text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Passwordless OTP
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="maya@cinetribe.cinema or phone"
                  defaultValue="maya@cinetribe.cinema"
                  className="w-full px-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                />
              </div>

              {loginMethod === "password" ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-300">Password</label>
                    <button
                      onClick={() => setAuthView("forgot_password")}
                      className="text-[11px] text-white hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    defaultValue="cinemapass123"
                    className="w-full px-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  We'll send a one-time 6-digit verification code to log you in securely without a
                  password.
                </p>
              )}

              <button
                onClick={() => {
                  if (loginMethod === "otp") {
                    handleSendOtp();
                  } else {
                    onLoginSuccess(currentUser);
                    onClose();
                  }
                }}
                className="w-full py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md shadow-[var(--theme-color)]/20"
              >
                {loginMethod === "otp" ? "Verify with OTP" : "Log In"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
                Don't have an account yet?{" "}
                <button
                  onClick={() => setAuthView("signup")}
                  className="text-white hover:underline font-semibold ml-1"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {authView === "forgot_password" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-brand tracking-tight">Reset Password</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your registered email or phone to receive a 6-digit recovery OTP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Registered Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="name@domain.com or +1 310 555 0192"
                  className="w-full px-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[var(--theme-color)]"
                />
              </div>

              <button
                onClick={handleSendOtp}
                className="w-full py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--theme-color)]/20"
              >
                Send Reset Code <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAuthView("login")}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* VIEW: OTP VERIFICATION */}
          {authView === "otp_verify" && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--theme-color)]/15 border border-[var(--theme-color)]/30 flex items-center justify-center text-[var(--theme-color)] mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold font-brand">Enter 6-Digit Code</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to{" "}
                  {signupMethod === "email"
                    ? emailInput || "your email"
                    : phoneInput || "your phone"}
                  .
                </p>
              </div>

              {/* Demo OTP Notice & 1-Click Auto-Fill */}
              <div className="p-3 bg-muted/50 border border-border rounded-xl text-xs text-neutral-300 flex items-center justify-between">
                <span>
                  Demo OTP code:{" "}
                  <strong className="font-mono text-white tracking-wider text-sm">
                    {generatedOtp}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="px-2.5 py-1 bg-[var(--theme-color)] text-foreground text-[11px] font-bold rounded-full hover:bg-[var(--theme-hover)] transition-colors"
                >
                  Fill Code
                </button>
              </div>

              {/* 6 Digits Inputs */}
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextDigits = [...otpDigits];
                      nextDigits[index] = val;
                      setOtpDigits(nextDigits);
                      if (val && index < 5) {
                        const nextEl = document.getElementById(`otp-input-${index + 1}`);
                        if (nextEl) nextEl.focus();
                      }
                    }}
                    className="w-11 h-12 text-center text-xl font-mono font-bold bg-background/50 border border-border rounded-xl text-white focus:outline-none focus:border-[var(--theme-color)] transition-all"
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-rose-400">{otpError}</p>}

              <button
                onClick={handleVerifyOtp}
                className="w-full py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--theme-color)]/20"
              >
                Verify & Activate Account <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>{otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Code expired"}</span>
                <button
                  disabled={otpTimer > 0}
                  onClick={handleSendOtp}
                  className="text-white disabled:text-neutral-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* VIEW: ONBOARDING STEP 1 - Basic Info */}
          {authView === "onboarding_step_1" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-white tracking-wider font-semibold">
                  STEP 1 OF 3 · BASIC IDENTITY
                </span>
                <span className="text-[11px] text-muted-foreground">33% complete</span>
              </div>
              <h3 className="text-lg font-bold font-brand">Tell the Tribe Who You Are</h3>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name / Screen Name
                </label>
                <input
                  type="text"
                  value={wizardData.name}
                  onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Username (Handle)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">@</span>
                  <input
                    type="text"
                    value={wizardData.username}
                    onChange={(e) => setWizardData({ ...wizardData, username: e.target.value })}
                    className="w-full pl-7 pr-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Base Country (Sets regional feed)
                </label>
                <select
                  value={wizardData.country}
                  onChange={(e) => {
                    const countryObj = COUNTRIES_DATA.find((c) => c.name === e.target.value);
                    setWizardData({
                      ...wizardData,
                      country: e.target.value,
                      countryCode: countryObj ? countryObj.code : "US",
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-[var(--theme-color)]"
                >
                  {COUNTRIES_DATA.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Languages Spoken (Multi-select)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-background/50 rounded-xl border border-border">
                  {LANGUAGES_LIST.map((lang) => {
                    const active = wizardData.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          active
                            ? "bg-[var(--theme-color)] text-foreground font-bold"
                            : "bg-muted text-neutral-300 hover:bg-black/15"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setAuthView("onboarding_step_2")}
                className="w-full py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--theme-color)]/20"
              >
                Next: Role & Experience <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW: ONBOARDING STEP 2 - Roles Selection */}
          {authView === "onboarding_step_2" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-white tracking-wider font-semibold">
                  STEP 2 OF 3 · ROLES & CRAFT
                </span>
                <span className="text-[11px] text-muted-foreground">66% complete</span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-brand">Select Your Cinema Roles</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your feed and casting call matches are personalized based on your craft.
                </p>
              </div>

              {/* Roles Multi-select Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const isSelected = wizardData.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-[var(--theme-color)]/15 border-[var(--theme-color)]/80 text-foreground font-bold"
                          : "bg-background/50 border-border text-neutral-300 hover:border-border"
                      }`}
                    >
                      <span>{role}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Newcomer", "Mid-level", "Experienced"] as ExperienceLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setWizardData({ ...wizardData, experienceLevel: lvl })}
                      className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                        wizardData.experienceLevel === lvl
                          ? "bg-[var(--theme-color)] text-foreground font-bold border-[var(--theme-color)]"
                          : "bg-background/50 text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthView("onboarding_step_1")}
                  className="px-4 py-3 rounded-full bg-muted text-neutral-300 hover:bg-black/15 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView("onboarding_step_3")}
                  className="flex-1 py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--theme-color)]/20"
                >
                  Next: Portfolio & Links <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: ONBOARDING STEP 3 - Portfolio & Links */}
          {authView === "onboarding_step_3" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-white tracking-wider font-semibold">
                  STEP 3 OF 3 · SHOWREEL & LINKS
                </span>
                <span className="text-[11px] text-muted-foreground">100% complete</span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-brand">Add Your Portfolio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Make it easy for casting directors and producers to review your work.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Bio / Artist Statement
                </label>
                <textarea
                  rows={2}
                  value={wizardData.bio}
                  onChange={(e) => setWizardData({ ...wizardData, bio: e.target.value })}
                  placeholder="Share your cinema vision, gear preferences, or notable projects..."
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Showreel Video Link (Vimeo / YouTube)
                </label>
                <div className="relative">
                  <Video className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={wizardData.showreelVideoUrl}
                    onChange={(e) =>
                      setWizardData({ ...wizardData, showreelVideoUrl: e.target.value })
                    }
                    placeholder="https://vimeo.com/your-showreel"
                    className="w-full pl-9 pr-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    IMDb Link
                  </label>
                  <input
                    type="url"
                    value={wizardData.imdbUrl}
                    onChange={(e) => setWizardData({ ...wizardData, imdbUrl: e.target.value })}
                    placeholder="https://imdb.com/..."
                    className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={wizardData.portfolioUrl}
                    onChange={(e) => setWizardData({ ...wizardData, portfolioUrl: e.target.value })}
                    placeholder="https://mywork.film"
                    className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-[var(--theme-color)]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthView("onboarding_step_2")}
                  className="px-4 py-3 rounded-full bg-muted text-neutral-300 hover:bg-black/15 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="flex-1 py-3 rounded-full bg-[var(--theme-color)] hover:bg-[var(--theme-hover)] text-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--theme-color)]/20"
                >
                  Complete Setup & Enter Kinotribe 🎬
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
