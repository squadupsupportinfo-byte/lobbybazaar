import React, { useState, useRef, useEffect } from 'react';
import { X, UserPlus, LogIn, Shield, Gamepad, AlertCircle, ArrowLeft, ArrowRight, Check, Sparkles, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';
import { BlockyCharacter3D } from './BlockyCharacter3D';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CharacterAvatarType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signup' | 'signin';
  onSignUpSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signup', onSignUpSuccess }: AuthModalProps) {
  const { user, signUpWithEmail, signInWithEmail, resetPassword, signInWithGoogle, updateGamerProfile } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot'>(defaultMode);
  const [signUpStep, setSignUpStep] = useState<'credentials' | 'warrior'>('credentials');
  const [selectedWarrior, setSelectedWarrior] = useState<CharacterAvatarType>('waving');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [favoriteGame, setFavoriteGame] = useState('Valorant');
  const [role, setRole] = useState('Duelist');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockingWarrior, setUnlockingWarrior] = useState<string | null>(null);

  const isCharUnlocked = (cId: string) => {
    if (typeof window !== 'undefined' && localStorage.getItem(`squadup_character_unlocked_${cId}`) === 'true') {
      return true;
    }
    return false;
  };

  const handleUnlockWarrior = async (charId: string, charName: string) => {
    try {
      setUnlockingWarrior(charId);
      playSketchClick();

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'character_unlock',
          characterId: charId,
          characterName: charName,
          gamerTag: gamerTag || 'Player',
          origin: window.location.origin,
        }),
      });

      const data = await res.json();
      if (data.url) {
        let redirected = false;
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = data.url;
            redirected = true;
          }
        } catch (_) {}

        if (!redirected) {
          const win = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = data.url;
          }
        }
      }
    } catch (err) {
      console.error('Warrior checkout error:', err);
    } finally {
      setUnlockingWarrior(null);
    }
  };

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const recoveryEmailInputRef = useRef<HTMLInputElement>(null);

  // Sync mode with defaultMode when opening modal
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setShowPassword(false);
    }
  }, [isOpen, defaultMode]);

  // Crucial: When user logs out (user becomes null), when modal opens/closes, or when mode shifts,
  // ALWAYS wipe email and password completely from both React state and DOM inputs to defeat browser autofill!
  useEffect(() => {
    setEmail('');
    setPassword('');
    setGamerTag('');
    setErrorMsg(null);
    setResetSuccessMsg(null);
    setSignUpStep('credentials');
    setShowPassword(false);

    if (emailInputRef.current) emailInputRef.current.value = '';
    if (passwordInputRef.current) passwordInputRef.current.value = '';
    if (recoveryEmailInputRef.current) recoveryEmailInputRef.current.value = '';

    // Clear again after short timeouts to defeat browsers that attempt delayed autofill upon modal render
    const t1 = setTimeout(() => {
      setEmail('');
      setPassword('');
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
    }, 40);

    const t2 = setTimeout(() => {
      setEmail('');
      setPassword('');
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
    }, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, user, mode]);

  const handleModalClose = () => {
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setResetSuccessMsg(null);
    if (emailInputRef.current) emailInputRef.current.value = '';
    if (passwordInputRef.current) passwordInputRef.current.value = '';
    onClose();
  };

  // Escape key listener to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle password reset email request
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setResetSuccessMsg(`Password reset email dispatched to ${cleanEmail}`);
      playSquadJoinSound();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('No account found matching this email address.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email format.');
      } else {
        setErrorMsg(err.message || 'Unable to send password reset email. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle credentials submit (Step 1 -> Step 2)
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      const cleanEmail = email.trim().toLowerCase();
      if (!gamerTag.trim()) {
        setErrorMsg('Please enter a Gamer Tag');
        return;
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }

      // Enforce strict uniqueness: verify email is not already registered to an account
      setIsSubmitting(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setErrorMsg('This email is already in use by another account. You can only use one email for one account. Please sign in instead.');
          setIsSubmitting(false);
          return;
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('already in use')) {
          setErrorMsg(checkErr.message);
          setIsSubmitting(false);
          return;
        }
      }
      setIsSubmitting(false);

      // Valid credentials & unique email! Transition to choose warrior step!
      playSketchClick();
      setSignUpStep('warrior');
    } else {
      // Sign In mode
      setIsSubmitting(true);
      try {
        await signInWithEmail(email, password);
        setEmail('');
        setPassword('');
        setGamerTag('');
        onClose();
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
          setErrorMsg('Invalid email or password. If you forgot your password or are new, use the links below.');
        } else if (code === 'auth/invalid-email') {
          setErrorMsg('Please enter a valid email address.');
        } else if (code === 'auth/too-many-requests') {
          setErrorMsg('Too many failed attempts. You can reset your password below to regain access.');
        } else {
          setErrorMsg(err.message || 'Authentication failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle final signup with warrior choice (Step 2 -> Edit Profile)
  const handleFinalSignUp = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await signUpWithEmail(
        email,
        password,
        gamerTag,
        favoriteGame,
        role,
        selectedWarrior
      );
      playSquadJoinSound();
      setEmail('');
      setPassword('');
      setGamerTag('');
      onClose();
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use' || err.message?.includes('already in use') || err.message?.includes('already exists')) {
        setErrorMsg('This email address is already registered to another account. You can only use one email for one account. Please sign in instead.');
        setSignUpStep('credentials');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters.');
        setSignUpStep('credentials');
      } else {
        setErrorMsg(err.message || 'Account creation failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      if (mode === 'signup') {
        // Transition to warrior choice for new Google users
        setSignUpStep('warrior');
      } else {
        onClose();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google sign up warrior confirm
  const handleGoogleWarriorConfirm = async () => {
    setIsSubmitting(true);
    try {
      await updateGamerProfile({ characterAvatar: selectedWarrior });
      playSquadJoinSound();
      onClose();
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (err) {
      console.warn('Google warrior save note:', err);
      onClose();
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          signUpStep === 'warrior' ? 'max-w-4xl' : 'max-w-md'
        } bg-[#030904] text-slate-100 p-6 sm:p-7 relative border transition-all duration-300 my-auto cursor-default`}
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor: '#22c55e',
          boxShadow: '0 0 35px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.08)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-green-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              {mode === 'signup'
                ? signUpStep === 'warrior'
                ? 'Choose Your Warrior Character'
                : 'Create Gamer Account'
                : mode === 'forgot'
                ? 'Password Recovery'
                : 'Sign In to LobbyBazaar'}
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
            title="Close [Esc]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Tab switcher: Sign Up vs Sign In (Only visible during credentials step and when not recovering password) */}
        {signUpStep === 'credentials' && mode !== 'forgot' && (
          <div
            className="flex items-center bg-[#010502] border border-green-500/30 p-1 mb-5 rounded"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                setMode('signup');
                setErrorMsg(null);
                setResetSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-display tracking-wider cursor-pointer rounded transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-green-500/20 text-green-200 font-bold border border-green-400/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                setMode('signin');
                setErrorMsg(null);
                setResetSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-display tracking-wider cursor-pointer rounded transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-green-500/20 text-green-200 font-bold border border-green-400/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-950/70 border border-red-500/70 text-red-200 text-xs font-sketch flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {mode === 'signin' && (
              <div className="flex items-center gap-3 pt-1 border-t border-red-500/30 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setMode('forgot');
                    setErrorMsg(null);
                    setResetSuccessMsg(null);
                  }}
                  className="text-lime-300 hover:text-white underline cursor-pointer"
                >
                  Forgot password?
                </button>
                <span className="text-slate-500">·</span>
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-lime-300 hover:text-white underline cursor-pointer"
                >
                  Create new account
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: CREDENTIALS FORM OR PASSWORD RECOVERY */}
        {mode === 'forgot' ? (
          /* PASSWORD RECOVERY VIEW */
          <div className="space-y-4">
            {resetSuccessMsg ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-lime-950/70 border-2 border-lime-400 rounded text-lime-200 text-xs font-sketch flex flex-col gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                  <div className="flex items-center gap-2 font-bold text-sm text-lime-300">
                    <Check className="w-4 h-4 text-lime-400" />
                    <span>Password Reset Email Sent!</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    We dispatched a secure password reset link to <strong className="text-white underline">{email}</strong>.
                  </p>
                </div>

                {/* Explicit reminder to check spam box */}
                <div className="p-3.5 bg-amber-950/80 border-2 border-amber-400/90 rounded text-xs font-sketch text-amber-200 flex flex-col gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    <span>⚠️ Important: Check Your Spam / Junk Folder!</span>
                  </div>
                  <p className="text-amber-100 leading-relaxed">
                    Password recovery emails often land in your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. If you do not see the email within 1-2 minutes, please be sure to check your spam box!
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setMode('signin');
                      setResetSuccessMsg(null);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2.5 text-xs font-bold font-display tracking-wider text-green-100 bg-green-950 hover:bg-green-900 border border-green-400 rounded cursor-pointer transition-colors shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center justify-center gap-1.5"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordRecovery} className="space-y-3.5">
                <p className="text-xs font-sketch text-slate-300 leading-relaxed">
                  Lost access to your tactical credentials? Enter your account email below and we'll dispatch a password reset link directly to your inbox.
                </p>

                {/* Pre-emptive spam folder alert */}
                <div className="p-2.5 bg-[#0a140a] border border-lime-500/40 rounded text-[11px] font-sketch text-lime-300/90 flex items-start gap-2">
                  <span className="text-sm">📧</span>
                  <span>
                    A password reset link will be sent to your email. Remember to <strong>check your Spam / Junk folder</strong> if you don't see it right away!
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-sketch text-slate-300 mb-1">Account Email *</label>
                  <input
                    ref={recoveryEmailInputRef}
                    type="email"
                    name="squadup_recovery_email"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="gamer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 placeholder-slate-600"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className="py-2.5 px-4 text-xs font-sketch text-slate-400 hover:text-white border border-green-900/60 rounded cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/80 hover:bg-green-800 border border-green-400 rounded cursor-pointer transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-1.5"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    <span>{isSubmitting ? 'Dispatching Link...' : 'Send Password Reset Email'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : signUpStep === 'credentials' ? (
          <div>
            {/* Quick Google Login */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 mb-4 text-xs font-display font-bold tracking-wider text-slate-100 bg-[#061408] hover:bg-[#0c240f] border border-green-500/50 rounded cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.25)]"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign Up with Google' : 'Sign In with Google'}</span>
            </button>

            <div className="flex items-center my-3 text-xs text-slate-500 font-sketch">
              <div className="flex-1 border-t border-green-500/20" />
              <span className="px-3">or continue with email</span>
              <div className="flex-1 border-t border-green-500/20" />
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmitCredentials} className="space-y-3" autoComplete="off">
              {/* Anti-autofill hidden decoys to prevent aggressive browser credential managers from auto-populating saved passwords */}
              <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-sketch text-slate-300 mb-1">
                    Gamer Tag (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. Phoenix#NA1, ShadowSniper"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 placeholder-slate-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1">Email *</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  name="squadup_login_email"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  placeholder="gamer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 placeholder-slate-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sketch text-slate-300">Password *</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        playSketchClick();
                        setMode('forgot');
                        setErrorMsg(null);
                        setResetSuccessMsg(null);
                      }}
                      className="text-[11px] font-sketch text-lime-400 hover:text-lime-200 underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    name="squadup_login_pass"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 placeholder-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setShowPassword(!showPassword);
                    }}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/70 hover:bg-green-800/90 border border-green-400 rounded cursor-pointer transition-colors shadow-[0_0_15px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <span>
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'signup'
                      ? 'Complete & Choose Warrior'
                      : 'Sign In to Squad'}
                  </span>
                  {mode === 'signup' && !isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Automatic Sign-Out Security Reassurance */}
              <div className="pt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/80 font-sketch text-center">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Auto sign-out active: accounts sign out automatically when you close the web app</span>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: CHOOSE GIRL WARRIOR OR BOY WARRIOR */
          <div className="space-y-4">
            <div className="text-center pb-2">
              <span className="text-[10px] font-mono-num font-bold tracking-widest text-lime-400 uppercase bg-lime-950/80 px-2.5 py-0.5 rounded border border-lime-400/50 inline-block mb-1.5">
                STEP 2 OF 2 · 3D CHARACTER SELECTION
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                Choose Your Tactical Warrior
              </h3>
              <p className="text-xs font-sketch text-slate-300 mt-0.5">
                Choose from <strong className="text-pink-300">Girl Warrior</strong>,{' '}
                <strong className="text-sky-300">Boy Warrior</strong>,{' '}
                <strong className="text-orange-400">Pumpkin Monster</strong>,{' '}
                <strong className="text-pink-400">Girly Pumpkin</strong>, or Horror icons{' '}
                <strong className="text-amber-400">Jason</strong>,{' '}
                <strong className="text-indigo-300">Ghostface</strong>,{' '}
                <strong className="text-blue-300">Michael Myers</strong>, and{' '}
                <strong className="text-red-400">Freddy Krueger</strong>.
                Next, you will be sent directly to your profile.
              </p>
            </div>

            {/* Warrior Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Option 1: Girl Warrior */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('waving');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'waving'
                    ? 'border-2 border-lime-400 bg-gradient-to-b from-[#0e2a14] to-[#041207] shadow-[0_0_30px_rgba(163,230,53,0.55)] scale-[1.02]'
                    : 'border-2 border-green-500/30 bg-[#020803] hover:border-lime-500/60 hover:bg-[#051408]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {/* Active Selection Badge */}
                {selectedWarrior === 'waving' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-lime-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#a3e635]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>SELECTED</span>
                  </div>
                )}

                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-pink-300 bg-pink-950/60 border border-pink-400/40 rounded">
                  CYBER VALKYRIE
                </div>

                {/* 3D Character Preview */}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="waving"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Valkyrie'}
                    isLive={selectedWarrior === 'waving'}
                    speechText="READY!"
                  />
                </div>

                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Girl Warrior
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Armored cyber suit with visor optics, magenta combat trim & wave emote.
                </p>

                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'waving'
                      ? 'bg-lime-400 text-black shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-green-950/80 text-green-300 border border-green-500/40 hover:bg-green-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'waving' ? '✓ Girl Warrior' : 'Select Girl'}
                </div>
              </div>

              {/* Option 2: Boy Warrior */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('classic');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'classic'
                    ? 'border-2 border-lime-400 bg-gradient-to-b from-[#0e2a14] to-[#041207] shadow-[0_0_30px_rgba(163,230,53,0.55)] scale-[1.02]'
                    : 'border-2 border-green-500/30 bg-[#020803] hover:border-lime-500/60 hover:bg-[#051408]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {/* Active Selection Badge */}
                {selectedWarrior === 'classic' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-lime-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#a3e635]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>SELECTED</span>
                  </div>
                )}

                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-sky-300 bg-sky-950/60 border border-sky-400/40 rounded">
                  SCOUT VANGUARD
                </div>

                {/* 3D Character Preview */}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="classic"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Scout'}
                    isLive={selectedWarrior === 'classic'}
                  />
                </div>

                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Boy Warrior
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Red tactical scout cap, cobalt battle tunic, and ready combat stance.
                </p>

                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'classic'
                      ? 'bg-lime-400 text-black shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-green-950/80 text-green-300 border border-green-500/40 hover:bg-green-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'classic' ? '✓ Boy Warrior' : 'Select Boy'}
                </div>
              </div>

              {/* Option 3: Pumpkin Monster */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('pumpkin');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'pumpkin'
                    ? 'border-2 border-orange-400 bg-gradient-to-b from-[#2a1304] to-[#120704] shadow-[0_0_30px_rgba(251,146,60,0.55)] scale-[1.02]'
                    : 'border-2 border-orange-500/30 bg-[#080402] hover:border-orange-500/60 hover:bg-[#140a05]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {/* Active Selection Badge */}
                {selectedWarrior === 'pumpkin' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-orange-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fb923c]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>SELECTED</span>
                  </div>
                )}

                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-orange-300 bg-orange-950/60 border border-orange-400/40 rounded">
                  PUMPKIN DREAD
                </div>

                {/* 3D Character Preview */}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="pumpkin"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Monster'}
                    isLive={selectedWarrior === 'pumpkin'}
                    speechText="BOO!"
                  />
                </div>

                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Pumpkin Monster
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Glowing Jack-O'-Lantern head, sharp claw hands, torn coat & floating embers.
                </p>

                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'pumpkin'
                      ? 'bg-orange-400 text-black shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                      : 'bg-orange-950/80 text-orange-300 border border-orange-500/40 hover:bg-orange-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'pumpkin' ? '✓ Pumpkin Monster' : 'Select Pumpkin'}
                </div>
              </div>

              {/* Option 4: Girly Pumpkin */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('girly_pumpkin');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'girly_pumpkin'
                    ? 'border-2 border-pink-400 bg-gradient-to-b from-[#2e0e24] to-[#12040e] shadow-[0_0_30px_rgba(244,114,182,0.55)] scale-[1.02]'
                    : 'border-2 border-pink-500/30 bg-[#090206] hover:border-pink-500/60 hover:bg-[#150510]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {/* Active Selection Badge */}
                {selectedWarrior === 'girly_pumpkin' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>SELECTED</span>
                  </div>
                )}

                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-pink-300 bg-pink-950/60 border border-pink-400/40 rounded">
                  SWEET PUMPKIN
                </div>

                {/* 3D Character Preview */}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="girly_pumpkin"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Princess'}
                    isLive={selectedWarrior === 'girly_pumpkin'}
                    speechText="CUTE!"
                  />
                </div>

                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Girly Pumpkin
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Glowing heart-carved eyes, cute ribbon bow, pink corseted dress & floating sparkles.
                </p>

                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'girly_pumpkin'
                      ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                      : 'bg-pink-950/80 text-pink-300 border border-pink-500/40 hover:bg-pink-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'girly_pumpkin' ? '✓ Girly Pumpkin' : 'Select Girly Pumpkin'}
                </div>
              </div>

              {/* Card 5: Jason Voorhees */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('jason');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'jason'
                    ? 'border-2 border-red-500 bg-gradient-to-b from-[#2a0e0e] to-[#120404] shadow-[0_0_30px_rgba(239,68,68,0.55)] scale-[1.02]'
                    : 'border-2 border-red-500/30 bg-[#080202] hover:border-red-500/60 hover:bg-[#140505]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'jason' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#ef4444]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-red-300 bg-red-950/60 border border-red-500/40 rounded">
                  CRYSTAL LAKE SLASHER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="jason"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Jason'}
                    isLive={selectedWarrior === 'jason'}
                    speechText="KI-KI-KI!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Jason Voorhees
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Iconic hockey mask, olive work jacket, bloody machete & campfire embers.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'jason'
                      ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                      : 'bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'jason' ? '✓ Jason' : 'Select Jason'}
                </div>
              </div>

              {/* Card 6: Ghostface */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('ghostface');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'ghostface'
                    ? 'border-2 border-slate-300 bg-gradient-to-b from-[#1c2230] to-[#090b10] shadow-[0_0_30px_rgba(203,213,225,0.45)] scale-[1.02]'
                    : 'border-2 border-slate-700/50 bg-[#06080e] hover:border-slate-500 hover:bg-[#0c1018]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'ghostface' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-200 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#e2e8f0]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-slate-300 bg-slate-900/80 border border-slate-600/50 rounded">
                  WOODSBORO STALKER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="ghostface"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Ghostface'}
                    isLive={selectedWarrior === 'ghostface'}
                    speechText="SCARY!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Ghostface
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Screaming mask, pointed cowl hood, hanging streamers & Buck 120 knife.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'ghostface'
                      ? 'bg-slate-200 text-black shadow-[0_0_12px_rgba(241,245,249,0.6)]'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'ghostface' ? '✓ Ghostface' : 'Select Ghostface'}
                </div>
              </div>

              {/* Card 7: Michael Myers */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('michael_myers');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'michael_myers'
                    ? 'border-2 border-indigo-400 bg-gradient-to-b from-[#141d2e] to-[#070b14] shadow-[0_0_30px_rgba(129,140,248,0.55)] scale-[1.02]'
                    : 'border-2 border-indigo-900/50 bg-[#050810] hover:border-indigo-500/60 hover:bg-[#090e1c]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'michael_myers' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-indigo-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#818cf8]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-400/40 rounded">
                  HADDONFIELD BOOGEYMAN
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="michael_myers"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Myers'}
                    isLive={selectedWarrior === 'michael_myers'}
                    speechText="..."
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Michael Myers
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Bleached pale mask, dark hollow eyes, navy mechanic suit & butcher knife.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'michael_myers'
                      ? 'bg-indigo-400 text-black shadow-[0_0_12px_rgba(129,140,248,0.6)]'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'michael_myers' ? '✓ Michael Myers' : 'Select Michael Myers'}
                </div>
              </div>

              {/* Card 8: Freddy Krueger */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('freddy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'freddy'
                    ? 'border-2 border-red-600 bg-gradient-to-b from-[#2e0a0a] to-[#0f0404] shadow-[0_0_30px_rgba(220,38,38,0.55)] scale-[1.02]'
                    : 'border-2 border-red-900/50 bg-[#080202] hover:border-red-600/60 hover:bg-[#140505]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'freddy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-600 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#dc2626]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-red-300 bg-red-950/80 border border-red-600/50 rounded">
                  SPRINGWOOD SLASHER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="freddy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Freddy'}
                    isLive={selectedWarrior === 'freddy'}
                    speechText="DREAM!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Freddy Krueger
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Brown fedora hat, red & dark green striped sweater, burned skin & razor-claw glove.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'freddy'
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]'
                      : 'bg-red-950/80 text-red-300 border border-red-800/50 hover:bg-red-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'freddy' ? '✓ Freddy Krueger' : 'Select Freddy'}
                </div>
              </div>

              {/* Card 9: Cyber Soccer Girl & Akita Inu */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('cyber_soccer_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'cyber_soccer_girl'
                    ? 'border-2 border-pink-400 bg-gradient-to-b from-[#2a0f2e] to-[#0d0412] shadow-[0_0_30px_rgba(236,72,153,0.55)] scale-[1.02]'
                    : 'border-2 border-pink-900/50 bg-[#0c0410] hover:border-pink-500/60 hover:bg-[#160820]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'cyber_soccer_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="cyber_soccer_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Striker'}
                    isLive={selectedWarrior === 'cyber_soccer_girl'}
                    speechText="GOAL!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cyber Soccer Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-pink-950/80 border border-pink-500/40 text-pink-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + AKITA
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Blue cyber skin, pink twin tails, purple jersey dress, glowing cyber tattoos & Akita Inu on leash.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'cyber_soccer_girl'
                      ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                      : 'bg-pink-950/80 text-pink-300 border border-pink-800/50 hover:bg-pink-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'cyber_soccer_girl' ? '✓ Cyber Soccer Girl' : 'Select Soccer Girl'}
                </div>
              </div>

              {/* Card 10: Cyber Soccer Player & Shiba Inu */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('cyber_soccer_boy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'cyber_soccer_boy'
                    ? 'border-2 border-emerald-400 bg-gradient-to-b from-[#0a2618] to-[#040e09] shadow-[0_0_30px_rgba(16,185,129,0.55)] scale-[1.02]'
                    : 'border-2 border-emerald-900/50 bg-[#030d07] hover:border-emerald-500/60 hover:bg-[#071a10]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'cyber_soccer_boy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#34d399]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="cyber_soccer_boy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Player 10'}
                    isLive={selectedWarrior === 'cyber_soccer_boy'}
                    speechText="STRIKE!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cyber Soccer Player
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + SHIBA
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Red cyber skin, green striker jersey, spiky hair, soccer boots & tan/cream Shiba Inu on leash.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'cyber_soccer_boy'
                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'cyber_soccer_boy' ? '✓ Soccer Player' : 'Select Soccer Player'}
                </div>
              </div>

              {/* Card 11: Lavender Anime Girl & Gray Cat */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('purple_anime_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'purple_anime_girl'
                    ? 'border-2 border-purple-400 bg-gradient-to-b from-[#241038] to-[#0c0514] shadow-[0_0_30px_rgba(168,85,247,0.55)] scale-[1.02]'
                    : 'border-2 border-purple-900/50 bg-[#090310] hover:border-purple-500/60 hover:bg-[#150722]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'purple_anime_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-purple-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#c084fc]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="purple_anime_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Neko'}
                    isLive={selectedWarrior === 'purple_anime_girl'}
                    speechText="MEOW!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Lavender Anime Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + CAT
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Pastel purple skin, violet dress with golden gem, waving hello & playful gray cat.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'purple_anime_girl'
                      ? 'bg-purple-400 text-black shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                      : 'bg-purple-950/80 text-purple-300 border border-purple-800/50 hover:bg-purple-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'purple_anime_girl' ? '✓ Lavender Anime Girl' : 'Select Lavender Girl'}
                </div>
              </div>

              {/* Card 12: Anime Traveler & Blue Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('mexican_traveler');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'mexican_traveler'
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-[#2e1d0a] to-[#120b04] shadow-[0_0_30px_rgba(245,158,11,0.55)] scale-[1.02]'
                    : 'border-2 border-amber-900/50 bg-[#0e0702] hover:border-amber-500/60 hover:bg-[#1c0f05]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'mexican_traveler' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fbbf24]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="mexican_traveler"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Amigo'}
                    isLive={selectedWarrior === 'mexican_traveler'}
                    speechText="HOLA!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Traveler
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + DOG
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Traditional sombrero, multi-colored serape poncho stripes & loyal blue dog.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'mexican_traveler'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/50 hover:bg-amber-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'mexican_traveler' ? '✓ Traveler' : 'Select Traveler'}
                </div>
              </div>

              {/* Card 13: Cool Alien Girl & Alien Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('alien_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'alien_girl'
                    ? 'border-2 border-rose-400 bg-gradient-to-b from-[#240a24] to-[#08020b] shadow-[0_0_30px_rgba(244,63,94,0.55)] scale-[1.02]'
                    : 'border-2 border-rose-900/50 bg-[#0b030b] hover:border-rose-500/60 hover:bg-[#1a071a]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'alien_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-rose-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fb7185]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="alien_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Stella'}
                    isLive={selectedWarrior === 'alien_girl'}
                    speechText="PEACE!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cool Alien Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold rounded-full">
                  COSMIC + PUPPY
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Lavender alien skin, star antennae, bouncy pigtails, glowing heart core & antenna puppy.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'alien_girl'
                      ? 'bg-rose-400 text-black shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/50 hover:bg-rose-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'alien_girl' ? '✓ Alien Girl' : 'Select Alien Girl'}
                </div>
              </div>

              {/* Card 14: Cool Alien Boy & Alien Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setSelectedWarrior('alien_boy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedWarrior === 'alien_boy'
                    ? 'border-2 border-cyan-400 bg-gradient-to-b from-[#061e24] to-[#020a0d] shadow-[0_0_30px_rgba(6,182,212,0.55)] scale-[1.02]'
                    : 'border-2 border-cyan-900/50 bg-[#02090c] hover:border-cyan-500/60 hover:bg-[#05171e]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {selectedWarrior === 'alien_boy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-cyan-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#22d3ee]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-center py-1">
                  <BlockyCharacter3D
                    variant="alien_boy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Cosmo'}
                    isLive={selectedWarrior === 'alien_boy'}
                    speechText="COSMIC!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cool Alien Boy
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold rounded-full">
                  COSMIC + PUPPY
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Green alien skin, dark space suit with cyan glowing core & antenna alien dog.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    selectedWarrior === 'alien_boy'
                      ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {selectedWarrior === 'alien_boy' ? '✓ Alien Boy' : 'Select Alien Boy'}
                </div>
              </div>

              {/* Card 15: Moon Demon Noble & Floating Blade */}
              {(() => {
                const unlocked = isCharUnlocked('moon_demon_noble');
                const isSelected = selectedWarrior === 'moon_demon_noble';
                const isBusy = unlockingWarrior === 'moon_demon_noble';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setSelectedWarrior('moon_demon_noble');
                      } else {
                        handleUnlockWarrior('moon_demon_noble', 'Moon Demon Noble');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-purple-400 bg-gradient-to-b from-[#250d3a] to-[#0d0317] shadow-[0_0_30px_rgba(168,85,247,0.6)] scale-[1.02]'
                        : 'border-2 border-purple-900/50 bg-[#0d0317] hover:border-purple-500/60 hover:bg-[#1a082b]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-purple-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#c084fc]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="w-full flex items-center justify-center py-1">
                      <BlockyCharacter3D
                        variant="moon_demon_noble"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Noble'}
                        isLive={isSelected}
                        speechText=""
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Moon Demon Noble
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold rounded-full">
                      B&W NOBLE + GLOWING BLADE
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, silver hair, crescent crest, fur mokomoko & glowing color-shifting Bakusaiga blade.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                        isSelected
                          ? 'bg-purple-400 text-black shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                          : unlocked
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50 hover:bg-purple-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Select Moon Demon Noble'
                      ) : isBusy ? (
                        'Connecting to Stripe...'
                      ) : (
                        'Unlock for $3.00'
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 16: Demon Dog Warrior & Tessaiga Blade */}
              {(() => {
                const unlocked = isCharUnlocked('demon_dog_warrior');
                const isSelected = selectedWarrior === 'demon_dog_warrior';
                const isBusy = unlockingWarrior === 'demon_dog_warrior';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setSelectedWarrior('demon_dog_warrior');
                      } else {
                        handleUnlockWarrior('demon_dog_warrior', 'Demon Dog Warrior');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-red-500 bg-gradient-to-b from-[#380b0b] to-[#120303] shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-[1.02]'
                        : 'border-2 border-red-950/60 bg-[#120303] hover:border-red-500/60 hover:bg-[#200606]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#ef4444]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="w-full flex items-center justify-center py-1">
                      <BlockyCharacter3D
                        variant="demon_dog_warrior"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Warrior'}
                        isLive={isSelected}
                        speechText=""
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Demon Dog Warrior
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold rounded-full">
                      B&W WARRIOR + GLOWING ORB
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, dog ears, flowing silver hair, charcoal kimono & floating glowing Shikon Jewel.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                        isSelected
                          ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                          : unlocked
                          ? 'bg-red-950/80 text-red-300 border border-red-800/50 hover:bg-red-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Select Demon Dog Warrior'
                      ) : isBusy ? (
                        'Connecting to Stripe...'
                      ) : (
                        'Unlock for $3.00'
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 17: Celestial Moon Guardian & Moon Stick */}
              {(() => {
                const unlocked = isCharUnlocked('celestial_moon_guardian');
                const isSelected = selectedWarrior === 'celestial_moon_guardian';
                const isBusy = unlockingWarrior === 'celestial_moon_guardian';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setSelectedWarrior('celestial_moon_guardian');
                      } else {
                        handleUnlockWarrior('celestial_moon_guardian', 'Celestial Moon Guardian');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-pink-400 bg-gradient-to-b from-[#350d24] to-[#14030d] shadow-[0_0_30px_rgba(244,114,182,0.6)] scale-[1.02]'
                        : 'border-2 border-pink-950/60 bg-[#14030d] hover:border-pink-500/60 hover:bg-[#240618]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="w-full flex items-center justify-center py-1">
                      <BlockyCharacter3D
                        variant="celestial_moon_guardian"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Usagi'}
                        isLive={isSelected}
                        speechText=""
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Celestial Moon Guardian
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-pink-950/80 border border-pink-500/40 text-pink-300 text-[10px] font-mono font-bold rounded-full">
                      B&W GUARDIAN + GLOWING WAND
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, silver twin odangos, charcoal sailor fuku & floating glowing Cosmic Moon Stick.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                        isSelected
                          ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                          : unlocked
                          ? 'bg-pink-950/80 text-pink-300 border border-pink-800/50 hover:bg-purple-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Select Moon Guardian'
                      ) : isBusy ? (
                        'Connecting to Stripe...'
                      ) : (
                        'Unlock for $3.00'
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 18: Sacred Shrine Priestess & Sacred Bow */}
              {(() => {
                const unlocked = isCharUnlocked('sacred_shrine_priestess');
                const isSelected = selectedWarrior === 'sacred_shrine_priestess';
                const isBusy = unlockingWarrior === 'sacred_shrine_priestess';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setSelectedWarrior('sacred_shrine_priestess');
                      } else {
                        handleUnlockWarrior('sacred_shrine_priestess', 'Sacred Shrine Priestess');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-emerald-400 bg-gradient-to-b from-[#09291b] to-[#030e09] shadow-[0_0_30px_rgba(52,211,153,0.6)] scale-[1.02]'
                        : 'border-2 border-emerald-950/60 bg-[#030e09] hover:border-emerald-500/60 hover:bg-[#071f14]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#34d399]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="w-full flex items-center justify-center py-1">
                      <BlockyCharacter3D
                        variant="sacred_shrine_priestess"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Miko'}
                        isLive={isSelected}
                        speechText=""
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Sacred Shrine Priestess
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-full">
                      B&W PRIESTESS + GLOWING ARROW
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, flowing white hair, charcoal miko robes & floating glowing sacred arrow.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                        isSelected
                          ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                          : unlocked
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Select Shrine Priestess'
                      ) : isBusy ? (
                        'Connecting to Stripe...'
                      ) : (
                        'Unlock for $3.00'
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Actions: Confirm & Back */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={email ? handleFinalSignUp : handleGoogleWarriorConfirm}
                disabled={isSubmitting}
                className="w-full py-3 text-xs sm:text-sm font-bold font-display tracking-wider text-black bg-lime-400 hover:bg-lime-300 border-2 border-lime-300 rounded cursor-pointer transition-all shadow-[0_0_20px_rgba(163,230,53,0.6)] hover:scale-[1.01] flex items-center justify-center gap-2"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>
                  {isSubmitting
                    ? 'Finalizing Profile & Deploying...'
                    : `Confirm ${
                        selectedWarrior === 'waving'
                          ? 'Girl Warrior'
                          : selectedWarrior === 'classic'
                          ? 'Boy Warrior'
                          : selectedWarrior === 'pumpkin'
                          ? 'Pumpkin Monster'
                          : selectedWarrior === 'girly_pumpkin'
                          ? 'Girly Pumpkin'
                          : selectedWarrior === 'jason'
                          ? 'Jason Voorhees'
                          : selectedWarrior === 'ghostface'
                          ? 'Ghostface'
                          : selectedWarrior === 'michael_myers'
                          ? 'Michael Myers'
                          : selectedWarrior === 'freddy'
                          ? 'Freddy Krueger'
                          : selectedWarrior === 'cyber_soccer_girl'
                          ? 'Cyber Soccer Girl'
                          : selectedWarrior === 'cyber_soccer_boy'
                          ? 'Cyber Soccer Player'
                          : selectedWarrior === 'purple_anime_girl'
                          ? 'Lavender Anime Girl'
                          : selectedWarrior === 'mexican_traveler'
                          ? 'Traveler'
                          : selectedWarrior === 'alien_girl'
                          ? 'Cool Alien Girl'
                          : selectedWarrior === 'alien_boy'
                          ? 'Cool Alien Boy'
                          : selectedWarrior === 'moon_demon_noble'
                          ? 'Moon Demon Noble'
                          : selectedWarrior === 'demon_dog_warrior'
                          ? 'Demon Dog Warrior'
                          : selectedWarrior === 'celestial_moon_guardian'
                          ? 'Celestial Moon Guardian'
                          : 'Sacred Shrine Priestess'
                      } & Go to Edit Profile`}
                </span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              {email && (
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setSignUpStep('credentials');
                  }}
                  className="w-full py-1 text-xs text-slate-400 hover:text-white font-sketch flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to change Gamer Tag / Email</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
