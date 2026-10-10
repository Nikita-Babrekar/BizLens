'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  ShieldCheck,
  Store,
  HardDrive,
  Cpu,
  Users,
  Bell,
  Key,
  Lock,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Check,
  ChevronDown,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { STORES } from './ProfileSlideOver'

export interface ProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  currentWorkspace: string
  onSwitchWorkspace: (name: string) => void
  onOpenSlideOver: (tab?: string) => void
  isDarkMode: boolean
  onToggleTheme: () => void
  notify: (msg: string) => void
  onSignOut: () => void
}

export default function ProfileDropdown({
  isOpen,
  onClose,
  currentWorkspace,
  onSwitchWorkspace,
  onOpenSlideOver,
  isDarkMode,
  onToggleTheme,
  notify,
  onSignOut,
}: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [storePickerOpen, setStorePickerOpen] = useState(false)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-4 top-[64px] z-50 w-84 rounded-2xl border p-4 shadow-2xl transition-all duration-200 animate-in fade-in-50 zoom-in-95 ${
        isDarkMode
          ? 'border-[#223354] bg-[#0f182c] text-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          : 'border-[#dfe5ef] bg-white text-[#15213a] shadow-[0_20px_50px_rgba(20,30,55,0.15)]'
      }`}
    >
      {/* User & Business Profile Header */}
      <div className="flex items-start gap-3 pb-3.5 border-b border-inherit">
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-tr from-[#315efb] to-[#6366f1] text-sm font-bold text-white shadow-md shadow-[#315efb]/25">
            JD
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-[#10b981] dark:border-[#0f182c]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold tracking-tight">Jordan</h3>
            <span className="inline-flex items-center gap-0.5 rounded bg-[#315efb]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
              <ShieldCheck size={10} /> Admin
            </span>
          </div>

          {/* Store Switcher Trigger */}
          <div className="relative mt-1">
            <button
              onClick={() => setStorePickerOpen(!storePickerOpen)}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition ${
                isDarkMode
                  ? 'text-[#94a3b8] hover:bg-[#1a2846] hover:text-white'
                  : 'text-[#536079] hover:bg-[#f0f4fa] hover:text-[#15213a]'
              }`}
            >
              <Store size={12} className="text-[#315efb]" />
              <span className="truncate max-w-[130px]">{currentWorkspace}</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {/* In-dropdown Store Picker */}
            {storePickerOpen && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-60 rounded-xl border p-1.5 shadow-xl z-20 ${
                  isDarkMode
                    ? 'border-[#26375a] bg-[#14203a] text-white'
                    : 'border-[#dfe5ef] bg-white text-[#15213a]'
                }`}
              >
                <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#7988a2]">
                  Switch Workspace
                </div>
                {STORES.map((s) => {
                  const isCurrent = currentWorkspace.includes(s.name) || currentWorkspace === s.name
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSwitchWorkspace(s.name)
                        setStorePickerOpen(false)
                        notify(`Switched store to ${s.name}`)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                        isCurrent
                          ? 'bg-[#315efb] text-white font-semibold'
                          : isDarkMode
                          ? 'hover:bg-[#1f2e52] text-[#cbd5e1]'
                          : 'hover:bg-[#f0f4fc] text-[#334155]'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {isCurrent && <Check size={12} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data & Storage Overview Widget */}
      <div className="py-3 border-b border-inherit space-y-2.5">
        {/* Engine status indicator */}
        <div
          className={`flex items-center justify-between rounded-lg p-2 text-[11px] ${
            isDarkMode ? 'bg-[#15223c]' : 'bg-[#f4f7fc]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-semibold text-xs">Python & AI Engine</span>
          </div>
          <span className="text-[10px] font-bold text-[#10b981]">Connected</span>
        </div>

        {/* Datasets and Storage Bar */}
        <div className="px-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#7d8ca5] flex items-center gap-1">
              <HardDrive size={11} className="text-[#315efb]" /> 3 Active CSVs
            </span>
            <span className="font-semibold">25.3 MB / 100 MB</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0] dark:bg-[#1e293b]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#315efb] to-[#6366f1]"
              style={{ width: '25.3%' }}
            />
          </div>
        </div>
      </div>

      {/* Quick Navigation Settings */}
      <div className="py-2 space-y-0.5 text-xs">
        {[
          { id: 'profile', label: 'User & Store Details', icon: User },
          { id: 'data', label: 'Data & Storage Engine', icon: HardDrive },
          { id: 'team', label: 'Manage Team & Permissions', icon: Users },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell },
          { id: 'api', label: 'API Keys & Integrations', icon: Key },
          { id: 'security', label: 'Security & Password', icon: Lock },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => {
                onClose()
                onOpenSlideOver(item.id)
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition ${
                isDarkMode
                  ? 'hover:bg-[#1a2846] text-[#cbd5e1] hover:text-white'
                  : 'hover:bg-[#f1f5fb] text-[#475569] hover:text-[#15213a]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={14} className="text-[#315efb]" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight size={13} className="text-[#7d8ca5]" />
            </button>
          )
        })}
      </div>

      {/* Theme Toggle & Quick Action */}
      <div className="pt-2 border-t border-inherit flex items-center justify-between px-1">
        <span className="text-xs font-medium text-[#7d8ca5]">Theme Mode</span>
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
            isDarkMode
              ? 'border-[#2d3d63] bg-[#1a2846] text-[#fbbf24] hover:bg-[#223359]'
              : 'border-[#dfe5ef] bg-[#f8fafd] text-[#536079] hover:bg-[#eef2f9]'
          }`}
        >
          {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          <span>{isDarkMode ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      {/* Full Modal Trigger Button */}
      <div className="mt-3">
        <button
          onClick={() => {
            onClose()
            onOpenSlideOver('profile')
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#315efb] py-2 text-xs font-bold text-white shadow-md shadow-[#315efb]/20 hover:bg-[#254edb] transition"
        >
          <span>Open Full Account Settings</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="mt-2 border-t border-inherit pt-2">
        <button
          onClick={() => {
            onClose()
            onSignOut()
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
