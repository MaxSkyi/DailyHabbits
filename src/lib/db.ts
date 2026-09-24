import Database from '@tauri-apps/plugin-sql';
import { Habit, HabitLog, HabitWithLogs, MetricStats, AppSettings } from './types';
import { calculateStreaks, formatDateKey, parseDateKey, getWeekDays } from './dateUtils';

let dbInstance: Database | null = null;
let isTauriEnv = false;

// In-memory fallback for local browser testing & caching
let memoryHabits: Habit[] = [];
let memoryLogs: HabitLog[] = [];
let memorySettings: AppSettings = {
  dayRolloverHour: 3,
  notificationsEnabled: true,
  reminderTime: '20:00',
  autostartEnabled: false,
  theme: 'system',
};

export async function getDb(): Promise<Database | null> {
  if (dbInstance) return dbInstance;
  try {
    // Check if we are running in Tauri context
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      dbInstance = await Database.load('sqlite:habits.db');
      isTauriEnv = true;
      return dbInstance;
    }
  } catch (err) {
    console.warn('Tauri SQL plugin not available, using in-memory/localStorage storage', err);
  }
  isTauriEnv = false;
  return null;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();

  if (db && isTauriEnv) {
    // 1. Create tables according to schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon_name TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        target_type TEXT NOT NULL DEFAULT 'binary',
        target_value INTEGER DEFAULT 1,
        unit_label TEXT,
        goal_type TEXT NOT NULL DEFAULT 'ongoing',
        goal_target INTEGER DEFAULT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    // Safe schema migrations for existing local databases
    try {
      await db.execute(`ALTER TABLE habits ADD COLUMN goal_type TEXT DEFAULT 'ongoing';`);
    } catch {}
    try {
      await db.execute(`ALTER TABLE habits ADD COLUMN goal_target INTEGER DEFAULT NULL;`);
    } catch {}

    await db.execute(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 1,
        is_completed INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        UNIQUE(habit_id, log_date),
        FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_archived, position);`);

    // Ensure default settings exist if not present
    await db.execute(`
      INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('day_rollover_hour', '3'),
        ('notifications_enabled', 'true'),
        ('reminder_time', '20:00'),
        ('autostart_enabled', 'false'),
        ('theme', 'system');
    `);
  } else {
    // Browser fallback with localStorage
    const savedHabits = localStorage.getItem('habits_data');
    const savedLogs = localStorage.getItem('habit_logs_data');
    const savedSettings = localStorage.getItem('habits_settings');

    if (savedHabits) {
      try {
        memoryHabits = JSON.parse(savedHabits);
      } catch {}
    } else {
      memoryHabits = [];
      localStorage.setItem('habits_data', JSON.stringify([]));
    }

    if (savedLogs) {
      try {
        memoryLogs = JSON.parse(savedLogs);
      } catch {}
    } else {
      memoryLogs = [];
      localStorage.setItem('habit_logs_data', JSON.stringify([]));
    }

    if (savedSettings) {
      try {
        memorySettings = JSON.parse(savedSettings);
      } catch {}
    }
  }
}

export function recomputeHabitStats(
  rawHabit: Habit,
  habitLogs: Record<string, HabitLog>,
  logicalTodayStr: string
): HabitWithLogs {
  const habit: Habit = {
    ...rawHabit,
    goal_type: rawHabit.goal_type || 'ongoing',
    goal_target: rawHabit.goal_target != null ? Number(rawHabit.goal_target) : null,
  };

  const { currentStreak, bestStreak } = calculateStreaks(habitLogs, logicalTodayStr);

  // Season rate (last 90 days)
  const ninetyDaysAgo = new Date(parseDateKey(logicalTodayStr));
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysStr = formatDateKey(ninetyDaysAgo);

  let seasonCompleted = 0;
  let totalCompletedDays = 0;
  let totalAccumulatedValue = 0;

  for (const [dStr, log] of Object.entries(habitLogs)) {
    if (Number(log.is_completed) === 1) {
      totalCompletedDays++;
      totalAccumulatedValue += Number(log.current_value) || 1;
      if (dStr >= ninetyDaysStr && dStr <= logicalTodayStr) {
        seasonCompleted++;
      }
    }
  }

  const seasonRate = Math.min(100, Math.round((seasonCompleted / 90) * 100));

  // Goal Progress calculation
  let goalProgressPercent = 0;
  let isGoalReached = false;
  const target = habit.goal_target != null ? Number(habit.goal_target) : 0;

  if (habit.goal_type === 'days_count' && target > 0) {
    goalProgressPercent = Math.min(100, Math.round((totalCompletedDays / target) * 100));
    isGoalReached = totalCompletedDays >= target;
  } else if (habit.goal_type === 'target_total' && target > 0) {
    goalProgressPercent = Math.min(100, Math.round((totalAccumulatedValue / target) * 100));
    isGoalReached = totalAccumulatedValue >= target;
  }

  return {
    ...habit,
    logs: habitLogs,
    currentStreak,
    bestStreak,
    seasonRate,
    totalCompletedDays,
    totalAccumulatedValue,
    goalProgressPercent,
    isGoalReached,
  };
}

export async function loadHabitsWithLogs(
  logicalTodayStr: string,
  includeArchived = false
): Promise<HabitWithLogs[]> {
  const db = await getDb();
  let habits: Habit[] = [];
  let logs: HabitLog[] = [];

  if (db && isTauriEnv) {
    habits = await db.select<Habit[]>(
      includeArchived
        ? `SELECT * FROM habits ORDER BY position ASC, created_at ASC`
        : `SELECT * FROM habits WHERE is_archived = 0 ORDER BY position ASC, created_at ASC`
    );
    logs = await db.select<HabitLog[]>(`SELECT * FROM habit_logs`);
  } else {
    habits = includeArchived
      ? [...memoryHabits].sort((a, b) => a.position - b.position)
      : memoryHabits.filter((h) => h.is_archived === 0).sort((a, b) => a.position - b.position);
    logs = memoryLogs;
  }

  // Group logs by habit_id
  const logsByHabit: Record<string, Record<string, HabitLog>> = {};
  for (const l of logs) {
    if (!logsByHabit[l.habit_id]) {
      logsByHabit[l.habit_id] = {};
    }
    logsByHabit[l.habit_id][l.log_date] = l;
  }

  // Calculate stats and goal progress for each habit
  return habits.map((habit) => {
    const habitLogs = logsByHabit[habit.id] || {};
    return recomputeHabitStats(habit, habitLogs, logicalTodayStr);
  });
}

export async function toggleHabitLog(
  habitId: string,
  logDate: string,
  targetValue: number = 1
): Promise<{ isCompleted: boolean; currentValue: number }> {
  const db = await getDb();
  const nowIso = new Date().toISOString();

  if (db && isTauriEnv) {
    const existing = await db.select<HabitLog[]>(
      `SELECT * FROM habit_logs WHERE habit_id = $1 AND log_date = $2`,
      [habitId, logDate]
    );

    if (existing && existing.length > 0) {
      const cur = existing[0];
      const newCompleted = cur.is_completed === 1 ? 0 : 1;
      const newVal = newCompleted === 1 ? targetValue : 0;

      await db.execute(
        `UPDATE habit_logs SET is_completed = $1, current_value = $2, updated_at = $3 WHERE habit_id = $4 AND log_date = $5`,
        [newCompleted, newVal, nowIso, habitId, logDate]
      );
      return { isCompleted: newCompleted === 1, currentValue: newVal };
    } else {
      await db.execute(
        `INSERT INTO habit_logs (habit_id, log_date, current_value, is_completed, updated_at)
         VALUES ($1, $2, $3, 1, $4)`,
        [habitId, logDate, targetValue, nowIso]
      );
      return { isCompleted: true, currentValue: targetValue };
    }
  } else {
    // Memory fallback
    const idx = memoryLogs.findIndex((l) => l.habit_id === habitId && l.log_date === logDate);
    if (idx >= 0) {
      const cur = memoryLogs[idx];
      const newCompleted = cur.is_completed === 1 ? 0 : 1;
      const newVal = newCompleted === 1 ? targetValue : 0;
      memoryLogs[idx] = {
        ...cur,
        is_completed: newCompleted,
        current_value: newVal,
        updated_at: nowIso,
      };
      localStorage.setItem('habit_logs_data', JSON.stringify(memoryLogs));
      return { isCompleted: newCompleted === 1, currentValue: newVal };
    } else {
      const newLog: HabitLog = {
        habit_id: habitId,
        log_date: logDate,
        current_value: targetValue,
        is_completed: 1,
        updated_at: nowIso,
      };
      memoryLogs.push(newLog);
      localStorage.setItem('habit_logs_data', JSON.stringify(memoryLogs));
      return { isCompleted: true, currentValue: targetValue };
    }
  }
}

export async function saveHabit(
  habitData: Omit<Habit, 'created_at'> & { created_at?: string }
): Promise<Habit> {
  const db = await getDb();
  const created_at = habitData.created_at || new Date().toISOString();
  const habit: Habit = {
    ...habitData,
    goal_type: habitData.goal_type || 'ongoing',
    goal_target: habitData.goal_target != null ? Number(habitData.goal_target) : null,
    created_at,
  };

  if (db && isTauriEnv) {
    await db.execute(
      `INSERT OR REPLACE INTO habits (id, title, description, icon_name, color_hex, target_type, target_value, unit_label, goal_type, goal_target, position, is_archived, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        habit.id,
        habit.title,
        habit.description,
        habit.icon_name,
        habit.color_hex,
        habit.target_type,
        habit.target_value,
        habit.unit_label,
        habit.goal_type,
        habit.goal_target,
        habit.position,
        habit.is_archived,
        habit.created_at,
      ]
    );
  } else {
    const idx = memoryHabits.findIndex((h) => h.id === habit.id);
    if (idx >= 0) {
      memoryHabits[idx] = habit;
    } else {
      memoryHabits.push(habit);
    }
    localStorage.setItem('habits_data', JSON.stringify(memoryHabits));
  }

  return habit;
}

