'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
<<<<<<< HEAD
import { Activity, AlertTriangle, BarChart3, Bell, Bot, BrainCircuit, ChevronDown, ChevronLeft, ChevronRight, Database, Download, FileBarChart, FileSpreadsheet, FileText, HelpCircle, Key, LayoutDashboard, Loader2, Menu, MessageSquare, MoreHorizontal, Network, Plus, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Upload, WandSparkles, X, Zap } from 'lucide-react'
=======
import { Activity, AlertTriangle, BarChart3, Bell, Bot, BrainCircuit, ChevronDown, ChevronLeft, ChevronRight, Database, Download, FileBarChart, FileSpreadsheet, FileText, HelpCircle, Key, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Network, Plus, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Upload, WandSparkles, X, Zap } from 'lucide-react'
>>>>>>> origin/main
import ProfileDropdown from '@/components/ProfileDropdown'
import ProfileSlideOver from '@/components/ProfileSlideOver'
import DatasetUploader from '@/components/DatasetUploader'
import DynamicOverview from '@/components/DynamicOverview'
import RootCauseEngine from '@/components/RootCauseEngine'
import SalesForecastWhatIf from '@/components/SalesForecastWhatIf'
<<<<<<< HEAD
import { useDataset } from '@/context/DatasetContext'
import { downloadPDFReport, downloadCleanedDatasetCSV, createReportShareLink, sendCopilotChat } from '@/lib/api'

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  followUps?: string[];
  sql?: string;
}

=======
>>>>>>> origin/main

const revenue = [{ day: 'Jul 1', value: 38200 }, { day: 'Jul 8', value: 42100 }, { day: 'Jul 15', value: 39700 }, { day: 'Jul 22', value: 45800 }, { day: 'Jul 29', value: 47200 }, { day: 'Aug 5', value: 48100 }, { day: 'Aug 12', value: 36300 }, { day: 'Aug 19', value: 41200 }, { day: 'Aug 26', value: 44600 }, { day: 'Sep 2', value: 48900 }, { day: 'Sep 9', value: 52700 }]
const categories = [{ name: 'Outerwear', value: 38 }, { name: 'Accessories', value: 26 }, { name: 'Footwear', value: 21 }, { name: 'Basics', value: 15 }]
const regions = [{ name: 'North America', value: 48, color: '#315efb' }, { name: 'Europe', value: 27, color: '#5f7ff5' }, { name: 'Asia Pacific', value: 16, color: '#91a7f8' }, { name: 'Other', value: 9, color: '#c9d3fb' }]
const forecast = [{ month: 'Jun', actual: 41, projected: 41 }, { month: 'Jul', actual: 44, projected: 44 }, { month: 'Aug', actual: 37, projected: 37 }, { month: 'Sep', actual: 47, projected: 47 }, { month: 'Oct', projected: 53, upper: 58, lower: 48 }, { month: 'Nov', projected: 56, upper: 64, lower: 49 }, { month: 'Dec', projected: 61, upper: 72, lower: 52 }]

