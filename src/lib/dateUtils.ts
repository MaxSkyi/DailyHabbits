import { DayColumn, HeatmapCell } from './types';
import { DAYS_ONE_LETTER, DAYS_SHORT, MONTHS_GENITIVE, MONTHS_SHORT } from './i18n';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse YYYY-MM-DD to local Date (at 00:00:00)
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Get the logical date based on the rollover cutoff hour
 * (e.g., if now is 02:30 and cutoff is 03:00, today belongs to yesterday)
 */
export function getLogicalDate(cutoffHour = 3): Date {
  const now = new Date();
  if (now.getHours() < cutoffHour) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}

export function getLogicalDateStr(cutoffHour = 3): string {
  return formatDateKey(getLogicalDate(cutoffHour));
}

/**
 * Get 7 days of the week containing referenceDate (Monday to Sunday)
 */
export function getWeekDays(referenceDate: Date, logicalTodayStr: string): DayColumn[] {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday ...
  // Distance to Monday (if day is 0/Sunday -> distance is -6, if 1/Monday -> 0)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const days: DayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = formatDateKey(current);

    days.push({
      dateStr,
      dayLetter: DAYS_ONE_LETTER[i],
      dayShortName: DAYS_SHORT[i],
      dayOfMonth: current.getDate(),
      monthName: MONTHS_GENITIVE[current.getMonth()],
      isToday: dateStr === logicalTodayStr,
      isFuture: dateStr > logicalTodayStr,
    });
  }

  return days;
}

/**
 * Calculate consecutive current and best streaks for a habit
 */
export function calculateStreaks(
  logs: Record<string, { is_completed: number }>,
  logicalTodayStr: string
): { currentStreak: number; bestStreak: number } {
  const dates = Object.keys(logs)
    .filter((k) => logs[k]?.is_completed === 1)
    .sort();

  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Calculate Best Streak
  let maxStreak = 0;
  let running = 0;
  let prevTime: number | null = null;

  for (const dStr of dates) {
    const time = parseDateKey(dStr).getTime();
    if (prevTime === null) {
      running = 1;
    } else {
      const diffDays = Math.round((time - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    prevTime = time;
    if (running > maxStreak) {
      maxStreak = running;
    }
  }

  // Calculate Current Streak
  let currentStreak = 0;
  let checkDate = parseDateKey(logicalTodayStr);

  // If today is completed, start from today
  const todayCompleted = logs[logicalTodayStr]?.is_completed === 1;
  if (!todayCompleted) {
    // If today is not completed yet, check if yesterday was completed
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (logs[key]?.is_completed === 1) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(maxStreak, currentStreak),
  };
}

/**
 * Build 52 weeks x 7 days heatmap grid starting 52 weeks ago up to current week end
 */
export function buildHeatmapGrid(
  logsByDate: Record<string, number>, // dateStr -> completed count
  totalActiveHabits: number,
  logicalTodayStr: string
): { grid: HeatmapCell[][]; monthLabels: { label: string; weekIndex: number }[] } {
  const today = parseDateKey(logicalTodayStr);
  const day = today.getDay();
  // Find current week Sunday
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + diffToSunday);

  // Total 52 weeks (364 days)
  const startDate = new Date(endSunday);
  startDate.setDate(endSunday.getDate() - (52 * 7 - 1));

  const grid: HeatmapCell[][] = []; // 7 rows (Mon=0 to Sun=6)
  for (let r = 0; r < 7; r++) {
    grid.push([]);
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < 52; w++) {
    for (let d = 0; d < 7; d++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + (w * 7 + d));
      const dateStr = formatDateKey(cur);

      // Add month label when month changes on Monday (d === 0)
      if (d === 0) {
        const m = cur.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({
            label: MONTHS_SHORT[m],
            weekIndex: w,
          });
          lastMonth = m;
        }
      }

      const completed = logsByDate[dateStr] || 0;
      const pct = totalActiveHabits > 0 ? (completed / totalActiveHabits) * 100 : 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (pct > 0 && pct <= 25) level = 1;
      else if (pct > 25 && pct <= 50) level = 2;
      else if (pct > 50 && pct <= 75) level = 3;
      else if (pct > 75) level = 4;

      grid[d].push({
        dateStr,
        dayOfWeek: d,
        weekIndex: w,
        completedCount: completed,
        totalActive: totalActiveHabits,
        percentage: Math.round(pct),
        level,
      });
    }
  }

  return { grid, monthLabels };
}