export async function archiveHabit(habitId: string, isArchived: boolean = true): Promise<void> {
  const db = await getDb();
  const val = isArchived ? 1 : 0;
  if (db && isTauriEnv) {
    await db.execute(`UPDATE habits SET is_archived = $1 WHERE id = $2`, [val, habitId]);
  } else {
    const idx = memoryHabits.findIndex((h) => h.id === habitId);
    if (idx >= 0) {
      memoryHabits[idx] = { ...memoryHabits[idx], is_archived: val };
      localStorage.setItem('habits_data', JSON.stringify(memoryHabits));
    }
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  const db = await getDb();
  if (db && isTauriEnv) {
    await db.execute(`DELETE FROM habit_logs WHERE habit_id = $1`, [habitId]);
    await db.execute(`DELETE FROM habits WHERE id = $1`, [habitId]);
  } else {
    memoryHabits = memoryHabits.filter((h) => h.id !== habitId);
    memoryLogs = memoryLogs.filter((l) => l.habit_id !== habitId);
    localStorage.setItem('habits_data', JSON.stringify(memoryHabits));
    localStorage.setItem('habit_logs_data', JSON.stringify(memoryLogs));
  }
}

export async function updateHabitsOrder(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  if (db && isTauriEnv) {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.execute(`UPDATE habits SET position = $1 WHERE id = $2`, [i, orderedIds[i]]);
    }
  } else {
    orderedIds.forEach((id, index) => {
      const h = memoryHabits.find((item) => item.id === id);
      if (h) h.position = index;
    });
    localStorage.setItem('habits_data', JSON.stringify(memoryHabits));
  }
}

