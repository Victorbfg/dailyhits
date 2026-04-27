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
  startDay,
  applyTemplate
} from './lib/dailyHitsStore';

const HABIT_TEMPLATES = {
  health: ["Drink 2L Water", "45min Exercise", "Meditation 10min"],
  work: ["Deep Work 90min", "Clear Inbox", "Plan Tomorrow"],
  zen: ["Read 20 Pages", "Journal 10min", "No Screen After 9PM"]
};

export default function App() {
  const [data, setData] = useState<DailyData>({});
  const [command, setCommand] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const inputRef = useRef<HTMLInputElement>(null);

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
  const todayEntry: Entry = data[todayKey] || { tasks: [], journal: '', date: todayKey };
  const streak = getStreak(data);
  const history = (Object.values(data) as Entry[])
    .filter(e => e.date !== todayKey)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').replace(/^"(.*)"$/, '$1');

    if (cmd === 'add' && arg) {
      setData(prev => addTask(prev, arg));
    } else if (cmd === 'done' && !isNaN(parseInt(arg))) {
      setData(prev => toggleTask(prev, parseInt(arg) - 1));
    } else if (cmd === 'journal' && arg) {
      setData(prev => updateJournal(prev, arg));
    } else if (cmd === 'start') {
      setData(prev => startDay(prev));
    } else if (cmd === 'view') {
      setShowHistory(false);
    } else if (cmd === 'history') {
      setShowHistory(true);
    } else if (cmd === 'template' && HABIT_TEMPLATES[arg as keyof typeof HABIT_TEMPLATES]) {
      setData(prev => applyTemplate(prev, HABIT_TEMPLATES[arg as keyof typeof HABIT_TEMPLATES]));
    } else if (cmd === 'theme') {
      setIsDark(!isDark);
    } else if (cmd === 'help') {
      alert(`Commands:\nadd "task"\ndone <index>\njournal "text"\ntemplate <health|work|zen>\ntheme\nview\nhistory\nhelp`);
    }

    setCommand('');
  };

  const progress = todayEntry.tasks.length > 0 
    ? Math.round((todayEntry.tasks.filter(t => t.done).length / todayEntry.tasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-[#F9F3E4]/60 backdrop-blur-lg border-b border-white/40 h-20 flex justify-between items-center px-8 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-12">
          <span className="text-xl font-extrabold text-stone-900 tracking-tighter">DailyHits</span>
          <div className="hidden lg:flex gap-6 text-sm font-medium tracking-tight">
            <button onClick={() => setShowHistory(false)} className={`transition-colors ${!showHistory ? 'text-stone-900 border-b-2 border-stone-900 pb-1' : 'text-stone-500 hover:text-stone-700'}`}>Dashboard</button>
            <button onClick={() => setShowHistory(true)} className={`transition-colors ${showHistory ? 'text-stone-900 border-b-2 border-stone-900 pb-1' : 'text-stone-500 hover:text-stone-700'}`}>Archive</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">STREAK</span>
            <span className="text-sm font-bold text-secondary">{streak} DAYS</span>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-white/20 rounded-full transition-all text-stone-600"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 hover:bg-white/20 rounded-full transition-all text-stone-600">
            <Settings size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-stone-200 flex items-center justify-center">
             <User size={20} className="text-stone-500" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-8 max-w-[1920px] mx-auto grid grid-cols-12 gap-6">
        {/* Primary Content (9 cols) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            {!showHistory ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Hero Section */}
                <section className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-on-surface">Welcome back.</h1>
                    <p className="text-lg text-tertiary">Focus on today's hits. Consistency is your only metric.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                       <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">HITS COMPLETED</span>
                        <span className="text-2xl font-bold">{todayEntry.tasks.filter(t => t.done).length} / {todayEntry.tasks.length}</span>
                        <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-[#6f5d14] glowing-bar transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                      <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">JOURNAL STATUS</span>
                        <span className="text-2xl font-bold">{todayEntry.journal ? 'RECORDED' : 'PENDING'}</span>
                        <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className={`h-full glowing-bar transition-all ${todayEntry.journal ? 'bg-[#6f5d14] w-full' : 'bg-red-400 w-1/4'}`}></div>
                        </div>
                      </div>
                      <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#726f63] uppercase">CONSISTENCY</span>
                        <span className="text-2xl font-bold">OPTIMAL</span>
                        <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-[#6f5d14] glowing-bar w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Circular Time/Streak Tracker */}
                  <div className="w-full md:w-64 glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">STREAK TRACKER</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-white/20" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                        <motion.circle 
                          className="text-[#6f5d14] glowing-bar" 
                          cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"
                          strokeDasharray="364.4"
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * Math.min(streak, 100) / 100) }}
                          transition={{ duration: 1 }}
                        ></motion.circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{streak}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">DAYS</span>
                      </div>
                    </div>
                    <button className="bg-[#6f5d14] text-white px-8 py-2 rounded-full text-xs font-bold hover:shadow-lg transition-shadow">VIEW DETAILS</button>
                  </div>
                </section>

                {/* Tasks Section (Repurposed Onboarding) */}
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
                          className="h-full bg-[#6f5d14] glowing-bar rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        ></motion.div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm text-stone-500 leading-relaxed italic">"The secret of your future is hidden in your daily routine."</p>
                    </div>
                  </div>
                  <div className="flex-1 glass-panel bg-white/20 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#6f5d14]/10 rounded-xl flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-[#6f5d14]" />
                        </div>
                        <div>
                          <h4 className="font-bold">Daily Tasks</h4>
                          <p className="text-xs text-stone-500">{todayEntry.tasks.filter(t => t.done).length} of {todayEntry.tasks.length} hits completed</p>
                        </div>
                      </div>
                      <button className="text-stone-400 hover:text-stone-600 transition-colors">
                        <Plus size={20} />
                      </button>
                    </div>
                    <ul className="space-y-4">
                      {todayEntry.tasks.length === 0 ? (
                        <li className="text-sm text-stone-400 italic py-4">No tasks yet. Use the command bar to add your first hit.</li>
                      ) : (
                        todayEntry.tasks.map((task, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm group">
                            <button 
                              onClick={() => setData(prev => toggleTask(prev, i))}
                              className="focus:outline-none"
                            >
                              {task.done ? (
                                <CheckCircle2 size={20} className="text-[#6f5d14]" />
                              ) : (
                                <Circle size={20} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                              )}
                            </button>
                            <span className={`transition-all ${task.done ? 'text-stone-400 line-through' : 'font-semibold'}`}>
                              {task.text}
                            </span>
                            <span className="ml-auto text-[10px] font-mono opacity-0 group-hover:opacity-40 transition-opacity">ID: {i+1}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </section>

                {/* Journal Section (Reference: Journey) */}
                <section className="relative rounded-[2.5rem] overflow-hidden min-h-[300px] glass-panel p-8 flex flex-col justify-end bg-stone-900 text-white">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                   <div className="relative z-10 space-y-4 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-[#6f5d14] px-2 py-0.5 rounded text-white">DAILY JOURNEY</span>
                        <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{todayKey}</span>
                      </div>
                      <div className="space-y-2">
                        <p className={`text-3xl font-light italic leading-snug ${todayEntry.journal ? 'opacity-100' : 'opacity-30'}`}>
                          {todayEntry.journal ? `"${todayEntry.journal}"` : '"No written record of today\'s journey yet. Capture the momentum."'}
                        </p>
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-stone-400 text-xs font-mono uppercase tracking-tighter">
                        <User size={12} />
                        <span>SESSION_LOG: {todayKey.replace(/-/g, '')}_DH</span>
                      </div>
                   </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {history.map((entry) => {
                  const tasksDone = entry.tasks.filter(t => t.done).length;
                  const total = entry.tasks.length;
                  const eProgress = total > 0 ? (tasksDone / total) * 100 : 0;
                  return (
                    <div key={entry.date} className="glass-panel p-6 rounded-3xl space-y-4 hover:border-[#6f5d14]/40 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-stone-400">{entry.date}</span>
                        <div className="w-8 h-8 rounded-full border border-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400 group-hover:bg-[#6f5d14] group-hover:text-white transition-all">
                          {Math.round(eProgress)}%
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-stone-700 line-clamp-2 italic h-10">
                        {entry.journal || 'No journal entry.'}
                      </p>
                      <div className="flex gap-1 h-1">
                        {entry.tasks.map((t, idx) => (
                           <div key={idx} className={`flex-1 rounded-full ${t.done ? 'bg-[#6f5d14]' : 'bg-stone-200'}`}></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Sidebar Stats (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] space-y-8 h-fit">
            <div>
              <span className="text-5xl font-light tracking-tighter">
                {Object.values(data).reduce((acc, curr) => acc + curr.tasks.length, 0)}
              </span>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">TOTAL HITS ARCHIVED</p>
            </div>
            <div>
              <span className="text-5xl font-light tracking-tighter">
                {Object.values(data).filter(e => e.journal).length}
              </span>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">JOURNAL ENTRIES</p>
            </div>
            <div>
              <span className="text-5xl font-light tracking-tighter text-[#6f5d14]">{streak}</span>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">CONSECUTIVE DAYS</p>
            </div>
          </div>

          <div className="space-y-3">
             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] px-4">TEMPLATES</span>
             {Object.entries(HABIT_TEMPLATES).map(([key, tasks]) => (
                <button 
                  key={key} 
                  onClick={() => setData(prev => applyTemplate(prev, tasks))}
                  className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-all text-left"
                >
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F9F3E4] rounded-lg">
                        <Layout size={18} className="text-[#6f5d14]" />
                      </div>
                      <span className="text-sm font-bold capitalize">{key} Setup</span>
                   </div>
                   <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
             ))}
          </div>

          <div className="glass-panel p-6 rounded-[2.5rem] space-y-4">
             <div className="flex items-center gap-2 text-[#6f5d14]">
                <TrendingUp size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">INSIGHT</span>
             </div>
             <h4 className="text-lg font-bold leading-tight">Consistency is rising.</h4>
             <p className="text-xs text-stone-500 leading-relaxed">You've completed more hits this week than last. Keep the pace, maintain the flow.</p>
             <div className="pt-4 flex gap-1">
                {[40, 60, 20, 80, 50, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-stone-100 rounded-t-sm h-12 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-secondary transition-all duration-500" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* Floating CLI Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[60]">
        <form 
          onSubmit={handleCommand}
          className="bg-stone-950/90 backdrop-blur shadow-2xl p-2 rounded-2xl flex items-center gap-3 border border-stone-800"
        >
          <div className="bg-[#6f5d14] text-white p-2 rounded-xl">
            <Terminal size={20} />
          </div>
          <input 
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="add 'task' / done 1 / journal 'text' / template zen"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-white placeholder:text-stone-600 cli-input"
          />
          <div className="flex gap-2 mr-2">
            <span className="text-[10px] font-mono text-stone-700 bg-stone-900 px-1 rounded border border-stone-800">CMD</span>
            <button type="submit" className="text-[#6f5d14] hover:text-white transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>

      <button className="fixed bottom-28 right-8 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50">
        <Plus size={24} />
      </button>
    </div>
  );
}
