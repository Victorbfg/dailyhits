export interface Task {
  text: string;
  done: boolean;
}

export interface Entry {
  date: string; // ISO format: YYYY-MM-DD
  tasks: Task[];
  journal: string;
}

export interface DailyData {
  [key: string]: Entry;
}
