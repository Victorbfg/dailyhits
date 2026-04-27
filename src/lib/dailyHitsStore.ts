import { DailyData, Entry, Task } from '../types';

const STORAGE_KEY = 'dailyhits_data';

export const loadData = (): DailyData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveData = (data: DailyData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

export const getStreak = (data: DailyData): number => {
  const dates = Object.keys(data).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = new Date(today);

  while (true) {
    const key = current.toISOString().split('T')[0];
    const entry = data[key];
    
    const hasActivity = entry && (entry.tasks.length > 0 || entry.journal.length > 0);
    
    if (hasActivity) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      // If we're looking at today and there's no activity, check yesterday
      if (key === getTodayKey()) {
        current.setDate(current.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
};

export const startDay = (data: DailyData): DailyData => {
  const key = getTodayKey();
  if (!data[key]) {
    const newData = {
      ...data,
      [key]: {
        date: key,
        tasks: [],
        journal: '',
      }
    };
    saveData(newData);
    return newData;
  }
  return data;
};

export const addTask = (data: DailyData, text: string): DailyData => {
  const key = getTodayKey();
  const currentData = data[key] ? data : startDay(data);
  const entry = currentData[key];
  
  const updatedEntry: Entry = {
    ...entry,
    tasks: [...entry.tasks, { text, done: false }]
  };
  
  const newData = { ...currentData, [key]: updatedEntry };
  saveData(newData);
  return newData;
};

export const toggleTask = (data: DailyData, index: number): DailyData => {
  const key = getTodayKey();
  if (!data[key]) return data;
  
  const entry = data[key];
  const updatedTasks = entry.tasks.map((task, i) => 
    i === index ? { ...task, done: !task.done } : task
  );
  
  const updatedEntry: Entry = { ...entry, tasks: updatedTasks };
  const newData = { ...data, [key]: updatedEntry };
  saveData(newData);
  return newData;
};

export const updateJournal = (data: DailyData, text: string): DailyData => {
  const key = getTodayKey();
  const currentData = data[key] ? data : startDay(data);
  const entry = currentData[key];
  
  const updatedEntry: Entry = { ...entry, journal: text };
  const newData = { ...currentData, [key]: updatedEntry };
  saveData(newData);
  return newData;
};

export const applyTemplate = (data: DailyData, tasks: string[]): DailyData => {
  const key = getTodayKey();
  const currentData = data[key] ? data : startDay(data);
  const entry = currentData[key];
  
  const newTasks: Task[] = tasks.map(text => ({ text, done: false }));
  const updatedEntry: Entry = {
    ...entry,
    tasks: [...entry.tasks, ...newTasks]
  };
  
  const newData = { ...currentData, [key]: updatedEntry };
  saveData(newData);
  return newData;
};
