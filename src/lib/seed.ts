import { Habit, HabitLog } from './types';
import { formatDateKey } from './dateUtils';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Ранкова зарядка',
    description: '30 хв · щодня · ранкова рутина',
    icon_name: 'Dumbbell',
    color_hex: '#10B981',
    target_type: 'binary',
    target_value: 1,
    unit_label: 'хв',
    position: 0,
    is_archived: 0,
    goal_type: 'days_count',
    goal_target: 30,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 'habit-2',
    title: 'Читання книг',
    description: '20 стор · щодня · саморозвиток',
    icon_name: 'BookOpen',
    color_hex: '#3B82F6',
    target_type: 'numeric',
    target_value: 20,
    unit_label: 'стор',
    position: 1,
    is_archived: 0,
    goal_type: 'target_total',
    goal_target: 300,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 'habit-3',
    title: 'Пити воду',
    description: '8 склянок · щодня · гідратація',
    icon_name: 'Droplets',
    color_hex: '#06B6D4',
    target_type: 'numeric',
    target_value: 8,
    unit_label: 'склянок',
    position: 2,
    is_archived: 0,
    goal_type: 'ongoing',
    goal_target: null,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 'habit-4',
    title: 'Медитація',
    description: '15 хв · щодня · усвідомленість',
    icon_name: 'Brain',
    color_hex: '#8B5CF6',
    target_type: 'binary',
    target_value: 1,
    unit_label: 'хв',
    position: 3,
    is_archived: 0,
    goal_type: 'days_count',
    goal_target: 21,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 'habit-5',
    title: 'Прогулянка на свіжому повітрі',
    description: '5000 кроків · щодня · активність',
    icon_name: 'Footprints',
    color_hex: '#F59E0B',
    target_type: 'numeric',
    target_value: 5000,
    unit_label: 'кроків',
    position: 4,
    is_archived: 0,
    goal_type: 'ongoing',
    goal_target: null,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
];

/**
 * Generate realistic historical demo logs for the past 52 weeks
 */
export function generateSeedLogs(todayDate: Date): HabitLog[] {
  const logs: HabitLog[] = [];
  const habits = INITIAL_HABITS;

  // Generate logs for past 365 days
  for (let i = 0; i <= 365; i++) {
    const cur = new Date(todayDate);
    cur.setDate(todayDate.getDate() - i);
    const dateStr = formatDateKey(cur);
    const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat

    // Slightly different probabilities to make the heatmap feel organic and alive
    habits.forEach((habit, idx) => {
      let prob = 0.72; // default high adherence
      if (idx === 0) prob = 0.85; // Workout - strong
      if (idx === 1) prob = 0.68; // Reading
      if (idx === 2) prob = 0.92; // Water - very consistent
      if (idx === 3) prob = 0.60; // Meditation
      if (idx === 4) prob = 0.78; // Walk

      // Weekends slightly higher or lower
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (idx === 4) prob += 0.15; // More walks on weekend
      }

      // Recent days (last 14 days) keep a great streak
      if (i <= 14) {
        prob = 0.90;
      }

      // Pseudo-random deterministic based on date & habit id
      const seed = Math.sin(i * 13 + idx * 37) * 10000;
      const rand = seed - Math.floor(seed);

      if (rand < prob) {
        const current_value =
          habit.target_type === 'numeric'
            ? habit.target_value
            : 1;

        logs.push({
          habit_id: habit.id,
          log_date: dateStr,
          current_value,
          is_completed: 1,
          updated_at: cur.toISOString(),
        });
      }
    });
  }

  return logs;
}
