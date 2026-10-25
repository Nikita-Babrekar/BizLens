'use client';

import React, { useRef, useEffect } from 'react';
import {
  Store,
  Moon,
  Sun,
  LogOut,
  Edit3,
  FileSpreadsheet,
  CheckCircle2,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDataset } from '@/context/DatasetContext';

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: string;
  onOpenEditShop?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  notify: (msg: string) => void;
  onSignOut: () => void;
}

export default function ProfileDropdown({
  isOpen,
  onClose,
  currentWorkspace,
  onOpenEditShop,
  isDarkMode,
  onToggleTheme,
  notify,
  onSignOut,
}: ProfileDropdownProps) {
  const { user } = useAuth();
  const { uploadedData, datasetHistory = [], selectDataset } = useDataset();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const safeHistory = datasetHistory ?? [];

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-4 top-[64px] z-50 w-88 rounded-2xl border p-4 shadow-2xl transition-all duration-200 animate-in fade-in-50 zoom-in-95 ${
        isDarkMode
          ? 'border-[#223354] bg-[#0f182c] text-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          : 'border-[#dfe5ef] bg-white text-[#15213a] shadow-[0_20px_50px_rgba(20,30,55,0.15)]'
      }`}
    >
      {/* 1. User Info & Active Shop Name */}
      <div className="flex items-start gap-3 pb-3.5 border-b border-[#edf0f5] dark:border-[#1e2a44]">
        <div className="relative shrink-0">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="size-11 rounded-xl object-cover shadow-sm ring-1 ring-black/5"
            />
          ) : (
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-tr from-[#315efb] to-[#6366f1] text-sm font-bold text-white shadow-md shadow-[#315efb]/25">
              {userInitials}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#10b981] dark:border-[#0f182c]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-bold tracking-tight text-[#0f172a] dark:text-white">
            {user?.displayName || 'Business Owner'}
          </h3>
          <p className="truncate text-[11px] text-[#64748b] dark:text-[#94a3b8] mb-1.5">
            {user?.email || 'admin@bizlens.ai'}
          </p>

          {/* Active Workspace / Shop Name Badge with Quick Edit */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#243556] bg-[#f8fafc] dark:bg-[#15223c] px-2 py-1 text-xs">
            <Store size={12} className="text-[#315efb] shrink-0" />
            <span className="truncate max-w-[130px] font-semibold text-[#1e293b] dark:text-white">
              {currentWorkspace || 'My Coffee Shop'}
            </span>
            {onOpenEditShop && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditShop();
                }}
                className="ml-1 text-[11px] font-medium text-[#315efb] dark:text-[#82a3ff] hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Edit Shop Name"
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Theme Toggle Mode */}
      <div className="py-3 border-b border-[#edf0f5] dark:border-[#1e2a44] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#475569] dark:text-[#94a3b8] flex items-center gap-1.5">
          {isDarkMode ? <Moon size={14} className="text-[#82a3ff]" /> : <Sun size={14} className="text-[#f59e0b]" />}
          <span>Appearance</span>
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
            isDarkMode
              ? 'border-[#2d3d63] bg-[#1a2846] text-[#fbbf24] hover:bg-[#223359]'
              : 'border-[#dfe5ef] bg-[#f8fafd] text-[#536079] hover:bg-[#eef2f9]'
          }`}
        >
          {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
          <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      {/* 3. Uploaded Datasets History */}
      <div className="py-3 border-b border-[#edf0f5] dark:border-[#1e2a44]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] dark:text-[#8ea7ff] flex items-center gap-1.5">
            <Database size={13} />
            <span>Dataset History</span>
          </span>
          <span className="text-[10px] font-medium text-[#94a3b8]">
            {(datasetHistory ?? []).length} available
          </span>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
          {safeHistory.length === 0 ? (
            <p className="py-2 text-center text-xs text-[#94a3b8] dark:text-[#64748b]">
              No datasets uploaded yet
            </p>
          ) : (
            safeHistory.map((dataset) => {
              const isActive =
                uploadedData?.filename === dataset.filename ||
                uploadedData?.dataset_id === dataset.dataset_id;

              return (
                <button
                  key={dataset.dataset_id || dataset.filename}
                  type="button"
                  onClick={async () => {
                    await selectDataset(dataset);
                    notify(`Switched active dataset to ${dataset.filename}`);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition border cursor-pointer ${
                    isActive
                      ? 'border-[#315efb] bg-[#315efb]/10 text-[#315efb] dark:text-[#82a3ff]'
                      : isDarkMode
                      ? 'border-transparent hover:border-[#243556] hover:bg-[#16233f] text-[#cbd5e1]'
                      : 'border-transparent hover:border-[#e2e8f0] hover:bg-[#f8fafc] text-[#334155]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet
                      size={15}
                      className={isActive ? 'text-[#315efb] dark:text-[#82a3ff]' : 'text-[#64748b]'}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold leading-tight">
                        {dataset.filename}
                      </p>
                      <p className="text-[10px] text-[#94a3b8] dark:text-[#64748b] leading-tight mt-0.5">
                        {dataset.row_count?.toLocaleString?.() || dataset.row_count || 0} rows • CSV
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#10b981]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#10b981]">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#94a3b8] opacity-0 group-hover:opacity-100">
                      Select
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Prominent Sign Out Button */}
      <div className="pt-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] font-semibold text-xs py-2.5 transition active:scale-[0.99] cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
