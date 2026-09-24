import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { MetricCards } from './components/MetricCards';
import { HabitList } from './components/HabitList';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { HabitModal } from './components/HabitModal';
import { SettingsModal } from './components/SettingsModal';
import { UpdateModal } from './components/UpdateModal';
import { Habit, HabitWithLogs, MetricStats, AppSettings } from './lib/types';
import { checkForAppUpdate } from './lib/updater';
import { Update } from '@tauri-apps/plugin-updater';
import {
  initDatabase,
  loadHabitsWithLogs,
  recomputeHabitStats,
  toggleHabitLog,
  saveHabit,
  deleteHabit,
  archiveHabit,
  updateHabitsOrder,
  calculateMetrics,
  getHeatmapLogsMap,
  loadSettings,
  saveSettings,
} from './lib/db';
import {
  getLogicalDate,
  getLogicalDateStr,
  getWeekDays,
} from './lib/dateUtils';
import { applyTheme, getNextTheme } from './lib/theme';
import { triggerCelebrationConfetti } from './lib/confetti';
import { checkAndSendDailyReminder } from './lib/notifications';
import { listen } from '@tauri-apps/api/event';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [heatmapLogs, setHeatmapLogs] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<AppSettings>({
    dayRolloverHour: 3,
    notificationsEnabled: true,
    reminderTime: '20:00',
    autostartEnabled: false,
    theme: 'system',
  });

  // Reference week date (default to current logical date)
  const [viewDate, setViewDate] = useState<Date>(() => getLogicalDate(3));

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Apply theme whenever settings.theme changes
  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Current logical today string based on rollover hour
  const logicalTodayStr = useMemo(() => {
    return getLogicalDateStr(settings.dayRolloverHour);
  }, [settings.dayRolloverHour]);

  // Load all app data
  const loadData = useCallback(async () => {
    try {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      applyTheme(loadedSettings.theme);

      const todayStr = getLogicalDateStr(loadedSettings.dayRolloverHour);
      const [loadedHabits, loadedHeatmap] = await Promise.all([
        loadHabitsWithLogs(todayStr, true),
        getHeatmapLogsMap(),
      ]);

      setHabits(loadedHabits);
      setHeatmapLogs(loadedHeatmap);
    } catch (err) {
      console.error('Failed to load habits data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & Tauri event listeners
  useEffect(() => {
    let unlistenSettings: (() => void) | undefined;
    let unlistenDayChanged: (() => void) | undefined;

    const setup = async () => {
      await initDatabase();
      await loadData();

      // Check for available updates on startup (silently in background)
      try {
        const update = await checkForAppUpdate();
        if (update) {
          setAvailableUpdate(update);
          setIsUpdateModalOpen(true);
        }
      } catch {}

      try {
        unlistenSettings = await listen('open-settings', () => {
          setIsSettingsModalOpen(true);
        });

        unlistenDayChanged = await listen('day-changed', () => {
          loadData();
        });
      } catch (err) {
        // Browser mode fallback
      }
    };

    setup();

    return () => {
      if (unlistenSettings) unlistenSettings();
      if (unlistenDayChanged) unlistenDayChanged();
    };
  }, [loadData]);

  // Calculated metrics
  const [metrics, setMetrics] = useState<MetricStats>({
    todayCompleted: 0,
    todayTotal: 0,
    todayPercent: 0,
    bestStreak: 0,
    thisWeekCompleted: 0,
    thisWeekTotal: 0,
    thisWeekPercent: 0,
    consistencyPercent: 0,
    activeHabitsCount: 0,
  });

  useEffect(() => {
    calculateMetrics(habits, logicalTodayStr).then(setMetrics);
  }, [habits, logicalTodayStr]);

  // Daily habit notification reminder background checker
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    checkAndSendDailyReminder(
      habits,
      logicalTodayStr,
      settings.reminderTime,
      settings.notificationsEnabled
    );

    const interval = setInterval(() => {
      checkAndSendDailyReminder(
        habits,
        logicalTodayStr,
        settings.reminderTime,
        settings.notificationsEnabled
      );
    }, 25000);

    return () => clearInterval(interval);
  }, [habits, logicalTodayStr, settings.reminderTime, settings.notificationsEnabled]);

  // Week days for the current viewDate
  const currentWeekDays = useMemo(() => {
    return getWeekDays(viewDate, logicalTodayStr);
  }, [viewDate, logicalTodayStr]);

  // Check if viewing current week
  const isCurrentWeek = useMemo(() => {
    return currentWeekDays.some((d) => d.dateStr === logicalTodayStr);
  }, [currentWeekDays, logicalTodayStr]);

  // Week Navigation handlers
  const handlePrevWeek = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleTodayWeek = () => {
    setViewDate(getLogicalDate(settings.dayRolloverHour));
  };

  // Theme Toggle Handler (Dark -> Light -> System)
  const handleToggleTheme = async () => {
    const nextTheme = getNextTheme(settings.theme);
    const updatedSettings: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updatedSettings);
    applyTheme(nextTheme);
    await saveSettings(updatedSettings);
  };

  // Optimistic Habit Toggle
  const handleToggleDay = async (
    habitId: string,
    dateStr: string,
    targetValue: number
  ) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const currentLog = habit.logs[dateStr];
    const currentlyCompleted = currentLog?.is_completed === 1;
    const nextCompleted = !currentlyCompleted;

    // 1. Instant Optimistic State Update with Full Recalculation
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id !== habitId) return h;

        const updatedLogs = {
          ...h.logs,
          [dateStr]: {
            habit_id: habitId,
            log_date: dateStr,
            current_value: nextCompleted ? targetValue : 0,
            is_completed: nextCompleted ? 1 : 0,
            updated_at: new Date().toISOString(),
          },
        };

        return recomputeHabitStats(h, updatedLogs, logicalTodayStr);
      })
    );

    // Trigger celebration confetti if all active habits for today are now completed!
    const activeHabits = habits.filter((h) => h.is_archived === 0);
    if (nextCompleted && dateStr === logicalTodayStr && activeHabits.length > 0) {
      const willAllBeCompleted = activeHabits.every((h) => {
        if (h.id === habitId) return true;
        return h.logs[dateStr]?.is_completed === 1;
      });
      if (willAllBeCompleted) {
        // Small delay for smooth UI transition
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 150);
      }
    }

    // Update heatmap count optimistically
    setHeatmapLogs((prev) => {
      const curCount = prev[dateStr] || 0;
      const nextCount = nextCompleted ? curCount + 1 : Math.max(0, curCount - 1);
      return {
        ...prev,
        [dateStr]: nextCount,
      };
    });

    // 2. Background Asynchronous Database Write
    try {
      await toggleHabitLog(habitId, dateStr, targetValue);
    } catch (err) {
      console.error('Failed to toggle habit in db, reverting optimistic update', err);
      // Revert if db write fails
      loadData();
    }
  };

  // Habit CRUD handlers
  const handleSaveHabit = async (
    habitData: Omit<Habit, 'created_at'> & { created_at?: string }
  ) => {
    await saveHabit(habitData);
    await loadData();
  };

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId);
    await loadData();
  };

  const handleToggleArchive = async (habitId: string, isArchived: boolean) => {
    await archiveHabit(habitId, isArchived);
    await loadData();
  };

  const handleEditHabit = (habit: HabitWithLogs) => {
    setEditingHabit(habit);
    setIsAddModalOpen(true);
  };

  const handleReorderHabits = async (newOrderedHabits: HabitWithLogs[]) => {
    // 1. Instant optimistic state update
    setHabits(newOrderedHabits);

    // 2. Background database write
    try {
      await updateHabitsOrder(newOrderedHabits.map((h) => h.id));
    } catch (err) {
      console.error('Failed to update habit order', err);
      loadData();
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    applyTheme(newSettings.theme);
    await saveSettings(newSettings);
    await loadData();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#0B0C10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] dark:bg-[#0B0C10] bg-slate-50 text-slate-900 dark:text-gray-100 flex flex-col pt-14 selection:bg-emerald-500/30 transition-colors duration-200">
      {/* Frameless Top Bar */}
      <TitleBar
        currentDateStr={logicalTodayStr}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onOpenAddModal={() => {
          setEditingHabit(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        availableUpdate={availableUpdate}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top 4 Metrics Cards */}
        <MetricCards metrics={metrics} />

        {/* Habits List with Week Navigation */}
        <HabitList
          habits={habits}
          days={currentWeekDays}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onTodayWeek={handleTodayWeek}
          isCurrentWeek={isCurrentWeek}
          onToggleDay={handleToggleDay}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleArchive={handleToggleArchive}
          onOpenAddModal={() => {
            setEditingHabit(null);
            setIsAddModalOpen(true);
          }}
          onReorderHabits={handleReorderHabits}
        />

        {/* 52 Weeks x 7 Days Activity Heatmap */}
        <ActivityHeatmap
          logsByDate={heatmapLogs}
          totalActiveHabits={habits.filter((h) => h.is_archived === 0).length}
          logicalTodayStr={logicalTodayStr}
        />
      </main>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onReloadData={loadData}
        onFoundUpdate={(update) => {
          setAvailableUpdate(update);
          setIsUpdateModalOpen(true);
          setIsSettingsModalOpen(false);
        }}
      />

      {/* App Update Modal */}
      <UpdateModal
        update={availableUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
};

export default App;
