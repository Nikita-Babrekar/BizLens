'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Layers,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import DatasetUploader from '@/components/DatasetUploader';
import { IngestionResponse } from '@/lib/api';

export default function IngestionPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<IngestionResponse[]>([]);

  const handleNotify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUploadSuccess = (response: IngestionResponse) => {
    setRecentUploads((prev) => [response, ...prev.slice(0, 4)]);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#15213a] dark:bg-[#0c1426] dark:text-[#f1f5f9] transition-colors">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 border-b border-[#e3e7ef] bg-white/95 backdrop-blur dark:border-[#1e293b] dark:bg-[#101a31]/95 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
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
                Core Data Infrastructure
              </p>
              <h1 className="text-lg font-bold tracking-tight text-[#15213a] dark:text-white">
                Dataset Ingestion & Cleaning
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/overview"
              className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#536079] hover:border-[#315efb] hover:text-[#315efb] dark:border-[#1e293b] dark:bg-[#13203c] dark:text-[#94a3b8] transition"
            >
              <LayoutDashboard className="size-3.5" />
              <span>View Overview</span>
            </Link>

            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#e7f8f0] px-3 py-1 text-xs font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
              <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
              FastAPI Pipeline
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl p-6 md:p-8 space-y-8">
        {/* Dataset Ingestion Component */}
        <DatasetUploader
          onSuccess={handleUploadSuccess}
          notify={handleNotify}
          onNavigateToOverview={() => router.push('/overview')}
        />

        {/* Upload History / Queue List if multiple uploaded */}
        {recentUploads.length > 0 && (
          <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#15213a] dark:text-white">
                  Ingested In This Session
                </h2>
                <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                  Recently uploaded and normalized datasets
                </p>
              </div>
              <span className="text-xs text-[#64748b]">
                {recentUploads.length} dataset{recentUploads.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9] dark:divide-[#1e293b]">
              {recentUploads.map((ds, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                      <FileSpreadsheet className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#15213a] dark:text-white">
                        {ds.filename}
                      </p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                        {ds.rows_processed.toLocaleString()} rows · {ds.columns.length} columns · {ds.cleaning_log.length} cleaning actions
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/overview"
                    className="flex items-center gap-1 text-xs font-semibold text-[#315efb] hover:underline dark:text-[#82a3ff]"
                  >
                    <LayoutDashboard className="size-3.5" />
                    See Dashboard
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
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