export async function calculateMetrics(
  habits: HabitWithLogs[],
  logicalTodayStr: string
): Promise<MetricStats> {
  const activeHabits = habits.filter((h) => h.is_archived === 0);
  const totalCount = activeHabits.length;

  // 1. Today
  let todayCompleted = 0;
  activeHabits.forEach((h) => {
    if (h.logs[logicalTodayStr]?.is_completed === 1) {
      todayCompleted++;
    }
  });
  const todayPercent = totalCount > 0 ? Math.round((todayCompleted / totalCount) * 100) : 0;

  // 2. Best streak across all habits
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, h.bestStreak), 0);

  // 3. This week
  const weekDays = getWeekDays(parseDateKey(logicalTodayStr), logicalTodayStr);
  let thisWeekCompleted = 0;
  let thisWeekTotal = 0;

  weekDays.forEach((day) => {
    if (!day.isFuture) {
      activeHabits.forEach((h) => {
        thisWeekTotal++;
        if (h.logs[day.dateStr]?.is_completed === 1) {
          thisWeekCompleted++;
        }
      });
    }
  });
  const thisWeekPercent = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

  // 4. Overall Consistency (last 30 days)
  let past30Total = 0;
  let past30Completed = 0;
  for (let i = 0; i < 30; i++) {
    const cur = new Date(parseDateKey(logicalTodayStr));
    cur.setDate(cur.getDate() - i);
    const dateStr = formatDateKey(cur);

    activeHabits.forEach((h) => {
      past30Total++;
      if (h.logs[dateStr]?.is_completed === 1) {
        past30Completed++;
      }
    });
  }
  const consistencyPercent = past30Total > 0 ? Math.round((past30Completed / past30Total) * 100) : 0;

  return {
    todayCompleted,
    todayTotal: totalCount,
    todayPercent,
    bestStreak,
    thisWeekCompleted,
    thisWeekTotal,
    thisWeekPercent,
    consistencyPercent,
    activeHabitsCount: totalCount,
  };
}

