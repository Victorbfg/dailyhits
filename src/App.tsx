/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  CheckCircle2, 
  Circle, 
  Terminal, 
  Calendar, 
  Flame, 
  BookOpen,
  ArrowRight,
  ChevronRight,
  Sun,
  Moon,
  Layout,
  Plus,
  Settings,
  User,
  TrendingUp,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { DailyData, Entry, Task } from './types';
import { 
  loadData, 
  getTodayKey, 
  getStreak, 
  addTask, 
  toggleTask, 
  updateJournal,
  updateQuote,
  startDay,
  applyTemplate,
  resetDay,
  clearTasks,
  reorderTasks
} from './lib/dailyHitsStore';


const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-[10px] font-mono text-secondary font-bold uppercase tracking-widest leading-none">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

export default function App() {
  const [data, setData] = useState<DailyData>({});
  const [activeView, setActiveView] = useState<'dashboard' | 'archive' | 'profile' | 'settings' | 'protocols'>('dashboard');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [editingTemplate, setEditingTemplate] = useState<{name: string, originalName: string, tasks: string[]} | null>(null);
  const [archiveFilter, setArchiveFilter] = useState('all');
  const [selectedArchiveEntry, setSelectedArchiveEntry] = useState<Entry | null>(null);
  const [pendingQuote, setPendingQuote] = useState('');
  const [pendingJournal, setPendingJournal] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusConfig, setFocusConfig] = useState({ hours: 0, minutes: 25 });

  // Profile and Protocols State
  const [templates, setTemplates] = useState<{ [key: string]: string[] }>(() => {
    const saved = localStorage.getItem('habit_templates');
    const data = saved ? JSON.parse(saved) : {
      health: ["Drink 2L Water", "45min Exercise", "Meditation 10min"],
      work: ["Deep Work 90min", "Clear Inbox", "Plan Tomorrow"],
      finance: ["Track Expenses", "Review Budget", "Check Investments"]
    };
    
    // Migration: ensure 'zen' is renamed to 'finance' if it exists in historical data
    if (data.zen) {
      data.finance = data.zen;
      delete data.zen;
    }
    
    return data;
  });

  useEffect(() => {
    localStorage.setItem('habit_templates', JSON.stringify(templates));
  }, [templates]);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : {
      firstName: 'User',
      lastName: '01',
      bio: 'Optimizing daily frequency and maintaining architectural standards in consistency.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80',
      weeklyTransmissions: true,
      realTimeEcho: false
    };
  });

  const [showAvatarGallery, setShowAvatarGallery] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80'
  ];

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && focusTime > 0) {
      interval = window.setInterval(() => {
        setFocusTime((prev) => prev - 1);
      }, 1000);
    } else if (focusTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // You could add a sound notification here
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, focusTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startFocus = () => {
    const totalSeconds = (focusConfig.hours * 3600) + (focusConfig.minutes * 60);
    if (totalSeconds > 0) {
      setFocusTime(totalSeconds);
      setIsTimerRunning(true);
      setIsFocusMode(true);
    }
  };

  const stopFocus = () => {
    setIsTimerRunning(false);
    setIsFocusMode(false);
  };

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
  }, []);

  useEffect(() => {
    const checkDay = () => {
      const today = getTodayKey();
      if (Object.keys(data).length > 0 && !data[today]) {
        setData(prev => startDay(prev));
      }
    };
    const timer = setInterval(checkDay, 60000); // Check every minute instead of second
    checkDay();
    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const todayKey = getTodayKey();
  const todayEntry: Entry = data[todayKey] || { tasks: [], journal: '', quote: '', date: todayKey };
  const streak = getStreak(data);
  const history = (Object.values(data) as Entry[])
    .filter(e => e.date !== todayKey)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

const historyDays = (Object.values(data) as Entry[])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .reverse();

  const handlePlusClick = () => {
    setShowPlusMenu(!showPlusMenu);
  };

  const progress = todayEntry?.tasks?.length > 0 
    ? Math.round((todayEntry.tasks.filter(t => t.done).length / todayEntry.tasks.length) * 100) 
    : 0;

  const totalHits = (Object.values(data) as Entry[]).reduce((acc, curr) => acc + (curr?.tasks?.length || 0), 0);
  const totalJournals = (Object.values(data) as Entry[]).filter(e => e.journal).length;
  
  const chartData = useMemo(() => {
    return historyDays.map(entry => ({
      name: entry.date.split('-').slice(1).join('/'),
      val: entry.tasks.length > 0 ? Math.round((entry.tasks.filter(t => t.done).length / entry.tasks.length) * 100) : 0
    }));
  }, [historyDays]);

  return (
    <div className="min-h-screen text-[var(--on-surface)] transition-colors duration-300 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-[#F9F3E4]/60 backdrop-blur-lg border-b border-white/40 h-20 flex justify-between items-center px-8 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-12">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="text-xl font-extrabold text-stone-900 tracking-tighter hover:opacity-70 transition-opacity"
          >
            Daily Hits
          </button>
          <div className="hidden lg:flex gap-6 text-sm font-medium tracking-tight h-full">
            <button onClick={() => setActiveView('dashboard')} className={`transition-colors h-full flex items-center px-2 py-1 ${activeView === 'dashboard' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Dashboard</button>
            <button onClick={() => setActiveView('protocols')} className={`transition-colors h-full flex items-center px-2 py-1 ${activeView === 'protocols' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Protocols</button>
            <button onClick={() => setActiveView('archive')} className={`transition-colors h-full flex items-center px-2 py-1 ${activeView === 'archive' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Archive</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-white/20 rounded-full transition-all text-stone-600"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`p-2 hover:bg-white/20 rounded-full transition-all text-stone-600 ${activeView === 'settings' ? 'bg-white/30' : ''}`}
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white flex items-center justify-center transition-all ${activeView === 'profile' ? 'ring-2 ring-secondary' : ''}`}
          >
             <img 
               src="https://img.icons8.com/?size=100&id=85050&format=png&color=000000" 
               alt="Profile" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-20 h-screen overflow-hidden">
        {/* Settings Sidebar */}
        <AnimatePresence>
          {activeView === 'settings' && (
            <motion.aside 
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="w-64 p-6 flex flex-col gap-2 bg-stone-50/40 backdrop-blur-xl border-r border-white/40 z-40 overflow-y-auto"
            >
              <div className="mb-8 px-4">
                <p className="text-lg font-semibold text-stone-800">Settings</p>
                <p className="text-xs text-stone-500">Manage your workspace</p>
              </div>
              <nav className="flex flex-col gap-2">
                <button className="flex items-center gap-3 px-4 py-2 text-stone-600 hover:bg-stone-200/30 rounded-full transition-all text-left">
                  <Settings size={18} />
                  <span className="text-sm">General</span>
                </button>
                <button 
                  onClick={() => setData(prev => resetDay(prev))}
                  className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-all text-left"
                >
                  <TrendingUp size={18} className="rotate-180" />
                  <span className="text-sm">Reset Today</span>
                </button>
                <button className="flex items-center gap-3 px-4 py-2 bg-stone-900 text-stone-50 rounded-full font-bold shadow-lg transition-all text-left">
                  <User size={18} />
                  <span className="text-sm">Account</span>
                </button>
              </nav>
              <div className="mt-auto pt-6">
                <button className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-xl font-semibold text-sm hover:opacity-90 transition-all">
                  Sync Cloud
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className={`flex-1 overflow-y-auto invisible-scrollbar w-full transition-all duration-300 ${activeView === 'settings' ? 'ml-0' : ''}`}>
          <div className="max-w-[1920px] mx-auto p-8">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-12 gap-8"
                >
                  {/* Left Column: Primary Content */}
                  <div className="col-span-12 lg:col-span-9 space-y-8">
                    {/* Hero Section */}
                    <section className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Welcome back.</h1>
                        <p className="text-lg text-tertiary">Here's what's happening in your department today.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                            <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">HITS DONE</span>
                            <span className="text-xl font-bold">{todayEntry.tasks.filter(t => t.done).length} / {todayEntry.tasks.length}</span>
                            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary glowing-bar transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                             <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">ARCHIVED</span>
                             <span className="text-xl font-bold">{totalHits - todayEntry.tasks.length}</span>
                             <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary glowing-bar transition-all" style={{ width: `${Math.min((totalHits / 1000) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                            <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">JOURNALED</span>
                            <span className="text-xl font-bold">{totalJournals}</span>
                            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary glowing-bar transition-all" style={{ width: `${Math.min((totalJournals / 100) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">STREAK</span>
                              <Flame size={14} className={streak > 0 ? 'text-orange-500 animate-pulse' : 'text-stone-300'} />
                            </div>
                            <span className="text-xl font-bold">{streak} DAYS</span>
                            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-orange-500 transition-all duration-1000" 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
                              />
                            </div>
                            {streak > 0 && (
                              <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Flame size={64} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Circular Time Tracker Card */}
                      <div className="w-full md:w-64 glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">SYSTEM STATUS</span>
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-white/20" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                            <motion.circle 
                              className="text-secondary glowing-bar" 
                              cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"
                              strokeDasharray="364.4"
                              initial={{ strokeDashoffset: 364.4 }}
                              animate={{ strokeDashoffset: 364.4 - (364.4 * Math.min(progress, 100) / 100) }}
                              transition={{ duration: 1 }}
                            ></motion.circle>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">{progress}%</span>
                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">OPTIMAL</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsFocusMode(true)}
                          className="bg-secondary text-white px-8 py-2 rounded-full text-xs font-bold hover:shadow-lg transition-shadow"
                        >
                          FOCUS MODE
                        </button>
                      </div>
                    </section>

                    {/* Middle Section: Progress & Calendar */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                      {/* Progress Card */}
                      <div className="md:col-span-3 glass-panel p-8 rounded-3xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div className="flex justify-between items-end relative z-10">
                          <div className="space-y-1">
                            <h3 className="text-3xl font-semibold text-white italic tracking-tight">Progress Board</h3>
                            <p className="text-[11px] font-medium text-white uppercase tracking-[0.25em]">Cognitive Calibration</p>
                          </div>
                          <div className="text-right p-4 rounded-3xl">
                             <span className="text-4xl font-semibold text-white leading-none">{Math.round(progress)}%</span>
                             <p className="text-[9px] font-bold text-white uppercase tracking-[0.2em] mt-1">Total Conquest</p>
                          </div>
                        </div>

                        {/* High/Low Frequency Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 relative z-10">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-stone-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                High Frequency
                              </span>
                              <span>{todayEntry.tasks.filter(t => t.done).length} Tasks</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100/50 rounded-full overflow-hidden border border-white/40">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-secondary shadow-[0_0_15px_rgba(30,30,30,0.1)]"
                              />
                            </div>
                            <p className="text-[10px] italic text-stone-400 leading-relaxed">Systematic execution of core protocols.</p>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-stone-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Low Frequency
                              </span>
                              <span>{todayEntry.tasks.filter(t => !t.done).length} Pending</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100/50 rounded-full overflow-hidden border border-white/40">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${100 - progress}%` }}
                                className="h-full bg-amber-200/40"
                              />
                            </div>
                            <p className="text-[10px] italic text-stone-400 leading-relaxed">Secondary objectives awaiting optimization.</p>
                          </div>
                        </div>

                        {/* Recent Activity Line Chart */}
                        <div className="pt-6 space-y-4 relative z-10">
                           <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">7-Day Trajectory</span>
                           </div>
                           <div className="h-40 w-full relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                  <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                  <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 8, fill: '#A8A29E', fontWeight: 700 }}
                                    dy={10}
                                  />
                                  <YAxis hide domain={[0, 100]} />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                      borderRadius: '16px', 
                                      border: '1px solid rgba(0,0,0,0.05)',
                                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke="var(--color-secondary)" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorVal)" 
                                    animationDuration={1500}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="flex justify-between text-[8px] text-stone-400 font-bold uppercase tracking-[0.2em] px-1">
                             <span>HISTORY</span><span>NOW</span>
                           </div>
                        </div>
                      </div>

                      {/* Calendar Card */}
                      <div className="md:col-span-2 glass-panel p-6 rounded-3xl relative">
                        <div className="absolute top-8 right-24 pointer-events-none opacity-60">
                          <DigitalClock />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">
                            {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </h3>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                              className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <ArrowRight size={16} className="rotate-180" />
                            </button>
                            <button 
                              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                              className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 mb-2">
                          <span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span><span>SU</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {Array.from({ 
                            length: (new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0).getDay()) 
                          }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-2"></div>
                          ))}
                          {Array.from({ 
                            length: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate() 
                          }).map((_, i) => {
                            const day = i + 1;
                            const d = new Date();
                            const isToday = day === d.getDate() && 
                                          calendarDate.getMonth() === d.getMonth() && 
                                          calendarDate.getFullYear() === d.getFullYear();
                            return (
                              <span 
                                key={day} 
                                className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                                  isToday 
                                    ? 'bg-secondary text-white font-bold' 
                                    : 'hover:bg-stone-100'
                                }`}
                              >
                                {day}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Active Hits Section */}
                    <section className="glass-panel p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-12">
                      <div className="md:w-1/3 space-y-6">
                        <h3 className="text-xl font-bold">Active Hits</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                            <span>TODAY'S PROGRESS</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/40 rounded-full">
                            <motion.div 
                              className="h-full bg-secondary glowing-bar rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/20">
                          <p className="text-sm text-stone-500 leading-relaxed italic">Complete your daily routine to maintain cognitive output and system efficiency.</p>
                        </div>
                      </div>
                      <div className="flex-1 glass-panel bg-white/20 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                              <CheckCircle2 size={24} className="text-secondary" />
                            </div>
                            <div>
                              <h4 className="font-bold flex items-center gap-2">
                                {activeCategory ? (
                                  <span className="capitalize">{activeCategory} Protocol</span>
                                ) : (
                                  "Daily Tasks"
                                )}
                                {activeCategory && (
                                  <button 
                                    onClick={() => setActiveCategory(null)}
                                    className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full hover:bg-stone-300 transition-colors"
                                  >
                                    Show All
                                  </button>
                                )}
                              </h4>
                              <p className="text-xs text-stone-500">
                                {activeCategory 
                                  ? `${todayEntry.tasks.filter(t => t.done && t.category === activeCategory).length} of ${todayEntry.tasks.filter(t => t.category === activeCategory).length} hits completed` 
                                  : `${todayEntry.tasks.filter(t => t.done).length} of ${todayEntry.tasks.length} hits completed`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        <ul className="space-y-4 max-h-[300px] overflow-y-auto invisible-scrollbar">
                          {(activeCategory 
                            ? todayEntry.tasks.map((t, i) => ({ ...t, originalIndex: i })).filter(t => t.category === activeCategory)
                            : todayEntry.tasks.map((t, i) => ({ ...t, originalIndex: i }))
                           ).length === 0 ? (
                            <li className="text-sm text-stone-400 italic py-4 text-center">No tasks assigned for this view.</li>
                          ) : (
                            (activeCategory 
                              ? todayEntry.tasks.map((t, i) => ({ ...t, originalIndex: i })).filter(t => t.category === activeCategory)
                              : todayEntry.tasks.map((t, i) => ({ ...t, originalIndex: i }))
                            ).map((task, i, filteredList) => (
                              <li key={task.originalIndex} className="flex items-center gap-3 text-sm group">
                                <button 
                                  onClick={() => setData(prev => toggleTask(prev, task.originalIndex))}
                                  className="focus:outline-none"
                                >
                                  {task.done ? (
                                    <CheckCircle2 size={20} className="text-secondary" />
                                  ) : (
                                    <Circle size={20} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                                  )}
                                </button>
                                <span className={`flex-1 transition-all ${task.done ? 'text-stone-400 line-through' : 'font-semibold'}`}>
                                  {task.text}
                                </span>
                                
                                {/* Reordering Controls */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    disabled={i === 0}
                                    onClick={() => setData(prev => reorderTasks(prev, task.originalIndex, filteredList[i-1].originalIndex))}
                                    className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30"
                                    title="Move Up"
                                  >
                                    <ArrowRight size={14} className="-rotate-90" />
                                  </button>
                                  <button 
                                    disabled={i === filteredList.length - 1}
                                    onClick={() => setData(prev => reorderTasks(prev, task.originalIndex, filteredList[i+1].originalIndex))}
                                    className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30"
                                    title="Move Down"
                                  >
                                    <ArrowRight size={14} className="rotate-90" />
                                  </button>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </section>

                    {/* Daily Quotes Section */}
                    <section 
                      onClick={() => {
                        setPendingQuote(todayEntry.quote || '');
                        setShowQuoteModal(true);
                      }}
                      className="relative rounded-[2.5rem] overflow-hidden min-h-[300px] glass-panel p-8 flex flex-col justify-end bg-stone-900 text-stone-100 cursor-pointer group hover:scale-[1.01] transition-transform"
                    >
                       <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                       <div className="relative z-10 space-y-4 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-secondary px-2 py-0.5 rounded text-white group-hover:bg-amber-500 transition-colors">DAILY QUOTES</span>
                            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{todayKey}</span>
                          </div>
                          <p className={`text-3xl font-light italic leading-snug ${todayEntry.quote ? 'opacity-100' : 'opacity-30'}`}>
                            {todayEntry.quote ? `"${todayEntry.quote}"` : '"No thought-of-the-day recorded. Capture your daily quote."'}
                          </p>

                       </div>
                    </section>

                    {/* Daily Journal Section */}
                    <section 
                      onClick={() => {
                        setPendingJournal(todayEntry.journal || '');
                        setShowJournalModal(true);
                      }}
                      className="relative rounded-[2.5rem] overflow-hidden min-h-[300px] glass-panel p-8 flex flex-col justify-end bg-white text-stone-900 cursor-pointer group hover:scale-[1.01] transition-transform border border-stone-100"
                    >
                       <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-multiply"></div>
                       <div className="relative z-10 space-y-4 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-stone-900 px-2 py-0.5 rounded text-white group-hover:bg-secondary transition-colors">NEW JOURNAL</span>
                            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{todayKey}</span>
                          </div>
                          <p className={`text-2xl font-medium leading-relaxed line-clamp-4 ${todayEntry.journal ? 'opacity-100' : 'opacity-30'}`}>
                            {todayEntry.journal ? todayEntry.journal : 'Synchronize your mental state. No entry for today...'}
                          </p>

                       </div>
                    </section>
                  </div>

                  {/* Right Column: Stats & Secondary Panels */}
                  <div className="col-span-12 lg:col-span-3 space-y-8">
                    {/* Quick Metrics */}
                    <div className="glass-panel p-8 rounded-[2.5rem] space-y-8 h-fit">
                      <div>
                        <span className="text-5xl font-light tracking-tighter">{totalHits}</span>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">TOTAL HITS</p>
                      </div>
                      <div>
                        <span className="text-5xl font-light tracking-tighter">{totalJournals}</span>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">JOURNAL LOGS</p>
                      </div>
                      <div className="relative group">
                        <span className="text-5xl font-light tracking-tighter text-orange-500">{streak}</span>
                        <div className="absolute -right-4 top-0">
                           <Flame size={20} className="text-orange-500 fill-orange-500" />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">CURRENT STREAK</p>
                      </div>
                    </div>

                    {/* Side Sections */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-4">
                           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">TEMPLATES</span>
                           <button 
                             onClick={() => {
                               setEditingTemplate({ 
                                 name: 'New Protocol', 
                                 originalName: '', 
                                 tasks: ['New Metric'] 
                               });
                               setShowTemplateModal(true);
                             }}
                             className="p-1.5 bg-stone-900 text-white rounded-lg hover:scale-105 transition-all shadow-md"
                             title="Add Template"
                           >
                             <Plus size={14} />
                           </button>
                        </div>
                       {Object.entries(templates).map(([key, tasks]) => (
                          <div key={key} className="flex gap-2">
                            <button 
                              onClick={() => {
                                // If tasks for this category don't exist yet, apply it
                                if (!todayEntry.tasks.some(t => t.category === key)) {
                                  setData(prev => applyTemplate(prev, tasks as string[], key));
                                }
                                setActiveCategory(key);
                              }}
                              className={`flex-1 glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-all text-left ${activeCategory === key ? 'ring-2 ring-stone-900 bg-white/60' : ''}`}
                            >
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-[#F9F3E4] rounded-lg flex items-center justify-center">
                                    {key.toLowerCase() === 'health' ? (
                                      <img 
                                        src="https://img.icons8.com/?size=100&id=86722&format=png&color=000000" 
                                        alt="Health" 
                                        className="w-[18px] h-[18px] object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : key.toLowerCase() === 'work' ? (
                                      <img 
                                        src="https://img.icons8.com/?size=100&id=91898&format=png&color=000000" 
                                        alt="Work" 
                                        className="w-[18px] h-[18px] object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : key.toLowerCase() === 'finance' ? (
                                      <img 
                                        src="https://img.icons8.com/?size=100&id=87086&format=png&color=000000" 
                                        alt="Finance" 
                                        className="w-[18px] h-[18px] object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Layout size={18} className="text-secondary" />
                                    )}
                                  </div>
                                  <span className="text-sm font-bold capitalize">{key}</span>
                               </div>
                               <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingTemplate({ 
                                  name: key, 
                                  originalName: key, 
                                  tasks: [...(tasks as string[])] 
                                });
                                setShowTemplateModal(true);
                              }}
                              className="p-4 glass-panel rounded-2xl hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-all"
                              title="Edit Template"
                            >
                              <Edit3 size={18} />
                            </button>
                          </div>
                       ))}
                    </div>

                    {/* Insight Section */}
                    <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] glass-panel p-6 flex flex-col justify-end group">
                      <img 
                        src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?auto=format&fit=crop&q=80" 
                        alt="Collaboration" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="relative z-10 space-y-2">
                        <span className="text-[10px] font-bold text-white bg-secondary px-2 py-0.5 rounded tracking-widest">SYSTEM INSIGHT</span>
                        <h4 className="text-xl font-bold text-white">Q2 Performance</h4>
                        <p className="text-xs text-white/80 leading-relaxed">Your consistency has increased by 12% compared to last period. Maintaining peak flow.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'archive' && (
                <motion.div
                  key="archive"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-end">
                    <h2 className="text-3xl font-headline-xl text-stone-900 italic">Chronicles</h2>
                    <div className="flex gap-2">
                       {['all', 'hits', 'journal', 'quotes'].map(f => (
                         <button 
                           key={f}
                           onClick={() => setArchiveFilter(f)}
                           className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all capitalize ${
                             archiveFilter === f 
                               ? 'bg-stone-900 text-white shadow-lg scale-105' 
                               : 'glass-panel text-stone-500 hover:bg-stone-100'
                           }`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history
                      .filter(entry => {
                        if (archiveFilter === 'hits') return entry.tasks.length > 0;
                        if (archiveFilter === 'journal') return !!entry.journal;
                        if (archiveFilter === 'quotes') return !!entry.quote;
                        return true;
                      })
                      .length === 0 ? (
                      <div className="col-span-full py-20 text-center text-stone-400 italic">No historical data matches this filter.</div>
                    ) : (
                      history
                        .filter(entry => {
                          if (archiveFilter === 'hits') return entry.tasks.length > 0;
                          if (archiveFilter === 'journal') return !!entry.journal;
                          if (archiveFilter === 'quotes') return !!entry.quote;
                          return true;
                        })
                        .map((entry) => {
                          const tasksDone = entry.tasks.filter(t => t.done).length;
                          const total = entry.tasks.length;
                          const eProgress = total > 0 ? (tasksDone / total) * 100 : 0;
                          return (
                            <motion.div 
                              layout
                              key={entry.date} 
                              onClick={() => setSelectedArchiveEntry(entry)}
                              className="glass-panel p-6 rounded-3xl space-y-4 hover:bg-white/60 transition-all cursor-pointer group border border-transparent hover:border-stone-200"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-stone-400">{entry.date}</span>
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                                  eProgress === 100 ? 'bg-secondary text-white border-secondary' : 'bg-white text-stone-400 border-stone-100'
                                }`}>
                                  {Math.round(eProgress)}%
                                </div>
                              </div>
                              <div className="space-y-3">
                                {entry.quote && (
                                  <p className="text-[10px] italic text-amber-600 font-bold border-l-2 border-amber-200 pl-3 py-1">"{entry.quote}"</p>
                                )}
                                {entry.journal ? (
                                  <p className="text-sm font-medium text-stone-700 line-clamp-3 italic min-h-[4rem] leading-relaxed">
                                    "{entry.journal}"
                                  </p>
                                ) : (
                                  <div className="h-[4rem] flex items-center justify-center border border-dashed border-stone-200 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-300 font-bold">No Entry Data</p>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Protocol Efficiency</span>
                                  <span className="text-[8px] font-mono text-stone-500">{tasksDone}/{total} HITS</span>
                                </div>
                                <div className="flex gap-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                                  {entry.tasks.length > 0 ? entry.tasks.map((t, idx) => (
                                     <div key={idx} className={`flex-1 ${t.done ? 'bg-secondary' : 'bg-stone-300'} transition-colors`}></div>
                                  )) : (
                                    <div className="flex-1 bg-stone-200 opacity-30"></div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                    )}
                  </div>
                </motion.div>
              )}

               {activeView === 'protocols' && (
                <motion.div
                  key="protocols"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12 pb-20"
                >
                  <header className="flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-headline-xl text-stone-900">System Protocols</h1>
                      <p className="text-lg text-stone-500">Configure your automated daily performance templates.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingTemplate({ 
                          name: 'New Protocol', 
                          originalName: '', 
                          tasks: ['New Metric'] 
                        });
                        setShowTemplateModal(true);
                      }}
                      className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Create Template
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.entries(templates).map(([key, tasks]) => (
                      <motion.div 
                        key={key}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between group hover:shadow-2xl transition-all border border-stone-100 hover:border-secondary/20"
                      >
                        <div className="space-y-6">
                           <div className="flex justify-between items-center">
                              <div className="p-3 bg-[#F9F3E4] rounded-2xl flex items-center justify-center overflow-hidden">
                                {key.toLowerCase() === 'health' ? (
                                  <img 
                                    src="https://img.icons8.com/?size=100&id=86722&format=png&color=000000" 
                                    alt="Health" 
                                    className="w-[24px] h-[24px] object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : key.toLowerCase() === 'work' ? (
                                  <img 
                                    src="https://img.icons8.com/?size=100&id=91898&format=png&color=000000" 
                                    alt="Work" 
                                    className="w-[24px] h-[24px] object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : key.toLowerCase() === 'finance' ? (
                                  <img 
                                    src="https://img.icons8.com/?size=100&id=87086&format=png&color=000000" 
                                    alt="Finance" 
                                    className="w-[24px] h-[24px] object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Layout size={24} className="text-secondary" />
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  setEditingTemplate({ 
                                    name: key, 
                                    originalName: key, 
                                    tasks: [...(tasks as string[])] 
                                  });
                                  setShowTemplateModal(true);
                                }}
                                className="p-2 hover:bg-stone-100 rounded-full text-stone-300 hover:text-stone-900 transition-all"
                              >
                                <Edit3 size={18} />
                              </button>
                           </div>
                           <div>
                              <h3 className="text-2xl font-bold capitalize">{key}</h3>
                              <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">{ (tasks as string[]).length } Benchmarks Loaded</p>
                           </div>
                           <div className="space-y-2">
                             {(tasks as string[]).slice(0, 3).map((task, i) => (
                               <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                                 <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                                 <span className="truncate">{task}</span>
                               </div>
                             ))}
                             {(tasks as string[]).length > 3 && (
                               <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest px-3">+{ (tasks as string[]).length - 3 } More</p>
                             )}
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            setData(prev => applyTemplate(prev, tasks as string[], key));
                            setActiveCategory(key);
                            setActiveView('dashboard');
                          }}
                          className="mt-8 w-full py-3 bg-stone-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Synthesize Protocol
                        </button>
                      </motion.div>
                    ))}

                    <button 
                      onClick={() => {
                        const newKey = prompt("Enter Protocol Name (e.g., Morning, Night):");
                        if (newKey && !templates[newKey.toLowerCase()]) {
                          setTemplates({ ...templates, [newKey.toLowerCase()]: [] });
                          setEditingTemplate({ name: newKey.toLowerCase(), tasks: [] });
                          setShowTemplateModal(true);
                        }
                      }}
                      className="glass-panel p-8 rounded-[2.5rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4 hover:border-stone-400 hover:bg-stone-50 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center group-hover:scale-110 group-hover:border-stone-400 transition-all">
                        <Plus size={32} className="text-stone-300 group-hover:text-stone-600 transition-colors" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-stone-400 group-hover:text-stone-700 transition-colors">Manifest Protocol</h3>
                        <p className="text-xs text-stone-300 group-hover:text-stone-500 font-medium">Define a new pattern of execution.</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Header Section */}
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <h1 className="text-4xl font-headline-xl text-on-surface">Profile Protocol</h1>
                      <p className="text-lg text-on-surface-variant">Update your cognitive identity and system visibility.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        className="px-6 py-2.5 glass-panel rounded-full font-sans text-sm font-medium text-on-surface-variant transition-all hover:bg-white/60"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        className="px-6 py-2.5 bg-stone-900 text-stone-50 rounded-full font-sans text-sm font-semibold shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                      >
                        Save Identity
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-12 gap-6 pb-20">
                    {/* Profile Card */}
                    <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-6 inner-glow">
                      <h3 className="text-xl font-bold mb-6">Identity Records</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">First Name</label>
                          <input 
                            className="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg" 
                            type="text" 
                            value={profile.firstName} 
                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">Last Name</label>
                          <input 
                            className="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg" 
                            type="text" 
                            value={profile.lastName} 
                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">Bio</label>
                          <textarea 
                            className="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg resize-none" 
                            rows={3} 
                            value={profile.bio} 
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Avatar Card */}
                    <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 inner-glow flex flex-col items-center justify-center text-center">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => setShowAvatarGallery(true)}
                      >
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-secondary/20 transition-all group-hover:ring-secondary/40">
                          <img 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            src={profile.avatar}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={24} className="text-white" />
                        </div>
                      </div>
                      <h4 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h4>
                      <p className="text-xs text-on-surface-variant mb-4">SYSTEM STATUS: ACTIVE</p>
                      <button 
                        onClick={() => setShowAvatarGallery(true)}
                        className="text-secondary font-sans text-sm font-semibold hover:underline"
                      >
                        Sync New Avatar
                      </button>
                    </section>

                    {/* Notification Settings */}
                    <section className="col-span-12 lg:col-span-5 glass-panel rounded-xl p-6 inner-glow space-y-6">
                      <h3 className="text-xl font-bold">Protocols</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold text-on-surface">Weekly Transmissions</p>
                            <p className="text-xs text-on-surface-variant">Archived digest of your department activity.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox"
                              className="sr-only peer"
                              checked={profile.weeklyTransmissions}
                              onChange={(e) => setProfile({ ...profile, weeklyTransmissions: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold text-on-surface">Real-time Echo</p>
                            <p className="text-xs text-on-surface-variant">Instant alerts for new hit tasks.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox"
                              className="sr-only peer"
                              checked={profile.realTimeEcho}
                              onChange={(e) => setProfile({ ...profile, realTimeEcho: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                      </div>
                    </section>

                    {/* Stats Overview */}
                    <section className="col-span-12 lg:col-span-7 glass-panel rounded-xl p-6 inner-glow flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold">System Metrics</h3>
                          <p className="text-xs text-on-surface-variant">Your current consistency status.</p>
                        </div>
                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-sans">OPTIMIZED PLAN</span>
                      </div>
                      <div className="flex items-center gap-6 p-4 bg-primary-container/40 rounded-xl border border-white/20">
                        <div className="w-12 h-12 bg-white/60 rounded-lg flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={24} className="text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold text-on-surface">Consistency Level: Elite</p>
                          <p className="text-xs text-on-surface-variant">Streak maintained for {streak} days</p>
                        </div>
                        <button className="text-stone-900 font-sans text-sm font-semibold hover:underline">Audit</button>
                      </div>
                    </section>

                    {/* Journal Records */}
                    <section className="col-span-12 glass-panel rounded-xl p-6 inner-glow space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Journal History</h3>
                        <BookOpen size={20} className="text-secondary" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.values(data) as Entry[])
                          .filter(e => e.journal)
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 4)
                          .map((entry) => (
                            <div key={entry.date} className="p-4 glass-panel rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-stone-100/20">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">{entry.date}</span>
                              <p className="text-sm italic text-stone-700 line-clamp-2">"{entry.journal}"</p>
                            </div>
                          ))}
                        {(Object.values(data) as Entry[]).filter(e => e.journal).length === 0 && (
                          <div className="col-span-full py-8 text-center text-xs text-stone-400 italic">No journals archived yet.</div>
                        )}
                      </div>
                    </section>

                    {/* Appearance */}
                    <section className="col-span-12 glass-panel rounded-xl p-6 inner-glow">
                      <h3 className="text-xl font-bold mb-6">System Aesthetics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">INTERFACE THEME</label>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => { setIsDark(false); localStorage.setItem('theme', 'light'); }}
                              className={`flex-1 aspect-video rounded-lg border-2 p-2 flex flex-col gap-1 transition-all ${!isDark ? 'border-stone-900 bg-stone-50' : 'border-outline-variant bg-stone-100 hover:border-stone-400'}`}
                            >
                              <div className="h-2 w-full bg-stone-200 rounded"></div>
                              <div className="h-2 w-2/3 bg-stone-200 rounded"></div>
                              <p className="text-[10px] mt-auto font-bold text-center">Light</p>
                            </button>
                            <button 
                              onClick={() => { setIsDark(true); localStorage.setItem('theme', 'dark'); }}
                              className={`flex-1 aspect-video rounded-lg border-2 p-2 flex flex-col gap-1 transition-all ${isDark ? 'border-secondary bg-stone-900' : 'border-outline-variant bg-zinc-900 hover:border-stone-400'}`}
                            >
                              <div className="h-2 w-full bg-zinc-700 rounded"></div>
                              <div className="h-2 w-2/3 bg-zinc-700 rounded"></div>
                              <p className="text-[10px] mt-auto font-bold text-zinc-400 text-center">Dark</p>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">DISPLAY LANGUAGE</label>
                          <div className="relative">
                            <select className="w-full appearance-none bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-3 rounded-t-lg" defaultValue="English" readOnly>
                              <option>English</option>
                              <option>Spanish</option>
                              <option>French</option>
                            </select>
                            <ArrowRight size={16} className="absolute right-3 top-3 pointer-events-none text-on-surface-variant rotate-90" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">TEMPORAL ZONE</label>
                          <div className="relative">
                            <select className="w-full appearance-none bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-3 rounded-t-lg" defaultValue="(GMT+01:00) Central European Time" readOnly>
                              <option>(GMT+01:00) Central European Time</option>
                              <option>(UTC) Universal Coordinated</option>
                            </select>
                            <ArrowRight size={16} className="absolute right-3 top-3 pointer-events-none text-on-surface-variant rotate-90" />
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="col-span-12 glass-panel border-red-200 bg-red-50/10 rounded-xl p-6 inner-glow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-red-600">Protocol Deletion</h3>
                          <p className="text-xs text-on-surface-variant">Permanently wipe your account data and consistency logs.</p>
                        </div>
                        <button className="px-6 py-2.5 border border-red-600 text-red-600 rounded-full font-sans text-sm font-semibold hover:bg-red-600 hover:text-white transition-all">Wipe History</button>
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}

              {/* Quotes View Removed */}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating Plus Menu */}
      <AnimatePresence>
        {showPlusMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 z-[70] flex flex-col gap-3 items-end"
          >
             <button 
               onClick={() => {
                 setPendingQuote(todayEntry.quote || '');
                 setShowQuoteModal(true);
                 setShowPlusMenu(false);
               }}
               className="bg-white text-stone-800 px-6 py-3 rounded-full shadow-2xl border border-stone-200 font-bold flex items-center gap-2 hover:bg-stone-50 transition-all"
             >
                <TrendingUp size={18} className="text-secondary" /> Daily Quotes
             </button>
             <button 
               onClick={() => {
                 setPendingJournal(todayEntry.journal || '');
                 setShowJournalModal(true);
                 setShowPlusMenu(false);
               }}
               className="bg-white text-stone-800 px-6 py-3 rounded-full shadow-2xl border border-stone-200 font-bold flex items-center gap-2 hover:bg-stone-50 transition-all"
             >
                <BookOpen size={18} className="text-secondary" /> New Journal
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Plus Menu Toggle */}
      <button 
        onClick={() => setShowPlusMenu(!showPlusMenu)}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[65] ${showPlusMenu ? 'rotate-45 bg-stone-900' : ''}`}
      >
        <Plus size={24} />
      </button>
      {/* Quote Entry Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-xl glass-panel rounded-[3rem] p-10 border-white/20 bg-white/95 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowQuoteModal(false)}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"
                id="close-quote-modal"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>

              <div className="space-y-10">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">CAPTURE WISDOM</span>
                  <h3 className="text-4xl font-headline-xl text-stone-900 mt-2 italic">Daily Intent</h3>
                </div>

                <div className="relative">
                  <textarea 
                    autoFocus
                    className="w-full bg-stone-50/50 rounded-3xl p-8 border-none focus:ring-4 focus:ring-secondary/10 text-3xl font-semibold italic text-stone-900 placeholder:text-stone-200 resize-none min-h-[220px] leading-tight"
                    placeholder="Declare your protocol..."
                    value={pendingQuote}
                    onChange={(e) => setPendingQuote(e.target.value)}
                  />
                  <div className="absolute bottom-6 right-8 text-stone-300 font-mono text-[10px]">RECORDED: {todayKey}</div>
                </div>

                <div className="space-y-6">
                  <button 
                    onClick={() => {
                      setData(prev => updateQuote(prev, pendingQuote));
                      setShowQuoteModal(false);
                      // Record is now reflected on main dashboard because it updates the central data store
                    }}
                    className="w-full py-5 bg-stone-900 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    RECORD IN DATABASE
                  </button>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Mindfulness', 'Productivity', 'Gratitude', 'Resilience', 'Growth'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setPendingQuote(prev => prev + (prev ? ' ' : '') + `#${tag}`)}
                        className="px-5 py-2 rounded-full bg-stone-100/80 text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:bg-secondary hover:text-white transition-all border border-stone-200"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Entry Modal */}
      <AnimatePresence>
        {showJournalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-4xl glass-panel rounded-[3rem] p-10 border-white/20 bg-white/95 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowJournalModal(false)}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"
                id="close-journal-modal"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>

              <div className="space-y-10">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">SYSTEM LOGBOOK</span>
                  <h3 className="text-4xl font-headline-xl text-stone-900 mt-2 italic">Shift Reflection</h3>
                </div>

                <div className="relative">
                  <textarea 
                    autoFocus
                    className="w-full bg-stone-50/50 rounded-3xl p-8 border-none focus:ring-4 focus:ring-secondary/10 text-xl font-medium text-stone-800 placeholder:text-stone-300 resize-none min-h-[400px] leading-relaxed"
                    placeholder="Log your cognitive output and observations..."
                    value={pendingJournal}
                    onChange={(e) => setPendingJournal(e.target.value)}
                  />
                  <div className="absolute bottom-6 right-8 text-stone-300 font-mono text-[10px]">SESSION: {todayKey}</div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      setData(prev => updateJournal(prev, pendingJournal));
                      setShowJournalModal(false);
                    }}
                    className="px-12 py-5 bg-stone-900 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    COMMIT TO ARCHIVE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Gallery Modal */}
      <AnimatePresence>
        {showAvatarGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-2xl glass-panel rounded-[3rem] p-10 border-white/20 bg-white/95 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAvatarGallery(false)}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>

              <div className="space-y-8">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">PROFILE IMAGE</span>
                  <h3 className="text-4xl font-headline-xl text-stone-900 mt-2 italic">Select Avatar</h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {avatars.map((url, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setProfile(prev => ({ ...prev, avatar: url }));
                        setShowAvatarGallery(false);
                      }}
                      className={`relative aspect-square rounded-full overflow-hidden border-4 transition-all ${profile.avatar === url ? 'border-secondary shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Detail Modal */}
      <AnimatePresence>
        {selectedArchiveEntry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-4xl glass-panel rounded-[3rem] p-12 border-white/20 bg-white/95 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedArchiveEntry(null)}
                className="absolute top-10 right-10 text-stone-400 hover:text-stone-900 transition-colors z-20"
              >
                <ArrowRight className="rotate-180" size={28} />
              </button>

              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

              <div className="relative z-10 space-y-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.5em] text-stone-400 uppercase">HISTORICAL LOG: {selectedArchiveEntry.date}</span>
                  <h3 className="text-5xl font-headline-xl text-stone-900 italic tracking-tight">Daily Record</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Protocol Success Rate</h4>
                       <div className="flex items-end gap-3">
                          <span className="text-6xl font-black text-secondary">
                            {Math.round((selectedArchiveEntry.tasks.filter(t => t.done).length / (selectedArchiveEntry.tasks.length || 1)) * 100)}%
                          </span>
                          <span className="text-stone-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Efficiency</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Execution List</h4>
                       <ul className="space-y-3">
                          {selectedArchiveEntry.tasks.length > 0 ? selectedArchiveEntry.tasks.map((task, i) => (
                            <li key={i} className="flex items-center gap-3 text-stone-700">
                               {task.done ? <CheckCircle2 size={16} className="text-secondary shrink-0" /> : <Circle size={16} className="text-stone-300 shrink-0" />}
                               <span className={`text-sm font-medium ${task.done ? 'opacity-100' : 'opacity-40 line-through'}`}>{task.text}</span>
                            </li>
                          )) : (
                            <li className="text-sm text-stone-400 italic">No tasks were assigned for this period.</li>
                          )}
                       </ul>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {selectedArchiveEntry.quote && (
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Guiding Intent</h4>
                         <p className="text-xl italic text-amber-700 font-medium leading-relaxed border-l-4 border-amber-200 pl-6 py-2">
                           "{selectedArchiveEntry.quote}"
                         </p>
                      </div>
                    )}

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cognitive Reflection</h4>
                       <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
                          <p className="text-lg text-stone-800 leading-relaxed italic">
                            {selectedArchiveEntry.journal || "No mental log recorded for this session."}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-100 flex justify-between items-center text-[10px] font-mono text-stone-400">
                   <span>RECORD_REF: {selectedArchiveEntry.date.replace(/-/g, '')}</span>
                   <span>AUTH_VERIFIED: TRUE</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Edit Modal */}
      <AnimatePresence>
        {showTemplateModal && editingTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-2xl glass-panel rounded-[3rem] p-10 border-white/20 bg-white/95 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"
                id="close-template-modal"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>

              <div className="space-y-8">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">PROTOCOL CONFIG</span>
                  <div className="mt-4 flex flex-col items-center">
                    <input 
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="text-4xl font-headline-xl text-stone-900 italic capitalize bg-transparent border-none text-center focus:outline-none focus:ring-0"
                      placeholder="Protocol Name"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus size={14} className="text-secondary" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Benchmarks</span>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingTemplate.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl group border border-stone-100 hover:border-secondary/20 transition-all">
                        <div className="w-2 h-2 rounded-full bg-secondary/40"></div>
                        <input 
                          type="text"
                          value={task}
                          onChange={(e) => {
                            const newTasks = [...editingTemplate.tasks];
                            newTasks[i] = e.target.value;
                            setEditingTemplate({ ...editingTemplate, tasks: newTasks });
                          }}
                          className="flex-1 bg-transparent border-none text-stone-800 font-medium focus:ring-0 p-0 text-sm"
                        />
                        <button 
                          onClick={() => {
                            const newTasks = editingTemplate.tasks.filter((_, idx) => idx !== i);
                            setEditingTemplate({ ...editingTemplate, tasks: newTasks });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setEditingTemplate({ 
                        ...editingTemplate, 
                        tasks: [...editingTemplate.tasks, "New Benchmark"] 
                      });
                    }}
                    className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={16} className="group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Append Metric</span>
                  </button>
                </div>

                <div className="pt-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowTemplateModal(false)}
                      className="flex-1 py-4 text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-stone-900 transition-all"
                    >
                      Discard Changes
                    </button>
                    <button 
                      onClick={() => {
                        setTemplates(prev => {
                          const newTemplates = { ...prev };
                          // If name changed, delete old key
                          if (editingTemplate.name !== editingTemplate.originalName) {
                            delete newTemplates[editingTemplate.originalName];
                          }
                          newTemplates[editingTemplate.name] = editingTemplate.tasks;
                          return newTemplates;
                        });
                        setShowTemplateModal(false);
                      }}
                      className="flex-[2] py-4 bg-stone-900 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Save Protocol
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm("Permanently delete this protocol?")) {
                        setTemplates(prev => {
                          const newTemplates = { ...prev };
                          delete newTemplates[editingTemplate.originalName];
                          return newTemplates;
                        });
                        setShowTemplateModal(false);
                      }
                    }}
                    className="w-full py-3 text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all opacity-50 hover:opacity-100"
                  >
                    <Trash2 size={12} />
                    DECOMMISSION PROTOCOL
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-transparent to-transparent"></div>
            
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-12">
              <div className="text-[10px] font-bold tracking-[0.4em] text-stone-500 uppercase">DEEP FOCUS SESSION</div>
              
              <div className="text-[8rem] md:text-[14rem] font-light leading-none tracking-tighter text-white tabular-nums flex items-center justify-center gap-2">
                {formatTime(focusTime)}
              </div>

              {isTimerRunning ? (
                <div className="flex flex-col items-center gap-8">
                   <button 
                    onClick={() => setIsTimerRunning(false)}
                    className="group relative px-12 py-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all overflow-hidden"
                  >
                    <span className="text-white font-bold tracking-widest text-xs uppercase relative z-10">PAUSE CONCENTRATION</span>
                    <motion.div 
                      className="absolute inset-0 bg-white/5"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1.5 }}
                    />
                  </button>
                  <button 
                    onClick={stopFocus}
                    className="text-stone-500 text-[10px] font-bold tracking-widest uppercase hover:text-red-500 transition-colors"
                  >
                    ABORT SESSION
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-12 flex flex-col items-center">
                  <div className="flex gap-8 items-center bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">HOURS</span>
                       <input 
                         type="number" 
                         min="0" 
                         max="99"
                         value={focusConfig.hours}
                         onChange={(e) => setFocusConfig({ ...focusConfig, hours: Math.min(99, Math.max(0, parseInt(e.target.value) || 0)) })}
                         className="bg-transparent text-5xl font-light text-white w-24 text-center focus:outline-none border-b border-white/10 focus:border-orange-500 transition-colors"
                       />
                    </div>
                    <div className="text-5xl font-light text-stone-700">:</div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">MINUTES</span>
                       <input 
                         type="number" 
                         min="0" 
                         max="59"
                         value={focusConfig.minutes}
                         onChange={(e) => setFocusConfig({ ...focusConfig, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                         className="bg-transparent text-5xl font-light text-white w-24 text-center focus:outline-none border-b border-white/10 focus:border-orange-500 transition-colors"
                       />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const totalSecs = (focusConfig.hours * 3600) + (focusConfig.minutes * 60);
                        if (totalSecs > 0) {
                          setFocusTime(totalSecs);
                          setIsTimerRunning(true);
                        }
                      }}
                      className="px-12 py-4 bg-orange-500 text-white rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all tracking-widest text-xs uppercase"
                    >
                      IGNITE SESSION
                    </button>
                    <button 
                      onClick={stopFocus}
                      className="px-8 py-4 text-stone-500 font-bold tracking-widest text-xs uppercase hover:text-white transition-colors"
                    >
                      EXIT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-stone-900 w-full overflow-hidden">
               <motion.div 
                 className="h-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]"
                 initial={{ width: "100%" }}
                 animate={{ width: `${((focusConfig.hours * 3600) + (focusConfig.minutes * 60)) > 0 ? (focusTime / ((focusConfig.hours * 3600) + (focusConfig.minutes * 60))) * 100 : 0}%` }}
                 transition={{ ease: "linear", duration: 1 }}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
