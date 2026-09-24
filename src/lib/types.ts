export type TargetType = 'binary' | 'numeric';
export type GoalType = 'ongoing' | 'days_count' | 'target_total';

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  icon_name: string;
  color_hex: string;
  target_type: TargetType;
  target_value: number;
  unit_label: string | null;
  goal_type: GoalType;
  goal_target: number | null;
  position: number;
  is_archived: number;
  created_at: string;
}

export interface HabitLog {
  id?: number;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  current_value: number;
  is_completed: number; // 0 or 1
  updated_at: string;
}

export interface HabitWithLogs extends Habit {
  logs: Record<string, HabitLog>;
  currentStreak: number;
  bestStreak: number;
  seasonRate: number; // 0-100%
  totalCompletedDays: number;
  totalAccumulatedValue: number;
  goalProgressPercent: number; // 0-100
  isGoalReached: boolean;
}

export interface MetricStats {
  todayCompleted: number;
  todayTotal: number;
  todayPercent: number;
  bestStreak: number;
  thisWeekCompleted: number;
  thisWeekTotal: number;
  thisWeekPercent: number;
  consistencyPercent: number;
  activeHabitsCount: number;
}

export interface DayColumn {
  dateStr: string; // YYYY-MM-DD
  dayLetter: string; // П, В, С, Ч, П, С, Н
  dayShortName: string; // Пн, Вт, Ср, Чт, Пт, Сб, Нд
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapCell {
  dateStr: string;
  dayOfWeek: number; // 0 (Mon) to 6 (Sun)
  weekIndex: number; // 0 to 51
  completedCount: number;
  totalActive: number;
  percentage: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  dayRolloverHour: number; // 0 - 23 (default 3)
  notificationsEnabled: boolean;
  reminderTime: string; // 'HH:MM' (default '20:00')
  autostartEnabled: boolean;
  theme: ThemeMode;
}