export async function getHeatmapLogsMap(): Promise<Record<string, number>> {
  const db = await getDb();
  const map: Record<string, number> = {};

  if (db && isTauriEnv) {
    const rows = await db.select<{ log_date: string; completed_count: number }[]>(
      `SELECT log_date, COUNT(*) as completed_count FROM habit_logs WHERE is_completed = 1 GROUP BY log_date`
    );
    rows.forEach((r) => {
      map[r.log_date] = Number(r.completed_count);
    });
  } else {
    memoryLogs.forEach((l) => {
      if (l.is_completed === 1) {
        map[l.log_date] = (map[l.log_date] || 0) + 1;
      }
    });
  }

  return map;
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb();
  if (db && isTauriEnv) {
    try {
      const rows = await db.select<{ key: string; value: string }[]>(`SELECT * FROM settings`);
      const dict: Record<string, string> = {};
      rows.forEach((r) => {
        dict[r.key] = r.value;
      });

      return {
        dayRolloverHour: Number(dict['day_rollover_hour'] ?? 3),
        notificationsEnabled: dict['notifications_enabled'] !== 'false',
        reminderTime: dict['reminder_time'] || '20:00',
        autostartEnabled: dict['autostart_enabled'] === 'true',
        theme: (dict['theme'] as 'dark' | 'light' | 'system') || 'system',
      };
    } catch {
      return memorySettings;
    }
  }
  return memorySettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  memorySettings = settings;
  const db = await getDb();
  if (db && isTauriEnv) {
    await db.execute(
      `INSERT OR REPLACE INTO settings (key, value) VALUES 
        ('day_rollover_hour', $1), 
        ('notifications_enabled', $2), 
        ('reminder_time', $3), 
        ('autostart_enabled', $4), 
        ('theme', $5)`,
      [
        String(settings.dayRolloverHour),
        String(settings.notificationsEnabled),
        settings.reminderTime || '20:00',
        String(settings.autostartEnabled),
        settings.theme,
      ]
    );
  } else {
    localStorage.setItem('habits_settings', JSON.stringify(settings));
  }
}

export async function exportBackup(): Promise<string> {
  const db = await getDb();
  let habits: Habit[] = [];
  let logs: HabitLog[] = [];
  let settings = await loadSettings();

  if (db && isTauriEnv) {
    habits = await db.select<Habit[]>(`SELECT * FROM habits`);
    logs = await db.select<HabitLog[]>(`SELECT * FROM habit_logs`);
  } else {
    habits = memoryHabits;
    logs = memoryLogs;
  }

  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    habits,
    logs,
    settings,
  }, null, 2);
}

export async function importBackup(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data.habits) || !Array.isArray(data.logs)) {
      throw new Error('Invalid backup schema');
    }

    const db = await getDb();
    if (db && isTauriEnv) {
      await db.execute(`DELETE FROM habit_logs`);
      await db.execute(`DELETE FROM habits`);

      for (const h of data.habits) {
        await db.execute(
          `INSERT INTO habits (id, title, description, icon_name, color_hex, target_type, target_value, unit_label, goal_type, goal_target, position, is_archived, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            h.id,
            h.title,
            h.description,
            h.icon_name,
            h.color_hex,
            h.target_type,
            h.target_value,
            h.unit_label,
            h.goal_type || 'ongoing',
            h.goal_target ?? null,
            h.position,
            h.is_archived,
            h.created_at,
          ]
        );
      }

      for (const l of data.logs) {
        await db.execute(
          `INSERT INTO habit_logs (habit_id, log_date, current_value, is_completed, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [l.habit_id, l.log_date, l.current_value, l.is_completed, l.updated_at]
        );
      }
    } else {
      memoryHabits = data.habits;
      memoryLogs = data.logs;
      localStorage.setItem('habits_data', JSON.stringify(memoryHabits));
      localStorage.setItem('habit_logs_data', JSON.stringify(memoryLogs));
    }

    return true;
  } catch (err) {
    console.error('Failed to import backup', err);
    return false;
  }
}

export async function clearAllDatabaseData(): Promise<void> {
  const db = await getDb();
  if (db && isTauriEnv) {
    await db.execute(`DELETE FROM habit_logs`);
    await db.execute(`DELETE FROM habits`);
  } else {
    memoryHabits = [];
    memoryLogs = [];
    localStorage.removeItem('habits_data');
    localStorage.removeItem('habit_logs_data');
  }
}

