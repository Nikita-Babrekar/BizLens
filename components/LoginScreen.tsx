'use client';

import React, { useState } from 'react';
import { BrainCircuit, Sparkles, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, signOutUser, loading, authError, setAuthError } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetStorage = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      await signOutUser();
      setResetMessage('Session and local storage cleared.');
      setTimeout(() => setResetMessage(null), 3000);
    } catch {
      setResetMessage('Cleared.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f8fafc] dark:bg-[#0b0f19] text-[#0f172a] dark:text-white selection:bg-[#315efb] selection:text-white transition-colors">
      {/* Soft Ambient Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(49,94,251,0.06)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-96 rounded-full bg-[#315efb]/5 blur-3xl pointer-events-none" />

      {/* Main Centered Minimalist Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="overflow-hidden rounded-3xl border border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] transition-all">
          
          {/* Brand Emblem */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex items-center justify-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#315efb] to-[#4f46e5] text-white shadow-lg shadow-[#315efb]/25 ring-4 ring-[#315efb]/10">
                <BrainCircuit size={28} />
              </div>
              <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-[#10b981] text-[10px] text-white ring-2 ring-white dark:ring-[#111827]">
                <Sparkles size={11} />
              </span>
            </div>

            {/* Standard Headings */}
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white">
              Welcome to BizLens
            </h1>
            <p className="mt-2 text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
              Sign in or sign up using your Google account
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mt-6 rounded-xl border border-[#fecaca] dark:border-[#7f1d1d] bg-[#fef2f2] dark:bg-[#450a0a]/60 p-3.5 text-xs text-[#991b1b] dark:text-[#fca5a5] flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#dc2626]" />
              <div className="flex-1 leading-relaxed">
                <span>{authError}</span>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => signInWithGoogle(true)}
                    className="font-semibold underline hover:no-underline text-[#315efb] dark:text-[#82a3ff]"
                  >
                    Continue with Test Google Account →
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="font-semibold text-[#64748b] dark:text-[#94a3b8] hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Notice */}
          {resetMessage && (
            <div className="mt-4 rounded-xl border border-[#bbf7d0] dark:border-[#14532d] bg-[#f0fdf4] dark:bg-[#14532d]/40 p-2.5 text-center text-xs text-[#166534] dark:text-[#86efac]">
              {resetMessage}
            </div>
          )}

          {/* Standard Clean Google Action Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3.5 rounded-2xl border border-[#dadce0] dark:border-[#374151] bg-white dark:bg-[#1e2937] hover:bg-[#f8fafc] dark:hover:bg-[#283548] hover:border-[#cbd5e1] dark:hover:border-[#4b5563] px-5 py-3.5 text-sm font-semibold text-[#1e293b] dark:text-white shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait cursor-pointer"
            >
              {/* Official Google 4-Color Logo */}
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>

              <span>
                {loading ? 'Opening Google Account Chooser...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          {/* Security & Authentication Info */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[#64748b] dark:text-[#94a3b8]">
            <ShieldCheck size={14} className="text-[#10b981]" />
            <span>Secured with Firebase Google OAuth 2.0</span>
          </div>

          {/* Test & Sign-Out Reset Utility */}
          <div className="mt-6 pt-5 border-t border-[#f1f5f9] dark:border-[#1f2937] flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleResetStorage}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#94a3b8] hover:text-[#64748b] dark:hover:text-[#cbd5e1] transition cursor-pointer"
              title="Clear all stored test sessions, shop keys, and reset auth"
            >
              <RefreshCw size={11} className={resetting ? 'animate-spin' : ''} />
              <span>Reset test session & local storage</span>
            </button>
          </div>
        </div>

        {/* Footer Brand Copyright */}
        <p className="mt-6 text-center text-xs text-[#94a3b8] dark:text-[#64748b]">
          © {new Date().getFullYear()} BizLens Inc. Built for modern business intelligence.
        </p>
      </div>
    </div>
  );
}
