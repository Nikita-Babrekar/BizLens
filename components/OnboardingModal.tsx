'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Store, Sparkles, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SHOP_SUGGESTIONS = [
  'Mumbai Coffee Roasters',
  'Artisan Bakery & Cafe',
  'Apex Electronics & Gadgets',
  'Urban Apparel Co.',
  'Metro Supermart',
  'Green Leaf Organics',
];

export default function OnboardingModal() {
  const { user, showOnboardingModal, completeOnboarding } = useAuth();
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOnboardingModal) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showOnboardingModal]);

  if (!showOnboardingModal) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) {
      setError('Please enter a name for your shop or business.');
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length < 2) {
      setError('Shop name must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTimeout(() => {
      completeOnboarding(trimmed);
      setIsSubmitting(false);
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputName(suggestion);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#315efb] via-[#6366f1] to-[#10b981]" />

        <div className="p-6 md:p-8">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-12 place-items-center rounded-xl bg-[#315efb]/10 text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
              <Store size={26} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#315efb] dark:text-[#82a3ff]">
                <Sparkles size={13} />
                <span>Quick Onboarding</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#0f172a] dark:text-white">
                Name your business workspace
              </h2>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8] mb-6">
            Welcome, <span className="font-semibold text-[#0f172a] dark:text-white">{user?.displayName || 'Partner'}</span>!
            Enter your custom shop name to personalize your executive KPIs, AI Copilot context, and report downloads.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="shop-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94a3b8] mb-2"
              >
                Shop / Business Name
              </label>
              <div className="relative">
                <input
                  id="shop-name-input"
                  ref={inputRef}
                  type="text"
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Mumbai Coffee Roasters, Apex Retail..."
                  maxLength={50}
                  className={`w-full rounded-xl border px-4 py-3.5 text-sm font-medium outline-none transition placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b] ${
                    error
                      ? 'border-[#ef4444] bg-[#fef2f2] text-[#991b1b] focus:ring-2 focus:ring-[#ef4444]/30'
                      : 'border-[#cbd5e1] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#1e293b] text-[#0f172a] dark:text-white focus:border-[#315efb] focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#315efb]/20'
                  }`}
                />
                {inputName.trim().length >= 2 && (
                  <CheckCircle2
                    size={18}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#10b981]"
                  />
                )}
              </div>
              {error && (
                <p className="mt-1.5 text-xs font-medium text-[#ef4444] flex items-center gap-1">
                  <span>•</span> {error}
                </p>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-[#94a3b8] mb-2 flex items-center gap-1.5">
                <Building2 size={13} /> Or choose a quick template:
              </p>
              <div className="flex flex-wrap gap-2">
                {SHOP_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition border ${
                      inputName === suggestion
                        ? 'border-[#315efb] bg-[#315efb]/10 text-[#315efb] dark:text-[#82a3ff]'
                        : 'border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#475569] dark:text-[#cbd5e1] hover:border-[#cbd5e1] dark:hover:border-[#475569]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !inputName.trim()}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] hover:bg-[#254edb] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#315efb]/25 transition active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span>Setting up your workspace...</span>
                ) : (
                  <>
                    <span>Launch Workspace & Dashboard</span>
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
