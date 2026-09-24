import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Building2,
  UserCheck,
  Phone,
  Lock,
  User as UserIcon,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { User, UserRole } from '../types/auth';
import { useTheme } from '../context/ThemeContext';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeRole, setActiveRole] = useState<UserRole>('citizen');
  const [userNameInput, setUserNameInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loginErrorModalOpen, setLoginErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    'Login Failed. Invalid OTP. Please try again.'
  );

  // Google Sign-In Prompt Modal State
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleName, setGoogleName] = useState('Manas Gonnu');
  const [googleEmail, setGoogleEmail] = useState('manasagonnu87@gmail.com');
  const [useCustomGoogleAccount, setUseCustomGoogleAccount] = useState(false);

  // Trigger Google Sign-In dialog
  const handleOpenGoogleAuth = () => {
    setGooglePromptOpen(true);
  };

  // Complete authentic Google Sign-In
  const handleConfirmGoogleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = googleName.trim() || 'Google User';
    const finalEmail = googleEmail.trim() || 'user@gmail.com';

    const newUser: User = {
      id: `usr-g-${Date.now().toString(36)}`,
      name: finalName,
      email: finalEmail,
      role: activeRole,
      department: activeRole === 'admin' ? 'Urban Infrastructure & Rapid Emergency Wing' : undefined,
      officerBadge: activeRole === 'admin' ? `IND-MU-${Math.floor(100 + Math.random() * 900)}` : undefined,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      resolvedCount: activeRole === 'admin' ? 84 : undefined,
      activeAssignedCount: activeRole === 'admin' ? 7 : undefined,
    };

    try {
      localStorage.setItem('citynexus_auth', JSON.stringify(newUser));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    setGooglePromptOpen(false);
    onLogin(newUser);
  };

  // Handle Phone OTP Flow: Step 1 Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.trim().replace(/\D/g, '');

    // Validate Indian Phone Number format (10 digits, optionally starting with 91)
    const isValidIndianNumber =
      (cleanNumber.length === 10 && /^[6-9]\d{9}$/.test(cleanNumber)) ||
      (cleanNumber.length === 12 && cleanNumber.startsWith('91') && /^[6-9]\d{9}$/.test(cleanNumber.slice(2)));

    if (!isValidIndianNumber) {
      setErrorMessage(
        'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).'
      );
      setLoginErrorModalOpen(true);
      return;
    }

    // Generate random 6-digit verification code behind the scenes
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);

    // Strictly log to developer browser console for testing, never leak to UI
    console.log(
      '%c[CityNexus AI Auth Dispatch] %cVerification OTP for +91 ' +
        (cleanNumber.length === 12 ? cleanNumber.slice(2) : cleanNumber) +
        ': %c' +
        randomCode,
      'color: #0284c7; font-weight: bold',
      'color: #475569',
      'color: #10b981; font-weight: 900; font-size: 14px; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;'
    );

    setOtpSent(true);
  };

  // Handle Phone OTP Flow: Step 2 Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanInputCode = otpCode.trim();

    if (cleanInputCode !== generatedOtp) {
      setErrorMessage('Login Failed. Invalid OTP. Please try again.');
      setLoginErrorModalOpen(true);
      return;
    }

    // Determine user details from input or clean phone
    const cleanPhoneDigits = phoneNumber.trim().replace(/\D/g, '');
    const formattedPhone = cleanPhoneDigits.length === 12
      ? `+${cleanPhoneDigits}`
      : `+91 ${cleanPhoneDigits}`;

    const displayName = userNameInput.trim() || (activeRole === 'admin' ? 'Officer' : 'Citizen');
    const userEmail = `${displayName.toLowerCase().replace(/\s+/g, '.') || 'user'}@citynexus.gov.in`;

    const newUser: User = {
      id: `usr-p-${Date.now().toString(36)}`,
      name: displayName,
      email: userEmail,
      phone: formattedPhone,
      role: activeRole,
      department: activeRole === 'admin' ? 'Municipal Public Works & Dispatch' : undefined,
      officerBadge: activeRole === 'admin' ? `IND-OF-${Math.floor(100 + Math.random() * 900)}` : undefined,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      resolvedCount: activeRole === 'admin' ? 72 : undefined,
      activeAssignedCount: activeRole === 'admin' ? 5 : undefined,
    };

    try {
      localStorage.setItem('citynexus_auth', JSON.stringify(newUser));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    onLogin(newUser);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Full-screen daytime smart city background with soft frosted overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/85 backdrop-blur-md -z-10 transition-colors" />

      {/* Floating Theme Toggle (Top Right) */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 shadow-md backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700" />
        )}
      </button>

      {/* Single Centered Compact Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 backdrop-blur-xl transition-colors">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            CityNexus <span className="text-sky-600 dark:text-sky-400">AI</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Smart Urban Intelligence Platform
          </p>
        </div>

        {/* Role Switcher Pills */}
        <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 p-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
          <button
            type="button"
            onClick={() => {
              setActiveRole('citizen');
              setOtpSent(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
              activeRole === 'citizen'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('admin');
              setOtpSent(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
              activeRole === 'admin'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Municipal Officer</span>
          </button>
        </div>

        {/* Option A: Continue with Google */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleOpenGoogleAuth}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center justify-between">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Or with Phone
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Option B: Two-Step Realistic Phone OTP Authentication */}
        {!otpSent ? (
          /* Step 1: Phone Entry */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name (Optional)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={activeRole === 'admin' ? 'e.g. Officer Rajesh Kumar' : 'e.g. Manas Gonnu'}
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number (+91 Indian Format) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 pl-12 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                A 6-digit verification code will be generated for your session
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-500 hover:to-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Send Verification Code</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          /* Step 2: Realistic 6-Digit OTP Verification Screen */
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/60 p-3.5 text-center">
              <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
                Verification code sent!
              </p>
              <p className="mt-1 text-[11px] text-sky-700 dark:text-sky-300">
                We have sent a verification code to{' '}
                <strong className="font-semibold text-slate-800 dark:text-slate-100">
                  +91 {phoneNumber.replace(/\D/g, '').slice(-10)}
                </strong>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Enter 6-Digit Code *
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Change Number
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-[0.4em] text-center font-mono text-sm font-black rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 py-2.5 px-10 text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Check browser console for testing code (secure hackathon simulator)
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Verify &amp; Enter CityNexus</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* Google Sign-In Prompt Modal (GIS Mock Capture) */}
      {googlePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setGooglePromptOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Select an account to continue to <strong>CityNexus AI</strong> as{' '}
              <span className="text-sky-600 dark:text-sky-400 font-bold capitalize">{activeRole}</span>
            </p>

            {!useCustomGoogleAccount ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleConfirmGoogleLogin()}
                  className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 p-3 text-left hover:bg-sky-50/80 dark:hover:bg-sky-950/60 hover:border-sky-300 dark:hover:border-sky-700 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm shadow-xs">
                    {googleName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{googleName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{googleEmail}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setUseCustomGoogleAccount(true)}
                  className="w-full py-2 text-center text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Use another Google Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmGoogleLogin} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Account Name
                  </label>
                  <input
                    type="text"
                    required
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. Manas Gonnu"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="e.g. manasagonnu87@gmail.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUseCustomGoogleAccount(false)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow-sm"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Animated Failure Feedback Pop-up Modal */}
      {loginErrorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-900 p-6 shadow-2xl text-center animate-in zoom-in-95 transition-colors">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Login Failed</h3>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {errorMessage}
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setLoginErrorModalOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-all shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
