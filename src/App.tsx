/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp
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
  clearTasks
} from './lib/dailyHitsStore';

const HABIT_TEMPLATES = {
  health: ["Drink 2L Water", "45min Exercise", "Meditation 10min"],
  work: ["Deep Work 90min", "Clear Inbox", "Plan Tomorrow"],
  zen: ["Read 20 Pages", "Journal 10min", "No Screen After 9PM"]
};

export default function App() {
  const [data, setData] = useState<DailyData>({});
  const [activeView, setActiveView] = useState<'dashboard' | 'archive' | 'profile' | 'settings'>('dashboard');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    const today = getTodayKey();
    if (!loaded[today]) {
      setData(prev => startDay(prev));
    }
  }, []);

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
          <div className="hidden lg:flex gap-6 text-sm font-medium tracking-tight">
            <button onClick={() => setActiveView('dashboard')} className={`transition-colors h-full flex items-center ${activeView === 'dashboard' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Dashboard</button>
            <button onClick={() => setActiveView('archive')} className={`transition-colors h-full flex items-center ${activeView === 'archive' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Archive</button>
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
                        <button className="bg-secondary text-white px-8 py-2 rounded-full text-xs font-bold hover:shadow-lg transition-shadow">FOCUS MODE</button>
                      </div>
                    </section>

                    {/* Middle Section: Progress & Calendar */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                      {/* Progress Card */}
                      <div className="md:col-span-3 glass-panel p-6 rounded-3xl space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold">Progress</h3>
                          <span className="text-xs text-stone-500">Last 7 Sessions</span>
                        </div>
                        <div className="flex items-end justify-between h-40 gap-2">
                           {Array.from({ length: 7 }).map((_, i) => {
                             const entry = historyDays[i];
                             const h = entry 
                               ? (entry.tasks.length > 0 ? (entry.tasks.filter(t => t.done).length / entry.tasks.length) * 100 : 0)
                               : 10;
                             return (
                               <div key={i} className="flex-1 group relative">
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {Math.round(h)}% Done
                                  </div>
                                  <div 
                                    className="w-full bg-secondary/10 rounded-t-lg transition-all duration-500 hover:bg-secondary cursor-pointer" 
                                    style={{ height: `${Math.max(h, 5)}%` }}
                                  ></div>
                               </div>
                             );
                           })}
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1">
                          <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>Day 4</span><span>Day 5</span><span>Day 6</span><span>Day 7</span>
                        </div>
                      </div>

                      {/* Calendar Card */}
                      <div className="md:col-span-2 glass-panel p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">April 2026</h3>
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><ArrowRight size={16} className="rotate-180" /></button>
                            <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><ArrowRight size={16} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 mb-2">
                          <span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span><span>SU</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {Array.from({ length: 30 }).map((_, i) => (
                             <span key={i} className={`p-2 rounded-full flex items-center justify-center ${i + 1 === 28 ? 'bg-secondary text-white font-bold' : 'hover:bg-stone-100 transition-colors'}`}>
                               {i + 1}
                             </span>
                          ))}
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
                              <h4 className="font-bold">Daily Tasks</h4>
                              <p className="text-xs text-stone-500">{todayEntry.tasks.filter(t => t.done).length} of {todayEntry.tasks.length} hits completed</p>
                            </div>
                          </div>
                          <button 
                            onClick={handlePlusClick}
                            className="text-stone-400 hover:text-stone-600 transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <ul className="space-y-4 max-h-[300px] overflow-y-auto invisible-scrollbar">
                          {todayEntry.tasks.length === 0 ? (
                            <li className="text-sm text-stone-400 italic py-4 text-center">No tasks yet. Click the + button to add your first hit.</li>
                          ) : (
                            todayEntry.tasks.map((task, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm group">
                                <button 
                                  onClick={() => setData(prev => toggleTask(prev, i))}
                                  className="focus:outline-none"
                                >
                                  {task.done ? (
                                    <CheckCircle2 size={20} className="text-secondary" />
                                  ) : (
                                    <Circle size={20} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                                  )}
                                </button>
                                <span className={`transition-all ${task.done ? 'text-stone-400 line-through' : 'font-semibold'}`}>
                                  {task.text}
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </section>

                    {/* Daily Quotes Section */}
                    <section className="relative rounded-[2.5rem] overflow-hidden min-h-[300px] glass-panel p-8 flex flex-col justify-end bg-stone-900 text-stone-100">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                       <div className="relative z-10 space-y-4 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-secondary px-2 py-0.5 rounded text-white">DAILY QUOTES</span>
                            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{todayKey}</span>
                          </div>
                          <p className={`text-3xl font-light italic leading-snug ${todayEntry.quote ? 'opacity-100' : 'opacity-30'}`}>
                            {todayEntry.quote ? `"${todayEntry.quote}"` : '"No thought-of-the-day recorded. Capture your daily quote."'}
                          </p>
                          <div className="pt-4 flex items-center gap-2 text-stone-400 text-xs font-mono uppercase tracking-tighter">
                            <User size={12} />
                            <span>LOG_ID: {todayKey.replace(/-/g, '')}_DH</span>
                          </div>
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
                       <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] px-4">TEMPLATES</span>
                       {Object.entries(HABIT_TEMPLATES).map(([key, tasks]) => (
                          <button 
                            key={key} 
                            onClick={() => setData(prev => applyTemplate(prev, tasks))}
                            className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-all text-left"
                          >
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F9F3E4] rounded-lg">
                                  <Layout size={18} className="text-secondary" />
                                </div>
                                <span className="text-sm font-bold capitalize">{key}</span>
                             </div>
                             <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {history.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-stone-400 italic">No historical data available yet.</div>
                  ) : (
                    history.map((entry) => {
                      const tasksDone = entry.tasks.filter(t => t.done).length;
                      const total = entry.tasks.length;
                      const eProgress = total > 0 ? (tasksDone / total) * 100 : 0;
                      return (
                        <div key={entry.date} className="glass-panel p-6 rounded-3xl space-y-4 hover:bg-white/60 transition-all cursor-pointer group">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-stone-400">{entry.date}</span>
                            <div className="w-8 h-8 rounded-full border border-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400 group-hover:bg-secondary group-hover:text-white transition-all">
                              {Math.round(eProgress)}%
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-stone-700 line-clamp-3 italic min-h-[4rem]">
                            {entry.journal || 'No journal entry recorded for this day.'}
                          </p>
                          <div className="flex gap-1 h-1">
                            {entry.tasks.map((t, idx) => (
                               <div key={idx} className={`flex-1 rounded-full ${t.done ? 'bg-secondary' : 'bg-stone-200'}`}></div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
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
                  <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <h1 class="text-4xl font-headline-xl text-on-surface">Profile Protocol</h1>
                      <p class="text-lg text-on-surface-variant">Update your cognitive identity and system visibility.</p>
                    </div>
                    <div class="flex gap-3">
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        class="px-6 py-2.5 glass-panel rounded-full font-sans text-sm font-medium text-on-surface-variant transition-all hover:bg-white/60"
                      >
                        Cancel
                      </button>
                      <button class="px-6 py-2.5 bg-stone-900 text-stone-50 rounded-full font-sans text-sm font-semibold shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                        Save Identity
                      </button>
                    </div>
                  </header>

                  <div class="grid grid-cols-12 gap-6 pb-20">
                    {/* Profile Card */}
                    <section class="col-span-12 lg:col-span-8 glass-panel rounded-xl p-6 inner-glow">
                      <h3 class="text-xl font-bold mb-6">Identity Records</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">SUBJECT NAME</label>
                          <input class="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg" type="text" value="User_01"/>
                        </div>
                        <div class="space-y-2">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">COMM_CHANNEL</label>
                          <input class="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg" type="email" value={localStorage.getItem('user_email') || 'user@dailyhits.io'}/>
                        </div>
                        <div class="space-y-2 md:col-span-2">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">LOG_BIO</label>
                          <textarea class="w-full bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-2 rounded-t-lg resize-none" rows={3}>Optimizing daily frequency and maintaining architectural standards in consistency.</textarea>
                        </div>
                      </div>
                    </section>

                    {/* Avatar Card */}
                    <section class="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 inner-glow flex flex-col items-center justify-center text-center">
                      <div class="relative group cursor-pointer">
                        <div class="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-secondary/20 transition-all group-hover:ring-secondary/40">
                          <img 
                            alt="Profile" 
                            class="w-full h-full object-cover" 
                            src="https://img.icons8.com/?size=100&id=85050&format=png&color=000000"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div class="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={24} className="text-white" />
                        </div>
                      </div>
                      <h4 class="text-xl font-bold">User_01</h4>
                      <p class="text-xs text-on-surface-variant mb-4">LOCAL_RUNTIME: ACTIVE</p>
                      <button class="text-secondary font-sans text-sm font-semibold hover:underline">Sync New Avatar</button>
                    </section>

                    {/* Notification Settings */}
                    <section class="col-span-12 lg:col-span-5 glass-panel rounded-xl p-6 inner-glow space-y-6">
                      <h3 class="text-xl font-bold">Protocols</h3>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <p class="text-base font-semibold text-on-surface">Weekly Transmissions</p>
                            <p class="text-xs text-on-surface-variant">Archived digest of your department activity.</p>
                          </div>
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input checked={true} class="sr-only peer" type="checkbox" readOnly />
                            <div class="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <p class="text-base font-semibold text-on-surface">Real-time Echo</p>
                            <p class="text-xs text-on-surface-variant">Instant alerts for new hit tasks.</p>
                          </div>
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input class="sr-only peer" type="checkbox" />
                            <div class="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                      </div>
                    </section>

                    {/* Stats Overview */}
                    <section class="col-span-12 lg:col-span-7 glass-panel rounded-xl p-6 inner-glow flex flex-col justify-between">
                      <div class="flex justify-between items-start mb-6">
                        <div>
                          <h3 class="text-xl font-bold">System Metrics</h3>
                          <p class="text-xs text-on-surface-variant">Your current consistency status.</p>
                        </div>
                        <span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-sans">OPTIMIZED PLAN</span>
                      </div>
                      <div class="flex items-center gap-6 p-4 bg-primary-container/40 rounded-xl border border-white/20">
                        <div class="w-12 h-12 bg-white/60 rounded-lg flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={24} className="text-secondary" />
                        </div>
                        <div class="flex-1">
                          <p class="font-sans text-sm font-semibold text-on-surface">Consistency Level: Elite</p>
                          <p class="text-xs text-on-surface-variant">Streak maintained for {streak} days</p>
                        </div>
                        <button class="text-stone-900 font-sans text-sm font-semibold hover:underline">Audit</button>
                      </div>
                      <div class="mt-6 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-5xl font-light text-on-surface">{progress}</span>
                          <span class="text-on-surface-variant font-sans">% Today</span>
                        </div>
                        <div class="text-right">
                          <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">LOG_ID</p>
                          <p class="font-sans font-semibold text-on-surface">{todayKey.replace(/-/g, '')}_DH</p>
                        </div>
                      </div>
                    </section>

                    {/* Journal Records */}
                    <section class="col-span-12 glass-panel rounded-xl p-6 inner-glow space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 class="text-xl font-bold">Journal History</h3>
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
                    <section class="col-span-12 glass-panel rounded-xl p-6 inner-glow">
                      <h3 class="text-xl font-bold mb-6">System Aesthetics</h3>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="space-y-3">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">INTERFACE THEME</label>
                          <div class="flex gap-4">
                            <button 
                              onClick={() => { setIsDark(false); localStorage.setItem('theme', 'light'); }}
                              class={`flex-1 aspect-video rounded-lg border-2 p-2 flex flex-col gap-1 transition-all ${!isDark ? 'border-stone-900 bg-stone-50' : 'border-outline-variant bg-stone-100 hover:border-stone-400'}`}
                            >
                              <div class="h-2 w-full bg-stone-200 rounded"></div>
                              <div class="h-2 w-2/3 bg-stone-200 rounded"></div>
                              <p class="text-[10px] mt-auto font-bold text-center">Light</p>
                            </button>
                            <button 
                              onClick={() => { setIsDark(true); localStorage.setItem('theme', 'dark'); }}
                              class={`flex-1 aspect-video rounded-lg border-2 p-2 flex flex-col gap-1 transition-all ${isDark ? 'border-secondary bg-stone-900' : 'border-outline-variant bg-zinc-900 hover:border-stone-400'}`}
                            >
                              <div class="h-2 w-full bg-zinc-700 rounded"></div>
                              <div class="h-2 w-2/3 bg-zinc-700 rounded"></div>
                              <p class="text-[10px] mt-auto font-bold text-zinc-400 text-center">Dark</p>
                            </button>
                          </div>
                        </div>
                        <div class="space-y-3">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">DISPLAY LANGUAGE</label>
                          <div class="relative">
                            <select class="w-full appearance-none bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-3 rounded-t-lg">
                              <option>English (Directives)</option>
                              <option>Visual Code (Binary)</option>
                            </select>
                            <ArrowRight size={16} className="absolute right-3 top-3 pointer-events-none text-on-surface-variant rotate-90" />
                          </div>
                        </div>
                        <div class="space-y-3">
                          <label class="text-[10px] font-bold tracking-widest text-on-surface-variant block uppercase">TEMPORAL ZONE</label>
                          <div class="relative">
                            <select class="w-full appearance-none bg-primary-container/30 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-all text-on-surface p-3 rounded-t-lg">
                              <option>(GMT+01:00) Central European Time</option>
                              <option>(UTC) Universal Coordinated</option>
                            </select>
                            <ArrowRight size={16} className="absolute right-3 top-3 pointer-events-none text-on-surface-variant rotate-90" />
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Danger Zone */}
                    <section class="col-span-12 glass-panel border-red-200 bg-red-50/10 rounded-xl p-6 inner-glow">
                      <div class="flex items-center justify-between">
                        <div>
                          <h3 class="text-xl font-bold text-red-600">Protocol Deletion</h3>
                          <p class="text-xs text-on-surface-variant">Permanently wipe your account data and consistency logs.</p>
                        </div>
                        <button class="px-6 py-2.5 border border-red-600 text-red-600 rounded-full font-sans text-sm font-semibold hover:bg-red-600 hover:text-white transition-all">Wipe History</button>
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}
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
                 const quote = prompt("Enter daily quote:");
                 if (quote) setData(prev => updateQuote(prev, quote));
                 setShowPlusMenu(false);
               }}
               className="bg-white text-stone-800 px-6 py-3 rounded-full shadow-2xl border border-stone-200 font-bold flex items-center gap-2 hover:bg-stone-50 transition-all"
             >
                <TrendingUp size={18} className="text-secondary" /> Daily Quotes
             </button>
             <button 
               onClick={() => {
                 const journal = prompt("Enter journal entry:");
                 if (journal) setData(prev => updateJournal(prev, journal));
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
    </div>
  );
}
