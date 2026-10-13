'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Upload, LayoutDashboard } from 'lucide-react';
import DynamicOverview from '@/components/DynamicOverview';

export default function OverviewPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNotify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#15213a] dark:bg-[#0c1426] dark:text-[#f1f5f9] transition-colors">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 border-b border-[#e3e7ef] bg-white/95 backdrop-blur dark:border-[#1e293b] dark:bg-[#101a31]/95 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#536079] hover:border-[#315efb] hover:text-[#315efb] dark:border-[#1e293b] dark:text-[#94a3b8] dark:hover:text-white transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Workspace</span>
            </Link>
            <div className="h-4 w-px bg-[#e2e8f0] dark:bg-[#1e293b]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#778198] dark:text-[#8e9bb5]">
                Executive Analytics
              </p>
              <h1 className="text-lg font-bold tracking-tight text-[#15213a] dark:text-white">
                Live Overview Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ingestion"
              className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#536079] hover:border-[#315efb] hover:text-[#315efb] dark:border-[#1e293b] dark:bg-[#13203c] dark:text-[#94a3b8] transition"
            >
              <Upload className="size-3.5" />
              <span>Data Ingestion</span>
            </Link>

            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#e7f8f0] px-3 py-1 text-xs font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
              API: Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6 md:p-8">
        <DynamicOverview notify={handleNotify} />
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#15213a] px-4 py-3 text-xs font-medium text-white shadow-xl dark:bg-[#1e293b] animate-in fade-in-50 slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
