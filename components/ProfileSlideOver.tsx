'use client'

import React, { useState } from 'react'
import {
  User,
  Building,
  Store,
  ShieldCheck,
  Database,
  HardDrive,
  Cpu,
  Users,
  UserPlus,
  Bell,
  BellRing,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  ExternalLink,
  RefreshCw,
  Mail,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Laptop,
  Smartphone,
  Terminal,
  ArrowUpRight,
  Sliders,
  Share2,
  Trash2,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react'

export interface ProfileSlideOverProps {
  isOpen: boolean
  onClose: () => void
  activeTab?: string
  setActiveTab?: (tab: string) => void
  currentWorkspace: string
  onSwitchWorkspace: (name: string) => void
  isDarkMode: boolean
  onToggleTheme: () => void
  notify: (msg: string) => void
  onSignOut: () => void
}

export const STORES = [
  { id: '1', name: 'My Coffee Shop', branch: 'Downtown Flagship', revenue: '₹428k/mo', status: 'Active' },
  { id: '2', name: 'Coffee Shop - West End', branch: 'West End Mall', revenue: '₹184k/mo', status: 'Active' },
  { id: '3', name: 'Roastery & Lab', branch: 'Industrial Parkway', revenue: '₹92k/mo', status: 'Production Hub' },
]

export default function ProfileSlideOver({
  isOpen,
  onClose,
  activeTab: externalTab,
  setActiveTab: setExternalTab,
  currentWorkspace,
  onSwitchWorkspace,
  isDarkMode,
  onToggleTheme,
  notify,
  onSignOut
}: ProfileSlideOverProps) {
  const [internalTab, setInternalTab] = useState('profile')
  const activeTab = externalTab || internalTab
  const setActiveTab = setExternalTab || setInternalTab

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userName, setUserName] = useState('Jordan Mitchell')
  const [userTitle, setUserTitle] = useState('Founder & Workspace Admin')
  const [userEmail, setUserEmail] = useState('jordan@bizlens.ai')
  const [userPhone, setUserPhone] = useState('+1 (555) 234-8901')

  // Store Switching & Editing
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [isEditingStore, setIsEditingStore] = useState(false)
  const [storeIndustry, setStoreIndustry] = useState('Specialty Food & Beverage')
  const [storeLocation, setStoreLocation] = useState('Seattle, WA (Pacific)')

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    anomalyAlerts: true,
    lowStockWarnings: true,
    dailyBriefing: true,
    weeklyDigest: true,
    slackIntegration: true,
    supplierAlerts: false,
  })

  // Team Management
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Data Analyst')
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Jordan Mitchell', email: 'jordan@bizlens.ai', role: 'Workspace Admin', isYou: true, status: 'Active' },
    { id: '2', name: 'Alex Morgan', email: 'alex.m@bizlens.ai', role: 'Senior Analyst', isYou: false, status: 'Active' },
    { id: '3', name: 'Sarah Chen', email: 'sarah.c@bizlens.ai', role: 'Store Operations', isYou: false, status: 'Active' },
    { id: '4', name: 'Marcus Vance', email: 'marcus.v@bizlens.ai', role: 'Inventory Lead', isYou: false, status: 'Pending Invite' }
  ])

  // API Keys
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('https://api.mycoffeeshop.internal/bizlens-webhook')
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success'>('idle')
  const liveApiKey = 'bz_live_948f2a7e28d49c63b190f823a'

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!isOpen) return null

  const handleCopyApiKey = () => {
    navigator.clipboard?.writeText(liveApiKey)
    setCopiedKey(true)
    notify('API Key copied to clipboard')
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    const newMember = {
      id: String(Date.now()),
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      isYou: false,
      status: 'Pending Invite'
    }
    setTeamMembers([...teamMembers, newMember])
    setInviteEmail('')
    notify(`Invitation sent to ${newMember.email}`)
  }

  const handleTestWebhook = () => {
    setTestWebhookStatus('testing')
    setTimeout(() => {
      setTestWebhookStatus('success')
      notify('Webhook test payload delivered successfully (HTTP 200 OK)')
      setTimeout(() => setTestWebhookStatus('idle'), 3000)
    }, 900)
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword !== confirmPassword) {
      notify('Passwords do not match or are empty!')
      return
    }
    notify('Password updated securely!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const navTabs = [
    { id: 'profile', label: 'Profile & Stores', icon: User },
    { id: 'data', label: 'Data & Storage', icon: HardDrive },
    { id: 'team', label: 'Team & Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'security', label: 'Security & Theme', icon: Lock },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#090f1d]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <div
        className={`relative z-10 flex h-full w-full max-w-2xl flex-col shadow-2xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-[#0f172a] text-[#f1f5f9] border-l border-[#1e293b]'
            : 'bg-white text-[#15213a] border-l border-[#e3e7ef]'
        }`}
      >
        {/* Top Sticky Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4.5 ${
            isDarkMode ? 'border-[#1e293b] bg-[#131f38]' : 'border-[#e3e7ef] bg-[#fbfcfd]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#315efb] to-[#6366f1] text-white shadow-md shadow-[#315efb]/20 font-bold text-sm">
              JD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Account & Workspace Center</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]">
                  <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#657087]'}`}>
                Manage your credentials, connected engines, and team policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`grid size-9 place-items-center rounded-lg border transition ${
                isDarkMode
                  ? 'border-[#2a3754] bg-[#1a2644] text-[#fbbf24] hover:bg-[#223259]'
                  : 'border-[#dfe4ed] bg-white text-[#536079] hover:bg-[#f0f3f8] hover:text-[#315efb]'
              }`}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={onClose}
              className={`grid size-9 place-items-center rounded-lg border transition ${
                isDarkMode
                  ? 'border-[#2a3754] bg-[#1a2644] text-[#94a3b8] hover:text-white'
                  : 'border-[#dfe4ed] bg-white text-[#657087] hover:text-[#15213a]'
              }`}
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User & Business Profile Quick Bar */}
        <div
          className={`border-b px-6 py-4 transition-colors ${
            isDarkMode ? 'border-[#1e293b] bg-[#111c33]' : 'border-[#e3e7ef] bg-[#f8fafd]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="grid size-12 place-items-center rounded-full bg-[#315efb] text-base font-bold text-white shadow-md">
                  JD
                </div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-[#10b981] dark:border-[#111c33]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">{userName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#315efb]/10 px-2 py-0.5 text-[10px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                    <ShieldCheck size={11} /> Workspace Admin
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <span className={isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}>
                    Current Store:
                  </span>
                  <span className="font-semibold text-[#315efb] dark:text-[#7ba1ff]">
                    {currentWorkspace}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Switcher Quick Button */}
            <div className="relative">
              <button
                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                  isDarkMode
                    ? 'border-[#2d3d63] bg-[#1e2a4a] text-white hover:bg-[#25355c]'
                    : 'border-[#d0d7e6] bg-white text-[#15213a] hover:bg-[#f3f6fc]'
                }`}
              >
                <Store size={13} className="text-[#315efb]" />
                <span>Switch Store</span>
                <ChevronDown size={13} className="text-[#7d8ba1]" />
              </button>

              {storeDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-72 rounded-xl border p-2 shadow-xl z-30 transition-all ${
                    isDarkMode
                      ? 'border-[#2a395b] bg-[#14203b] text-white'
                      : 'border-[#dfe5ef] bg-white text-[#15213a]'
                  }`}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7988a2]">
                    Available Workspaces
                  </div>
                  <div className="flex flex-col gap-1">
                    {STORES.map((s) => {
                      const isCurrent = currentWorkspace.includes(s.name) || currentWorkspace === s.name
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSwitchWorkspace(s.name)
                            setStoreDropdownOpen(false)
                            notify(`Switched workspace to ${s.name}`)
                          }}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                            isCurrent
                              ? 'bg-[#315efb] text-white font-semibold'
                              : isDarkMode
                              ? 'hover:bg-[#1f2e52] text-[#cbd5e1]'
                              : 'hover:bg-[#f0f4fc] text-[#334155]'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-[#7d8ca5]'}`}>
                              {s.branch} · {s.revenue}
                            </div>
                          </div>
                          {isCurrent && <Check size={14} className="shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 border-t pt-2 border-inherit">
                    <button
                      onClick={() => {
                        setStoreDropdownOpen(false)
                        notify('Store creation wizard initiated')
                      }}
                      className="w-full rounded-md py-1.5 text-center text-[11px] font-semibold text-[#315efb] hover:underline"
                    >
                      + Connect New Store Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          className={`flex gap-1 overflow-x-auto border-b px-6 py-2 ${
            isDarkMode ? 'border-[#1e293b] bg-[#0c1322]' : 'border-[#e3e7ef] bg-[#f4f7fb]'
          }`}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#315efb] text-white shadow-sm'
                    : isDarkMode
                    ? 'text-[#94a3b8] hover:bg-[#17233f] hover:text-white'
                    : 'text-[#64748b] hover:bg-white hover:text-[#15213a]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Profile & Stores */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold">Personal & Administrator Identity</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      Your identity across BizLens reports and root-cause audit logs
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditingProfile) {
                        notify('Profile details updated successfully')
                      }
                      setIsEditingProfile(!isEditingProfile)
                    }}
                    className="rounded-lg bg-[#315efb] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#254edb] transition"
                  >
                    {isEditingProfile ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Full Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-xs font-semibold">{userName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Email Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-xs font-semibold">{userEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Role & Permissions
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#315efb]/10 px-2 py-1 text-xs font-bold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                        <ShieldCheck size={13} /> Workspace Admin (Owner)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Phone / SMS Alerts
                    </label>
                    {isEditingProfile ? (
                      <input
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-xs font-semibold">{userPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Store & Workspace Metadata */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold">Business & Store Location</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      Active store parameters powering automated root-cause models
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditingStore) notify('Store location settings saved')
                      setIsEditingStore(!isEditingStore)
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isDarkMode
                        ? 'border-[#2d3d63] bg-[#1e2a4a] text-white hover:bg-[#25355c]'
                        : 'border-[#dfe5ef] bg-white text-[#536079] hover:bg-[#f0f4fb]'
                    }`}
                  >
                    {isEditingStore ? 'Save Store Details' : 'Configure Store'}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Active Workspace
                    </label>
                    <p className="mt-1 text-xs font-semibold text-[#315efb] dark:text-[#7ba1ff]">
                      {currentWorkspace}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Industry Category
                    </label>
                    {isEditingStore ? (
                      <input
                        value={storeIndustry}
                        onChange={(e) => setStoreIndustry(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-xs font-semibold">{storeIndustry}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Timezone & Regional Locale
                    </label>
                    {isEditingStore ? (
                      <input
                        value={storeLocation}
                        onChange={(e) => setStoreLocation(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-xs font-semibold">{storeLocation}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Currency Format
                    </label>
                    <p className="mt-1 text-xs font-semibold">INR (₹) · Standard 2 Decimals</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Data & Storage Overview Widget */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Connected Engine Status Card */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode
                    ? 'border-[#1e3a5f] bg-gradient-to-r from-[#111f3c] to-[#0d172e]'
                    : 'border-[#d0e0fd] bg-gradient-to-r from-[#eff4ff] to-[#f7f9ff]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-xl bg-[#315efb] text-white shadow-md shadow-[#315efb]/25">
                      <Cpu size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#15213a] dark:text-white">
                          Python & AI Engine Connected
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
                          <span className="size-1.5 rounded-full bg-[#10b981] animate-ping" />
                          ONLINE
                        </span>
                      </div>
                      <p className="text-xs text-[#5f6f8d] dark:text-[#94a3b8] mt-0.5">
                        High-throughput vectorized calculation engine (v2.4.1) · 24ms roundtrip
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => notify('Python & AI worker heartbeat verified (24ms ping)')}
                    className="flex items-center gap-1.5 rounded-lg border border-[#315efb]/30 bg-white dark:bg-[#1a2849] px-3 py-1.5 text-xs font-semibold text-[#315efb] dark:text-[#7ba1ff] hover:bg-[#315efb]/5 transition"
                  >
                    <RefreshCw size={12} /> Ping Engine
                  </button>
                </div>
              </div>

              {/* Storage Limit & Usage Widget */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-[#315efb]" />
                    <h4 className="text-sm font-bold">Storage Limit & Capacity</h4>
                  </div>
                  <span className="text-xs font-bold text-[#315efb] dark:text-[#7ba1ff]">
                    25.3 MB of 100 MB used (25.3%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#e2e8f0] dark:bg-[#1e293b]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#315efb] to-[#6366f1] transition-all duration-500"
                    style={{ width: '25.3%' }}
                  />
                </div>

                {/* Breakdown Legend */}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 border-inherit text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Sales Data
                    </span>
                    <p className="font-bold">12.4 MB (49%)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Supplier Logs
                    </span>
                    <p className="font-bold">8.1 MB (32%)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Inventory
                    </span>
                    <p className="font-bold">4.8 MB (19%)</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3 border-inherit text-xs">
                  <span className={isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}>
                    Free tier: 100 MB quota · Up to 5 datasets
                  </span>
                  <button
                    onClick={() => notify('Upgrading storage to BizLens Pro (500 MB)')}
                    className="font-semibold text-[#315efb] dark:text-[#7ba1ff] hover:underline"
                  >
                    Upgrade Storage →
                  </button>
                </div>
              </div>

              {/* Active Datasets List */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold">Active Uploaded Datasets</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      3 CSV/XLSX sources currently synchronized with forecasting models
                    </p>
                  </div>
                  <span className="rounded-md bg-[#315efb]/10 px-2 py-0.5 text-xs font-bold text-[#315efb] dark:text-[#82a3ff]">
                    3 Active Datasets
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Sales_July.csv', size: '12.4 MB', rows: '12,420 rows', updated: '2 min ago', status: 'Optimal' },
                    { name: 'Inventory.xlsx', size: '4.8 MB', rows: '1,280 rows', updated: '1 hour ago', status: 'Optimal' },
                    { name: 'Supplier_Logs.csv', size: '8.1 MB', rows: '5,840 rows', updated: 'Today, 08:30 AM', status: 'Profiling' },
                  ].map((d) => (
                    <div
                      key={d.name}
                      className={`flex items-center justify-between rounded-lg border p-3 text-xs transition ${
                        isDarkMode
                          ? 'border-[#243354] bg-[#182645] hover:bg-[#1f3057]'
                          : 'border-[#edf0f5] bg-[#f8fafd] hover:bg-[#f1f5fc]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-lg bg-[#315efb]/10 text-[#315efb]">
                          <FileSpreadsheet size={16} />
                        </div>
                        <div>
                          <div className="font-bold">{d.name}</div>
                          <div className={`text-[10px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#778198]'}`}>
                            {d.size} · {d.rows} · Sync {d.updated}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            d.status === 'Optimal'
                              ? 'bg-[#10b981]/15 text-[#10b981]'
                              : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                          }`}
                        >
                          {d.status}
                        </span>
                        <button
                          onClick={() => notify(`Viewing data dictionary for ${d.name}`)}
                          className="text-[#315efb] hover:underline font-semibold"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Team & Roles */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Invite Team Member Box */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="mb-4">
                  <h4 className="text-sm font-bold">Invite Colleague to Workspace</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    Invite store managers, financial analysts, or operations leads
                  </p>
                </div>

                <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      required
                      placeholder="colleague@yourcoffeeshop.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:border-[#315efb] ${
                        isDarkMode
                          ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                          : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                      }`}
                    />
                  </div>

                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${
                      isDarkMode
                        ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                        : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                    }`}
                  >
                    <option>Data Analyst</option>
                    <option>Store Operations</option>
                    <option>Executive Viewer</option>
                    <option>Workspace Admin</option>
                  </select>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#315efb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#254edb] transition shadow-sm"
                  >
                    <UserPlus size={14} /> Send Invite
                  </button>
                </form>
              </div>

              {/* Members List */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold">Active Members & Permissions</h4>
                  <span className="text-xs text-[#7d8ca5]">{teamMembers.length} Accounts</span>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs transition ${
                        isDarkMode
                          ? 'border-[#243354] bg-[#182645]'
                          : 'border-[#edf0f5] bg-[#f8fafd]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-full bg-gradient-to-tr from-[#315efb] to-[#6366f1] text-xs font-bold text-white">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{member.name}</span>
                            {member.isYou && (
                              <span className="rounded bg-[#315efb]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#315efb] dark:text-[#82a3ff]">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                            {member.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            member.role === 'Workspace Admin'
                              ? 'bg-[#315efb]/15 text-[#315efb] dark:text-[#82a3ff]'
                              : 'bg-[#64748b]/15 text-[#64748b] dark:text-[#cbd5e1]'
                          }`}
                        >
                          {member.role}
                        </span>

                        {!member.isYou && (
                          <button
                            onClick={() => {
                              setTeamMembers(teamMembers.filter((m) => m.id !== member.id))
                              notify(`Removed ${member.name} from workspace`)
                            }}
                            className="text-[#ef4444] hover:text-[#dc2626] text-xs p-1"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Permissions Reference */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  isDarkMode ? 'border-[#1e293b] bg-[#0c1322]' : 'border-[#e3e7ef] bg-[#f8fafd]'
                }`}
              >
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#315efb]" /> Permission Levels Summary
                </div>
                <p className={`text-[11px] leading-5 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  <strong>Workspace Admin</strong> has full access to delete datasets, manage API keys, billing, and team seats.
                  <strong> Data Analysts</strong> can build simulation runs and trigger Python transformations.
                  <strong> Operations & Viewers</strong> have read-only access to executive dashboards.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Notification Preferences */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="mb-4">
                  <h4 className="text-sm font-bold">Automated Intelligence Alerts</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    Configure real-time triggers dispatched when anomalies or threshold events occur
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'anomalyAlerts',
                      title: 'Anomaly Alerts (Root-Cause Engine)',
                      desc: 'Notify when sudden revenue drops > 15% or unusual regional spikes occur.',
                      badge: 'High Priority',
                    },
                    {
                      key: 'lowStockWarnings',
                      title: 'Low Stock & Reorder Warnings',
                      desc: 'Notify when critical menu items or coffee beans fall below safety buffer.',
                      badge: 'Inventory',
                    },
                    {
                      key: 'dailyBriefing',
                      title: 'Daily AI Co-pilot Briefing',
                      desc: 'Receive an automated morning diagnostic brief at 8:00 AM local time.',
                      badge: 'Executive',
                    },
                    {
                      key: 'weeklyDigest',
                      title: 'Weekly Executive Performance PDF',
                      desc: 'Send a consolidated weekly summary report to Jordan Mitchell via email.',
                      badge: 'Email',
                    },
                    {
                      key: 'supplierAlerts',
                      title: 'Supplier Lead-Time Hold Alerts',
                      desc: 'Trigger alerts when suppliers delay logistics by more than 3 business days.',
                      badge: 'Supply Chain',
                    },
                  ].map((item) => {
                    const isChecked = (notifications as any)[item.key]
                    return (
                      <div
                        key={item.key}
                        className={`flex items-start justify-between gap-4 rounded-xl border p-3.5 transition ${
                          isDarkMode
                            ? 'border-[#243354] bg-[#182645]'
                            : 'border-[#edf0f5] bg-[#f8fafd]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{item.title}</span>
                            <span className="rounded bg-[#315efb]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#315efb] dark:text-[#82a3ff]">
                              {item.badge}
                            </span>
                          </div>
                          <p className={`text-[11px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                            {item.desc}
                          </p>
                        </div>

                        {/* Switch Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setNotifications({
                              ...notifications,
                              [item.key]: !isChecked,
                            })
                            notify(
                              `${item.title.split('(')[0]} ${!isChecked ? 'enabled' : 'disabled'}`
                            )
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isChecked ? 'bg-[#315efb]' : isDarkMode ? 'bg-[#334155]' : 'bg-[#cbd5e1]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: API & Integrations */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* API Key Box */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold">Live Workspace API Key</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      Use this secret token to ingest data or query forecasts programmatically
                    </p>
                  </div>
                  <button
                    onClick={() => notify('API Key rolled and regenerated securely')}
                    className="rounded-lg border border-[#315efb]/30 px-3 py-1.5 text-xs font-semibold text-[#315efb] dark:text-[#7ba1ff] hover:bg-[#315efb]/5 transition"
                  >
                    Regenerate Key
                  </button>
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 font-mono text-xs ${
                    isDarkMode
                      ? 'border-[#2d3d63] bg-[#0c1322] text-[#f1f5f9]'
                      : 'border-[#dfe5ef] bg-[#f8fafd] text-[#15213a]'
                  }`}
                >
                  <span className="tracking-wider">
                    {apiKeyVisible ? liveApiKey : 'bz_live_••••••••••••••••••••••••823a'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="p-1 text-[#7988a2] hover:text-[#315efb]"
                      title={apiKeyVisible ? 'Hide Key' : 'Reveal Key'}
                    >
                      {apiKeyVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={handleCopyApiKey}
                      className="flex items-center gap-1 rounded bg-[#315efb] px-2.5 py-1 text-[11px] font-sans font-semibold text-white shadow-sm hover:bg-[#254edb]"
                    >
                      {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#7988a2]">
                  <span>Rate Limit: 1,420 / 10,000 monthly API requests used</span>
                  <span className="text-[#10b981] font-semibold">99.99% Up-time SLA</span>
                </div>
              </div>

              {/* Webhook Endpoint */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="mb-3">
                  <h4 className="text-sm font-bold">Webhook Outbound Dispatcher</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    Receive real-time JSON payloads when anomaly detectors spot issues
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-mono outline-none focus:border-[#315efb] ${
                      isDarkMode
                        ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                        : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                    }`}
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={testWebhookStatus === 'testing'}
                    className="rounded-lg bg-[#315efb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#254edb] transition"
                  >
                    {testWebhookStatus === 'testing' ? 'Testing...' : 'Send Test Ping'}
                  </button>
                </div>
              </div>

              {/* Code Snippet for Python Engine */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#0c1322]' : 'border-[#e3e7ef] bg-[#0f172a] text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-[#38bdf8]" />
                    <span className="text-xs font-bold text-white">Python SDK Quickstart</span>
                  </div>
                  <span className="text-[10px] text-[#94a3b8]">pip install bizlens</span>
                </div>
                <pre className="overflow-x-auto text-[11px] font-mono text-[#cbd5e1] leading-relaxed">
{`from bizlens import BizLensClient

client = BizLensClient(api_key="${liveApiKey.slice(0, 10)}...")
anomalies = client.detect_anomalies(workspace_id="${currentWorkspace}")
print(f"Detected {len(anomalies)} root cause signals")`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: Security & Theme */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Appearance & Theme Quick Action */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">Theme & Display Mode</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      Toggle between BizLens Crisp Light and Navy Slate Dark theme
                    </p>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm transition ${
                      isDarkMode
                        ? 'border-[#2d3d63] bg-[#1e2a4a] text-[#fbbf24] hover:bg-[#25355c]'
                        : 'border-[#dfe5ef] bg-[#f8fafd] text-[#15213a] hover:bg-[#eef2f9]'
                    }`}
                  >
                    {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
                  </button>
                </div>
              </div>

              {/* Password Change Form */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="mb-4">
                  <h4 className="text-sm font-bold">Change Password & Security</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    Ensure your account is protected with strong password entropy
                  </p>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[#315efb] ${
                        isDarkMode
                          ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                          : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                      }`}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="At least 8 chars"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7988a2]">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[#315efb] ${
                          isDarkMode
                            ? 'border-[#2d3d63] bg-[#0c1322] text-white'
                            : 'border-[#dfe5ef] bg-[#fbfcff] text-[#15213a]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-[#315efb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#254edb] transition"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* 2FA & Active Sessions */}
              <div
                className={`rounded-xl border p-5 ${
                  isDarkMode ? 'border-[#1e293b] bg-[#14203b]' : 'border-[#e3e7ef] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#10b981]" />
                    <h4 className="text-sm font-bold">Two-Factor Authentication (2FA)</h4>
                  </div>
                  <span className="rounded bg-[#10b981]/15 px-2 py-0.5 text-xs font-bold text-[#10b981]">
                    Enabled (Authenticator App)
                  </span>
                </div>

                <div className="space-y-2 border-t pt-3 border-inherit text-xs">
                  <div className="font-semibold text-[11px] uppercase tracking-wider text-[#7988a2]">
                    Active Logged-in Sessions
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop size={14} className="text-[#315efb]" />
                      <span>Windows 11 · Chrome (Current Session)</span>
                    </div>
                    <span className="text-[10px] text-[#10b981] font-semibold">Active Now</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={14} className="text-[#7988a2]" />
                      <span>iPhone 15 Pro · BizLens Mobile</span>
                    </div>
                    <span className="text-[10px] text-[#7988a2]">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Sign Out */}
        <div
          className={`border-t px-6 py-4 flex items-center justify-between ${
            isDarkMode ? 'border-[#1e293b] bg-[#131f38]' : 'border-[#e3e7ef] bg-[#fbfcfd]'
          }`}
        >
          <div className="text-[11px] text-[#7988a2]">
            Signed in as <span className="font-semibold">{userEmail}</span>
          </div>

          <button
            onClick={() => {
              onClose()
              onSignOut()
            }}
            className="flex items-center gap-2 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] px-4 py-2 text-xs font-bold transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
