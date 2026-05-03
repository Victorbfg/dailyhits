export interface Task {
  text: string;
  done: boolean;
  category?: string;
}

export interface Entry {
  date: string; // ISO format: YYYY-MM-DD
  tasks: Task[];
  journal: string;
  quote: string;
}

export interface DailyData {
  [key: string]: Entry;
}