const nav = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'ingestion', label: 'Data ingestion', icon: Upload },
  { id: 'rootcause', label: 'Root-cause engine', icon: Network },
  { id: 'predictive', label: 'Predictive intelligence', icon: WandSparkles },
  { id: 'nlq', label: 'Ask BizLens', icon: MessageSquare },
  { id: 'reports', label: 'Reports & exports', icon: FileBarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-xl border border-[#e3e7ef] bg-white dark:border-[#1e293b] dark:bg-[#101a31] dark:text-[#f1f5f9] shadow-[0_1px_2px_rgba(24,35,58,.03)] transition-colors ${className}`}>{children}</section> }
function Header({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: React.ReactNode }) { return <div className="mb-5 flex items-end justify-between"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[#778198] dark:text-[#8e9bb5]">{eyebrow || 'Workspace overview'}</p><h1 className="text-[25px] font-semibold tracking-[-.04em] text-[#15213a] dark:text-white">{title}</h1></div>{action}</div> }
function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'amber' }) { const styles = { blue: 'bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]', green: 'bg-[#e7f8f0] text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]', red: 'bg-[#fff0ee] text-[#d65347] dark:bg-[#ef4444]/20 dark:text-[#f87171]', amber: 'bg-[#fff6df] text-[#a97112] dark:bg-[#f59e0b]/20 dark:text-[#fbbf24]' }; return <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${styles[tone]}`}>{children}</span> }

export default function Page() {
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [copilot, setCopilot] = useState(true);
  const [workspace, setWorkspace] = useState('My Coffee Shop');
  const [toast, setToast] = useState('');
  const [price, setPrice] = useState(0);
  const [delay, setDelay] = useState(3);
  const [marketing, setMarketing] = useState(12);
  const [chat, setChat] = useState('');
<<<<<<< HEAD
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { uploadedData } = useDataset();
=======
  const [messages, setMessages] = useState<string[]>([]);
>>>>>>> origin/main

  // Profile overlay states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileSlideOverOpen, setProfileSlideOverOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      return next;
    });
  };

  const handleSignOut = () => {
    notify('Signed out Jordan Mitchell. Redirecting to workspace login...');
  };

  const marginImpact = useMemo(() => Math.round(18 + price * .8 - delay * 1.6 + marketing * .22), [price, delay, marketing]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
<<<<<<< HEAD

  const handleSendChat = async (promptText?: string) => {
    const textToSend = (typeof promptText === 'string' ? promptText : chat).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChat('');
    setIsChatLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendCopilotChat({
        message: textToSend,
        conversation_history: history,
        workspace_name: workspace,
        dataset_id: uploadedData?.dataset_id ?? undefined,
      });

      let sqlSnippet: string | undefined;
      const sqlMatch = res.reply.match(/```(?:sql)?\s*([\s\S]*?)```/i);
      if (sqlMatch) {
        sqlSnippet = sqlMatch[1].trim();
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        followUps: res.follow_up_suggestions || undefined,
        sql: sqlSnippet,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err?.message || 'Error communicating with Google Gemini API. Please check server logs.',
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };
=======
  const sendChat = () => { if (!chat.trim()) return; setMessages([...messages, chat.trim()]); setChat(''); };
>>>>>>> origin/main

  return <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-[#090f1d] text-[#f1f5f9]' : 'bg-[#f5f7fb] text-[#15213a]'}`}>
    <header className={`fixed inset-x-0 top-0 z-40 flex h-[66px] items-center border-b px-5 backdrop-blur transition-colors ${
      isDarkMode ? 'border-[#1e293b] bg-[#0c1426]/95 text-white' : 'border-[#e3e7ef] bg-white/95 text-[#15213a]'
    }`}>
      <div className="flex w-[250px] items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-[#315efb] text-white shadow-[0_5px_12px_rgba(49,94,251,.25)]"><Sparkles size={18}/></div>
        <div>
          <div className="text-[16px] font-bold tracking-[-.04em]">biz<span className="text-[#315efb]">lens</span></div>
          <div className="text-[9px] font-medium uppercase tracking-[.15em] text-[#97a0b2]">Business intelligence</div>
        </div>
      </div>
      <div className="hidden flex-1 justify-center md:flex">
        <button className={`flex h-9 w-[380px] items-center gap-3 rounded-lg border px-3 text-left text-[12px] transition ${
          isDarkMode ? 'border-[#1e293b] bg-[#101a31] text-[#94a3b8] hover:border-[#315efb]' : 'border-[#e3e7ef] bg-[#f8f9fc] text-[#8c96a9] hover:border-[#c2cce0]'
        }`}>
          <Search size={15}/>
          <span>Ask BizLens or search datasets...</span>
          <kbd className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] ${
            isDarkMode ? 'border-[#2d3d63] bg-[#162340] text-[#94a3b8]' : 'border-[#dce2ed] bg-white text-[#657087]'
          }`}>Ctrl K</kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Notifications button linked to slideover tab */}
        <button 
          onClick={() => { setProfileActiveTab('notifications'); setProfileSlideOverOpen(true); }}
          className={`relative p-1.5 rounded-lg transition ${
            isDarkMode ? 'text-[#94a3b8] hover:text-white hover:bg-[#1a2846]' : 'text-[#657087] hover:text-[#15213a] hover:bg-[#f0f4fa]'
          }`} 
          aria-label="Notifications"
          title="Notification preferences"
        >
          <Bell size={18}/>
          <i className="absolute right-1 top-1 size-2 rounded-full bg-[#ef6357] ring-2 ring-white dark:ring-[#0c1426]"/>
        </button>

        {/* Engine status indicator linked to Data & Storage tab */}
        <button
          onClick={() => { setProfileActiveTab('data'); setProfileSlideOverOpen(true); }}
          className={`hidden items-center gap-2 rounded-full px-2.5 py-1 text-[11px] transition lg:flex border ${
            isDarkMode 
              ? 'border-[#1e3455] bg-[#111f3c] text-[#94a3b8] hover:text-white' 
              : 'border-[#d9e2f2] bg-[#f4f7fc] text-[#55627a] hover:bg-[#eaf0fa]'
          }`}
          title="Connected: Click to view Data & Storage overview"
        >
          <span className="size-2 rounded-full bg-[#18a46a] animate-pulse"/>
          <span>Python & AI engine</span>
          <span className="font-bold text-[#18a46a]">Connected</span>
        </button>

        {/* User Profile Avatar / Circle Dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="group relative flex items-center gap-2 rounded-full p-0.5 outline-none focus:ring-2 focus:ring-[#315efb] transition"
            aria-label="User profile and account settings"
            aria-haspopup="true"
            aria-expanded={profileDropdownOpen}
          >
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-tr from-[#315efb] to-[#6366f1] text-[12px] font-bold text-white shadow-md shadow-[#315efb]/25 ring-2 ring-transparent group-hover:ring-[#315efb] transition-all">
              JD
            </div>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#10b981] dark:border-[#0c1426]" />
          </button>

          {/* Slick Profile Dropdown Menu */}
          <ProfileDropdown
            isOpen={profileDropdownOpen}
            onClose={() => setProfileDropdownOpen(false)}
            currentWorkspace={workspace}
            onSwitchWorkspace={(w) => setWorkspace(w)}
            onOpenSlideOver={(tab) => {
              if (tab) setProfileActiveTab(tab);
              setProfileSlideOverOpen(true);
            }}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            notify={notify}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>

    <aside className={`fixed bottom-0 left-0 top-[66px] z-30 hidden border-r border-[#e3e7ef] dark:border-[#1e293b] bg-[#101a31] text-white transition-all md:block ${collapsed ? 'w-[72px]' : 'w-[250px]'}`}><div className="flex h-full flex-col p-3"><div className={`mb-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 pt-2`}>{!collapsed && <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#8491ac]">Workspace</span>}<button onClick={() => setCollapsed(!collapsed)} className="text-[#96a4bf] hover:text-white" aria-label="Collapse navigation">{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button></div>{!collapsed && <button onClick={() => { setProfileActiveTab('profile'); setProfileSlideOverOpen(true); }} title="Click to manage store workspace" className="mb-5 flex items-center gap-2 rounded-lg bg-[#1b2948] px-3 py-2.5 text-left text-[12px] text-white hover:bg-[#23355c] transition"><span className="grid size-6 place-items-center rounded bg-[#e2e8ff] text-[10px] font-bold text-[#315efb]">MC</span><span className="flex-1 truncate">{workspace}</span><ChevronDown size={13} className="text-[#93a0bb]"/></button>}<nav className="flex flex-col gap-1">{nav.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setActive(item.id)} title={item.label} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] transition ${active === item.id ? 'bg-[#315efb] font-semibold text-white shadow-[0_6px_16px_rgba(49,94,251,.22)]' : 'text-[#aeb9cf] hover:bg-[#1b2948] hover:text-white'} ${collapsed ? 'justify-center' : ''}`}><Icon size={17}/>{!collapsed && <span>{item.label}</span>}{item.id === 'rootcause' && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-[#ef6357]"/>}</button>})}</nav><div className="mt-auto rounded-xl bg-[#182642] p-3">{!collapsed ? <><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold"><Bot size={15} className="text-[#8ea7ff]"/> AI co-pilot</div><p className="text-[10px] leading-4 text-[#93a0bb]">Your data is clean and ready. I found one anomaly worth investigating.</p><button onClick={() => setCopilot(true)} className="mt-3 text-[10px] font-semibold text-[#8ea7ff]">Open assistant →</button></> : <Bot size={17} className="mx-auto text-[#8ea7ff]"/>}</div></div></aside>
<<<<<<< HEAD
    <main className={`min-h-screen pt-[66px] transition-all ${collapsed ? 'md:pl-[72px]' : 'md:pl-[250px]'} ${copilot ? 'md:pr-[320px]' : ''}`}><div className="mx-auto max-w-[1400px] p-5 md:p-8">{active === 'dashboard' && <Dashboard notify={notify} onGoToIngestion={() => setActive('ingestion')}/>} {active === 'ingestion' && <Ingestion notify={notify} onNavigateToOverview={() => setActive('dashboard')}/>} {active === 'rootcause' && <RootCause notify={notify} onGoToIngestion={() => setActive('ingestion')}/>} {active === 'predictive' && <Predictive notify={notify}/>} {active === 'nlq' && <NLQ chat={chat} setChat={setChat} messages={messages} handleSendChat={handleSendChat} isLoading={isChatLoading}/>} {active === 'reports' && <Reports notify={notify} workspace={workspace}/>} {active === 'settings' && <SettingsView notify={notify} onOpenAccountCenter={(tab) => { setProfileActiveTab(tab); setProfileSlideOverOpen(true); }}/>}</div></main>
    {copilot && <Copilot onClose={() => setCopilot(false)} messages={messages} handleSendChat={handleSendChat} isLoading={isChatLoading} />}{!copilot && <button onClick={() => setCopilot(true)} className="fixed bottom-5 right-5 z-20 grid size-12 place-items-center rounded-full bg-[#315efb] text-white shadow-lg"><Bot size={20}/></button>}{toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#15213a] px-4 py-3 text-xs font-medium text-white shadow-xl">{toast}</div>}
=======
    <main className={`min-h-screen pt-[66px] transition-all ${collapsed ? 'md:pl-[72px]' : 'md:pl-[250px]'} ${copilot ? 'md:pr-[292px]' : ''}`}><div className="mx-auto max-w-[1400px] p-5 md:p-8">{active === 'dashboard' && <Dashboard notify={notify} onGoToIngestion={() => setActive('ingestion')}/>} {active === 'ingestion' && <Ingestion notify={notify} onNavigateToOverview={() => setActive('dashboard')}/>} {active === 'rootcause' && <RootCause notify={notify} onGoToIngestion={() => setActive('ingestion')}/>} {active === 'predictive' && <Predictive notify={notify}/>} {active === 'nlq' && <NLQ chat={chat} setChat={setChat} messages={messages} sendChat={sendChat}/>} {active === 'reports' && <Reports notify={notify}/>} {active === 'settings' && <SettingsView notify={notify} onOpenAccountCenter={(tab) => { setProfileActiveTab(tab); setProfileSlideOverOpen(true); }}/>}</div></main>
    {copilot && <Copilot onClose={() => setCopilot(false)} />}{!copilot && <button onClick={() => setCopilot(true)} className="fixed bottom-5 right-5 z-20 grid size-12 place-items-center rounded-full bg-[#315efb] text-white shadow-lg"><Bot size={20}/></button>}{toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#15213a] px-4 py-3 text-xs font-medium text-white shadow-xl">{toast}</div>}
>>>>>>> origin/main

    {/* Full Slide-Over Modal for Comprehensive Account & Workspace Center */}
    <ProfileSlideOver
      isOpen={profileSlideOverOpen}
      onClose={() => setProfileSlideOverOpen(false)}
      activeTab={profileActiveTab}
      setActiveTab={setProfileActiveTab}
      currentWorkspace={workspace}
      onSwitchWorkspace={(w) => setWorkspace(w)}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
      notify={notify}
      onSignOut={handleSignOut}
    />
  </div>
}

function Dashboard({ notify, onGoToIngestion }: { notify: (s: string) => void; onGoToIngestion: () => void }) { 
  return <DynamicOverview notify={notify} onGoToIngestion={onGoToIngestion} />
}

function Ingestion({ notify, onNavigateToOverview }: { notify: (s: string) => void; onNavigateToOverview: () => void }) {
  return (
    <>
      <Header
        eyebrow="Data foundation"
        title="Ingestion & storage"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2ff] px-2.5 py-1 text-[11px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
            <Database size={13} />
            FastAPI Pipeline
          </span>
        }
      />
      <DatasetUploader notify={notify} onNavigateToOverview={onNavigateToOverview} />
    </>
  );
}

function RootCause({ notify, onGoToIngestion }: { notify: (s: string) => void; onGoToIngestion?: () => void }) {
  return <RootCauseEngine notify={notify} onGoToIngestion={onGoToIngestion} />
}

function Predictive({ notify }: { notify: (s: string) => void }) {
  return (
    <>
      <Header
        eyebrow="Forward-looking intelligence"
        title="Predictive intelligence"
        action={
          <Badge tone="green">
            <Activity size={12} className="mr-1" /> Model updated today
          </Badge>
        }
      />
      <SalesForecastWhatIf onNotify={notify} />
    </>
  );
}

<<<<<<< HEAD
function NLQ({
  chat,
  setChat,
  messages,
  handleSendChat,
  isLoading,
}: {
  chat: string;
  setChat: (v: string) => void;
  messages: ChatMessage[];
  handleSendChat: (prompt?: string) => void;
  isLoading: boolean;
}) {
  const suggestedQueries = [
    'Why did sales drop in August?',
    'Which inventory item is losing money?',
    'Forecast next month’s sales.',
  ];

  return (
    <>
      <Header eyebrow="Your data, in plain English" title="Ask BizLens" />
      <Card className="mx-auto max-w-[950px] overflow-hidden shadow-sm">
        {/* Header / Intro bar */}
        <div className="border-b border-[#eef0f5] dark:border-[#1e293b] bg-[#fbfcff] dark:bg-[#131f3b] p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#e9efff] dark:bg-[#315efb]/20 text-[#315efb] dark:text-[#82a3ff]">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold">Live AI Business Intelligence</h2>
              <p className="mt-0.5 text-[11px] text-[#8791a5] dark:text-[#8e9bb5]">
                Powered by Google Gemini 2.5 Flash and grounded dynamically in your active dataset.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleSendChat(q)}
                className="rounded-full border border-[#dfe5ef] dark:border-[#28385a] bg-white dark:bg-[#0c1426] px-3 py-1.5 text-[11px] text-[#617089] dark:text-[#94a3b8] hover:border-[#315efb] hover:text-[#315efb] transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="min-h-[300px] max-h-[600px] overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="grid h-[240px] place-items-center text-center">
              <div>
                <Search size={26} className="mx-auto mb-3 text-[#b4bfd2]" />
                <p className="text-[13px] font-semibold text-[#15213a] dark:text-white">Ask anything about your business data</p>
                <p className="mt-1 text-[11px] text-[#8e99ab] max-w-sm mx-auto">
                  BizLens queries Google Gemini to extract trends, anomalies, SQL queries, and predictive recommendations.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-2">
                  {m.role === 'user' ? (
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-[#315efb] px-4 py-3 text-[12px] text-white shadow-sm leading-relaxed">
                      {m.content}
                    </div>
                  ) : (
                    <div
                      className={`mr-auto max-w-[90%] rounded-2xl rounded-bl-sm p-4 text-[12px] leading-relaxed shadow-sm ${
                        m.error
                          ? 'border border-[#fecaca] bg-[#fef2f2] dark:border-[#7f1d1d] dark:bg-[#450a0a] text-[#991b1b] dark:text-[#fca5a5]'
                          : 'border border-[#e9edf5] dark:border-[#1e293b] bg-[#f5f7fb] dark:bg-[#131f3b] text-[#2c384e] dark:text-[#e2e8f0]'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 font-semibold text-[#1b263b] dark:text-[#cbd5e1]">
                        {m.error ? (
                          <>
                            <AlertTriangle size={14} className="text-[#dc2626]" />
                            <span>System Notice</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-[#315efb]" />
                            <span>BizLens AI Analysis</span>
                          </>
                        )}
                      </div>

                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {m.sql && (
                        <div className="mt-3 rounded-lg border border-[#e1e6f0] dark:border-[#28385a] bg-white dark:bg-[#0c1426] p-3 font-mono text-[11px] text-[#334155] dark:text-[#93c5fd] overflow-x-auto">
                          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">Suggested SQL Query</div>
                          <code>{m.sql}</code>
                        </div>
                      )}

                      {m.followUps && m.followUps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0] dark:border-[#1e293b]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8791a5] mb-2">Suggested follow-ups</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.followUps.map((fu) => (
                              <button
                                key={fu}
                                onClick={() => handleSendChat(fu)}
                                className="rounded-md border border-[#cbd5e1] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-2.5 py-1 text-[10px] font-medium text-[#475569] dark:text-[#94a3b8] hover:border-[#315efb] hover:text-[#315efb] transition"
                              >
                                {fu} →
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="mr-auto flex items-center gap-2 rounded-xl bg-[#f5f7fb] dark:bg-[#131f3b] px-4 py-3 text-[12px] text-[#55627a] dark:text-[#94a3b8]">
                  <Loader2 size={16} className="animate-spin text-[#315efb]" />
                  <span>BizLens is querying Google Gemini AI...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-[#eef0f5] dark:border-[#1e293b] p-4">
          <div className="flex items-center gap-2 rounded-lg border border-[#dce3ef] dark:border-[#28385a] bg-white dark:bg-[#0c1426] px-3 py-2.5 focus-within:border-[#315efb]">
            <input
              value={chat}
              disabled={isLoading}
              onChange={(e) => setChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask anything about your business data, sales trends, or forecasts..."
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a0a9b8] dark:placeholder:text-[#64748b]"
            />
            <button
              onClick={() => handleSendChat()}
              disabled={isLoading || !chat.trim()}
              className="grid size-7 place-items-center rounded-md bg-[#315efb] text-white disabled:opacity-50 hover:bg-[#254edb] transition"
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#9aa3b3]">
            Connected to Gemini 2.5 Flash. Answers ground directly in your workspace telemetry.
          </p>
        </div>
      </Card>
    </>
  );
}

function Reports({ notify, workspace = 'My Coffee Shop' }: { notify: (s: string) => void; workspace?: string }) {
  const { uploadedData } = useDataset();
  const [selected, setSelected] = useState(['KPI Summary', 'Anomaly logs', 'Forecasts']);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MODULE_MAP: Record<string, string> = {
    'KPI Summary': 'kpi_summary',
    'Anomaly logs': 'anomaly_logs',
    'Evidence graphs': 'evidence_graphs',
    'Forecasts': 'forecasts',
  };

  const handleDownloadPDF = async () => {
    if (selected.length === 0) {
      notify('Please select at least one module for the report.');
      return;
    }
    setIsDownloadingPdf(true);
    setErrorMessage(null);
    notify('Generating PDF report...');
    try {
      const includedModules = selected.map((item) => MODULE_MAP[item] || item.toLowerCase().replace(/\s+/g, '_'));
      await downloadPDFReport({
        workspaceName: workspace,
        includedModules,
        datasetId: uploadedData?.dataset_id ?? undefined,
      });
      notify('PDF report downloaded successfully!');
    } catch (err: any) {
      const msg = err?.message || 'Failed to download PDF report.';
      console.error('PDF report download error:', err);
      setErrorMessage(msg);
      notify(`Download failed: ${msg}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCsv(true);
    setErrorMessage(null);
    notify('Preparing cleaned dataset CSV...');
    try {
      await downloadCleanedDatasetCSV(uploadedData?.dataset_id ?? undefined);
      notify('Cleaned dataset CSV downloaded successfully!');
    } catch (err: any) {
      const msg = err?.message || 'Failed to export cleaned dataset.';
      console.error('Dataset CSV export error:', err);
      setErrorMessage(msg);
      notify(`Export failed: ${msg}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleShareLink = async () => {
    setIsSharing(true);
    setErrorMessage(null);
    try {
      const includedModules = selected.map((item) => MODULE_MAP[item] || item.toLowerCase().replace(/\s+/g, '_'));
      const res = await createReportShareLink({
        workspaceName: workspace,
        includedModules: includedModules.length > 0 ? includedModules : ['kpi_summary'],
      });
      if (res?.share_url) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(res.share_url);
          notify('Share link copied to clipboard!');
        } else {
          notify(`Share link created: ${res.share_url}`);
        }
      }
    } catch (err: any) {
      console.error('Share link generation error:', err);
      notify('Dashboard link copied');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Header eyebrow="Share insights with your team" title="Reports & exports" />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Report modules</h2>
          <p className="mt-1 text-[11px] text-[#8791a5]">Choose what to include in your next report.</p>

          <div className="mt-5 flex flex-col gap-3">
            {['KPI Summary', 'Anomaly logs', 'Evidence graphs', 'Forecasts'].map((item) => (
              <button
                key={item}
                onClick={() =>
                  setSelected(
                    selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]
                  )
                }
                className="flex items-center gap-3 text-left text-[11px]"
              >
                <span
                  className={`grid size-5 place-items-center rounded border transition ${
                    selected.includes(item)
                      ? 'border-[#315efb] bg-[#315efb] text-white'
                      : 'border-[#d7deea] dark:border-[#26375a]'
                  }`}
                >
                  {selected.includes(item) && '✓'}
                </span>
                <span className="font-medium">{item}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertTriangle size={14} className="mr-1.5 inline shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="flex items-center justify-center rounded-lg bg-[#315efb] px-3 py-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#254edb] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={14} className="mr-2 inline animate-spin" /> Preparing PDF report...
                </>
              ) : (
                <>
                  <FileText size={14} className="mr-2 inline" /> Download PDF report
                </>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExportingCsv}
              className="flex items-center justify-center rounded-lg border border-[#dfe5ee] dark:border-[#26375a] px-3 py-2.5 text-[11px] font-semibold text-[#536079] dark:text-[#cbd5e1] hover:border-[#315efb] hover:text-[#315efb] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExportingCsv ? (
                <>
                  <Loader2 size={14} className="mr-2 inline animate-spin" /> Exporting CSV...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={14} className="mr-2 inline" /> Export cleaned dataset
                </>
              )}
            </button>
            <button
              onClick={handleShareLink}
              disabled={isSharing}
              className="flex items-center justify-center rounded-lg border border-[#dfe5ee] dark:border-[#26375a] px-3 py-2.5 text-[11px] font-semibold text-[#536079] dark:text-[#cbd5e1] hover:border-[#315efb] hover:text-[#315efb] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <>
                  <Loader2 size={14} className="mr-2 inline animate-spin" /> Creating link...
                </>
              ) : (
                'Share dashboard link'
              )}
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#eef0f5] dark:border-[#1e293b] bg-[#fbfcff] dark:bg-[#131f3b] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8791a5] dark:text-[#8ea7ff]">
                  Preview · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em]">{workspace} · Business brief</h2>
              </div>
              <Badge tone="green">Ready to export</Badge>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Revenue', '₹428k'],
                ['Growth', '+12.4%'],
                ['Alerts', '8'],
              ].map((x) => (
                <div key={x[0]} className="rounded-lg bg-[#f6f8fb] dark:bg-[#162340] p-3">
                  <p className="text-[10px] text-[#8791a5] dark:text-[#94a3b8]">{x[0]}</p>
                  <strong className="mt-1 block text-[16px]">{x[1]}</strong>
                </div>
              ))}
            </div>
            <div className="mt-5 h-28 rounded-lg bg-[#f5f7fb] dark:bg-[#162340] p-3">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold">
                <BarChart3 size={13} className="text-[#315efb]" /> Revenue performance
              </div>
              <div className="flex h-12 items-end gap-2">
                {[42, 55, 48, 70, 62, 84, 75, 92, 80, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-[#b5c4fa] dark:bg-[#315efb]/50" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-5 text-[10px] text-[#8994a8]">
              {selected.length} module{selected.length === 1 ? '' : 's'} included · Generated by BizLens AI
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

=======
function NLQ({ chat, setChat, messages, sendChat }: any) { return <><Header eyebrow="Your data, in plain English" title="Ask BizLens"/><Card className="mx-auto max-w-[900px] overflow-hidden"><div className="border-b border-[#eef0f5] bg-[#fbfcff] p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-[#e9efff] text-[#315efb]"><Bot size={18}/></div><div><h2 className="text-[14px] font-semibold">What would you like to know?</h2><p className="mt-1 text-[11px] text-[#8791a5]">Ask questions about your connected business data.</p></div></div><div className="mt-5 flex flex-wrap gap-2">{['Why did sales drop in August?','Which inventory item is losing money?','Forecast next month’s sales.'].map(q => <button onClick={() => setChat(q)} key={q} className="rounded-full border border-[#dfe5ef] bg-white px-3 py-2 text-[10px] text-[#617089] hover:border-[#315efb] hover:text-[#315efb]">{q}</button>)}</div></div><div className="min-h-[220px] p-5">{messages.length === 0 ? <div className="grid h-[190px] place-items-center text-center"><div><Search size={22} className="mx-auto mb-3 text-[#b4bfd2]"/><p className="text-[12px] font-semibold">Your answers will appear here</p><p className="mt-1 text-[11px] text-[#8e99ab]">Try one of the suggested questions to get started.</p></div></div> : <div className="flex flex-col gap-4">{messages.map((m: string) => <div key={m}><div className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-[#315efb] p-3 text-[11px] text-white">{m}</div><div className="mt-3 max-w-[80%] rounded-xl rounded-bl-sm bg-[#f0f3f8] p-4 text-[11px] leading-5 text-[#4f5c72]"><div className="mb-2 flex items-center gap-2 font-semibold text-[#26365d]"><Sparkles size={13} className="text-[#315efb]"/> BizLens analysis</div>Revenue dipped 24.5% in August, primarily driven by a North America inventory stockout. I found a 12-day supplier delivery hold on Leather Jackets, accounting for 18% of the decline.<div className="mt-3 rounded-lg border border-[#e1e6f0] bg-white p-3 font-mono text-[10px] text-[#69758c]">SELECT region, SUM(revenue)<br/>FROM sales WHERE month = 'August'<br/>GROUP BY region;</div></div></div>)}</div>}</div><div className="border-t border-[#eef0f5] p-4"><div className="flex items-center gap-2 rounded-lg border border-[#dce3ef] bg-white px-3 py-2 focus-within:border-[#315efb]"><input value={chat} onChange={e => setChat(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask anything about your business data..." className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a0a9b8]"/><button onClick={sendChat} className="grid size-7 place-items-center rounded-md bg-[#315efb] text-white"><Send size={13}/></button></div><p className="mt-2 text-center text-[9px] text-[#9aa3b3]">Answers are generated from your connected datasets. Always review before making decisions.</p></div></Card></> }

function Reports({ notify }: { notify: (s: string) => void }) { const [selected, setSelected] = useState(['KPI Summary','Anomaly logs','Forecasts']); return <><Header eyebrow="Share insights with your team" title="Reports & exports"/><div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]"><Card className="p-5"><h2 className="text-[14px] font-semibold">Report modules</h2><p className="mt-1 text-[11px] text-[#8791a5]">Choose what to include in your next report.</p><div className="mt-5 flex flex-col gap-3">{['KPI Summary','Anomaly logs','Evidence graphs','Forecasts'].map(item => <button key={item} onClick={() => setSelected(selected.includes(item) ? selected.filter(x => x !== item) : [...selected,item])} className="flex items-center gap-3 text-left text-[11px]"><span className={`grid size-5 place-items-center rounded border ${selected.includes(item) ? 'border-[#315efb] bg-[#315efb] text-white' : 'border-[#d7deea]'}`}>{selected.includes(item) && '✓'}</span><span className="font-medium">{item}</span></button>)}</div><div className="mt-7 flex flex-col gap-2"><button onClick={() => notify('PDF report prepared for download')} className="rounded-lg bg-[#315efb] px-3 py-2.5 text-[11px] font-semibold text-white"><FileText size={14} className="mr-2 inline"/> Download PDF report</button><button onClick={() => notify('Cleaned CSV export prepared')} className="rounded-lg border border-[#dfe5ee] px-3 py-2.5 text-[11px] font-semibold text-[#536079]"><FileSpreadsheet size={14} className="mr-2 inline"/> Export cleaned dataset</button><button onClick={() => notify('Dashboard link copied')} className="rounded-lg border border-[#dfe5ee] px-3 py-2.5 text-[11px] font-semibold text-[#536079]">Share dashboard link</button></div></Card><Card className="overflow-hidden"><div className="border-b border-[#eef0f5] bg-[#fbfcff] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#8791a5]">Preview · September 17, 2024</p><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em]">My Coffee Shop · Business brief</h2></div><Badge tone="green">Ready to export</Badge></div></div><div className="p-5"><div className="grid grid-cols-3 gap-3">{[['Revenue','₹428k'],['Growth','+12.4%'],['Alerts','8']].map(x => <div key={x[0]} className="rounded-lg bg-[#f6f8fb] p-3"><p className="text-[10px] text-[#8791a5]">{x[0]}</p><strong className="mt-1 block text-[16px]">{x[1]}</strong></div>)}</div><div className="mt-5 h-28 rounded-lg bg-[#f5f7fb] p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold"><BarChart3 size={13} className="text-[#315efb]"/> Revenue performance</div><div className="flex h-12 items-end gap-2">{[42,55,48,70,62,84,75,92,80,100].map((h,i) => <div key={i} className="flex-1 rounded-t bg-[#b5c4fa]" style={{height:`${h}%`}}/>)}</div></div><p className="mt-5 text-[10px] text-[#8994a8]">{selected.length} modules included · Generated by BizLens AI</p></div></Card></div></> }
>>>>>>> origin/main

function SettingsView({ notify, onOpenAccountCenter }: { notify: (s: string) => void; onOpenAccountCenter?: (tab: string) => void }) { 
  return <>
    <Header eyebrow="Workspace controls" title="Settings" action={
      onOpenAccountCenter && (
        <button 
          onClick={() => onOpenAccountCenter('profile')}
          className="flex items-center gap-2 rounded-lg bg-[#315efb] px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#254edb] transition"
        >
          <ShieldCheck size={14} /> Open Full Account Center
        </button>
      )
    }/>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-[14px] font-semibold">Workspace settings</h2>
        <p className="mt-1 text-[11px] text-[#8791a5]">Manage how BizLens understands your business.</p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="text-[11px] font-semibold">Workspace name
            <input defaultValue="My Coffee Shop" className="mt-2 w-full rounded-lg border border-[#dfe5ee] dark:border-[#26375a] dark:bg-[#0c1426] px-3 py-2.5 text-[12px] font-normal outline-none focus:border-[#315efb]"/>
          </label>
          <label className="text-[11px] font-semibold">Industry
            <select className="mt-2 w-full rounded-lg border border-[#dfe5ee] dark:border-[#26375a] dark:bg-[#0c1426] bg-white px-3 py-2.5 text-[12px] font-normal outline-none">
              <option>Retail & e-commerce</option>
              <option>Food & beverage</option>
              <option>Professional services</option>
            </select>
          </label>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => notify('Workspace settings saved')} className="rounded-lg bg-[#315efb] px-4 py-2 text-[11px] font-semibold text-white">Save changes</button>
            {onOpenAccountCenter && (
              <button onClick={() => onOpenAccountCenter('team')} className="rounded-lg border border-[#dfe5ee] dark:border-[#26375a] px-3 py-2 text-[11px] font-semibold hover:border-[#315efb] text-[#536079] dark:text-[#cbd5e1]">Manage Team Seats →</button>
            )}
          </div>
        </div>
      </Card>
      
      <Card className="p-5">
        <h2 className="text-[14px] font-semibold">Connected services & Integrations</h2>
        <p className="mt-1 text-[11px] text-[#8791a5]">Your data and intelligence layer connections.</p>
        <div className="mt-5 flex flex-col gap-3">
          {[
            ['Python & AI engine','Connected','bg-[#e8f8f0] text-[#14885c]',Bot,'data'],
            ['Data warehouse','Connected','bg-[#e8f8f0] text-[#14885c]',Database,'data'],
            ['API Keys & Webhooks','Configured','bg-[#edf2ff] text-[#315efb]',Key,'api'],
            ['Notification delivery','Active','bg-[#e8f8f0] text-[#14885c]',Bell,'notifications']
          ].map(([name,status,color,Icon,tabKey]) => (
            <div 
              key={name as string} 
              onClick={() => onOpenAccountCenter && onOpenAccountCenter(tabKey as string)}
              className="flex items-center gap-3 rounded-lg border border-[#edf0f5] dark:border-[#1e293b] p-3 hover:border-[#315efb] cursor-pointer transition"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-[#f0f3f8] dark:bg-[#162340] text-[#65738b] dark:text-[#8ea7ff]">
                <Icon size={15}/>
              </div>
              <span className="flex-1 text-[11px] font-semibold">{name as string}</span>
              <Badge tone={status === 'Connected' || status === 'Active' ? 'green' : 'blue'}>{status as string}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </> 
}
<<<<<<< HEAD
function Copilot({
  onClose,
  messages,
  handleSendChat,
  isLoading,
}: {
  onClose: () => void;
  messages: ChatMessage[];
  handleSendChat: (prompt?: string) => void;
  isLoading: boolean;
}) {
  const [drawerInput, setDrawerInput] = useState('');

  const handleDrawerSubmit = () => {
    if (!drawerInput.trim() || isLoading) return;
    handleSendChat(drawerInput.trim());
    setDrawerInput('');
  };

  const suggestedDrawerSteps = [
    'Why did North America drop?',
    'Show products at risk',
    'Forecast October revenue',
  ];

  const latestAiMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <aside className="fixed bottom-0 right-0 top-[66px] z-30 hidden w-[320px] border-l border-[#e3e7ef] dark:border-[#1e293b] bg-white dark:bg-[#0c1426] lg:flex flex-col shadow-lg">
      <div className="flex items-center justify-between border-b border-[#edf0f5] dark:border-[#1e293b] p-4">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-[#e9efff] dark:bg-[#315efb]/20 text-[#315efb] dark:text-[#82a3ff]">
            <Bot size={15} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#15213a] dark:text-white">AI Co-pilot</p>
            <p className="text-[9px] text-[#8c97aa]">Live Gemini 2.5 Flash</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#94a0b4] hover:text-[#15213a] dark:hover:text-white"
          aria-label="Close AI assistant"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
        {latestAiMessage ? (
          <div
            className={`rounded-xl p-3 text-[11px] leading-relaxed shadow-sm ${
              latestAiMessage.error
                ? 'border border-[#fecaca] bg-[#fef2f2] dark:border-[#7f1d1d] dark:bg-[#450a0a] text-[#991b1b] dark:text-[#fca5a5]'
                : 'border border-[#e9edf5] dark:border-[#1e293b] bg-[#f5f7fb] dark:bg-[#131f3b] text-[#536079] dark:text-[#cbd5e1]'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#26365d] dark:text-white">
              <Sparkles size={13} className="text-[#315efb]" /> Latest Intelligence
            </div>
            <div className="whitespace-pre-wrap">{latestAiMessage.content}</div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e9edf5] dark:border-[#1e293b] bg-[#f5f7fb] dark:bg-[#131f3b] p-3 text-[11px] leading-relaxed text-[#536079] dark:text-[#cbd5e1]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#26365d] dark:text-white">
              <Sparkles size={13} className="text-[#315efb]" /> Ready for Analysis
            </div>
            Ask any question to generate custom business insights, forecasts, or SQL scripts using live Gemini.
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8994a8] mb-2">
            Suggested next steps
          </p>
          <div className="flex flex-col gap-2">
            {suggestedDrawerSteps.map((q) => (
              <button
                key={q}
                onClick={() => handleSendChat(q)}
                disabled={isLoading}
                className="flex items-center justify-between rounded-lg border border-[#e5e9f0] dark:border-[#1e293b] px-3 py-2 text-left text-[11px] text-[#637087] dark:text-[#94a3b8] hover:border-[#315efb] hover:text-[#315efb] transition disabled:opacity-50"
              >
                <span>{q}</span>
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#edf0f5] dark:border-[#1e293b] p-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#dfe5ef] dark:border-[#28385a] px-3 py-2">
          <input
            value={drawerInput}
            disabled={isLoading}
            onChange={(e) => setDrawerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDrawerSubmit()}
            placeholder="Ask follow-up..."
            className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
          />
          <button
            onClick={handleDrawerSubmit}
            disabled={isLoading || !drawerInput.trim()}
            className="text-[#315efb] disabled:opacity-40"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
=======
function Copilot({ onClose }: { onClose: () => void }) { return <aside className="fixed bottom-0 right-0 top-[66px] z-30 hidden w-[292px] border-l border-[#e3e7ef] bg-white lg:block"><div className="flex items-center justify-between border-b border-[#edf0f5] p-4"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-lg bg-[#e9efff] text-[#315efb]"><Bot size={15}/></div><div><p className="text-[12px] font-semibold">AI co-pilot</p><p className="text-[9px] text-[#8c97aa]">Synchronized to Overview</p></div></div><button onClick={onClose} className="text-[#94a0b4]" aria-label="Close AI assistant"><X size={16}/></button></div><div className="flex h-[calc(100%-65px)] flex-col p-4"><div className="rounded-xl bg-[#f5f7fb] p-3 text-[11px] leading-5 text-[#536079]"><div className="mb-2 flex items-center gap-2 font-semibold text-[#26365d]"><Sparkles size={13} className="text-[#315efb]"/> Morning briefing</div>Your business is tracking <strong>12.4% above</strong> last month. I found one critical anomaly in North America revenue linked to an inventory stockout.</div><p className="mt-5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8994a8]">Suggested next steps</p><div className="flex flex-col gap-2">{['Why did North America drop?','Show products at risk','Forecast October revenue'].map(q => <button key={q} className="rounded-lg border border-[#e5e9f0] px-3 py-2 text-left text-[10px] text-[#637087] hover:border-[#315efb] hover:text-[#315efb]">{q}<ChevronRight size={12} className="float-right"/></button>)}</div><div className="mt-auto flex items-center gap-2 rounded-lg border border-[#dfe5ef] px-3 py-2"><input placeholder="Ask follow-up..." className="min-w-0 flex-1 text-[10px] outline-none"/><Send size={13} className="text-[#315efb]"/></div></div></aside> }
>>>>>>> origin/main
