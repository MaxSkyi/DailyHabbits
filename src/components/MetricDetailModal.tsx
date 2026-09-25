import React from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Trophy,
  Sparkles,
  BarChart3,
  Award,
} from 'lucide-react';
import { HabitWithLogs, MetricStats, DayColumn } from '../lib/types';
import { IconRenderer } from './IconRenderer';
import { pluralize } from '../lib/i18n';
import { formatDateKey, parseDateKey } from '../lib/dateUtils';

export type MetricDetailType = 'today' | 'streak' | 'week' | 'consistency';

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeType: MetricDetailType;
  onChangeType: (type: MetricDetailType) => void;
  metrics: MetricStats;
  habits: HabitWithLogs[];
  logicalTodayStr: string;
  weekDays: DayColumn[];
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  isOpen,
  onClose,
  activeType,
  onChangeType,
  metrics,
  habits,
  logicalTodayStr,
  weekDays,
}) => {
  if (!isOpen) return null;

  const activeHabits = habits.filter((h) => h.is_archived === 0);

  // 1. Calculate Today Details
  const todayDoneList = activeHabits.filter(
    (h) => h.logs[logicalTodayStr]?.is_completed === 1
  );
  const todayPendingList = activeHabits.filter(
    (h) => h.logs[logicalTodayStr]?.is_completed !== 1
  );

  // 2. Calculate Streaks Details
  const sortedByCurrentStreak = [...activeHabits].sort(
    (a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)
  );
  const bestOverallStreakHabit = [...activeHabits].sort(
    (a, b) => (b.bestStreak || 0) - (a.bestStreak || 0)
  )[0];

  // 3. Calculate Week Details per Day
  const weekBreakdown = weekDays.map((day) => {
    let completed = 0;
    activeHabits.forEach((h) => {
      if (h.logs[day.dateStr]?.is_completed === 1) completed++;
    });
    const total = activeHabits.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...day,
      completed,
      total,
      percent,
    };
  });

  const bestDayOfWeek = [...weekBreakdown]
    .filter((d) => !d.isFuture && d.total > 0)
    .sort((a, b) => b.percent - a.percent)[0];

  // 4. Calculate Consistency Details (Last 30 Days Breakdown by 4 Weeks)
  const past30Days: { dateStr: string; completed: number; total: number; percent: number }[] = [];
  let perfectDaysCount = 0;
  let totalTasks30 = 0;
  let completedTasks30 = 0;

  for (let i = 0; i < 30; i++) {
    const cur = new Date(parseDateKey(logicalTodayStr));
    cur.setDate(cur.getDate() - i);
    const dateStr = formatDateKey(cur);

    let completed = 0;
    activeHabits.forEach((h) => {
      totalTasks30++;
      if (h.logs[dateStr]?.is_completed === 1) {
        completed++;
        completedTasks30++;
      }
    });

    const total = activeHabits.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (percent === 100 && total > 0) {
      perfectDaysCount++;
    }

    past30Days.push({ dateStr, completed, total, percent });
  }

  // 4 Weeks buckets (Week 1 = last 7 days, Week 2 = 8-14, Week 3 = 15-21, Week 4 = 22-28)
  const weeksStats = [
    { label: 'Останні 7 днів', days: past30Days.slice(0, 7) },
    { label: '8 – 14 днів тому', days: past30Days.slice(7, 14) },
    { label: '15 – 21 день тому', days: past30Days.slice(14, 21) },
    { label: '22 – 28 днів тому', days: past30Days.slice(21, 28) },
  ].map((w) => {
    const total = w.days.reduce((acc, d) => acc + d.total, 0);
    const completed = w.days.reduce((acc, d) => acc + d.completed, 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...w, total, completed, percent };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1C1F2B]/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-black/40 rounded-2xl flex-1 max-w-md overflow-x-auto">
            {/* Tab 1: Сьогодні */}
            <button
              type="button"
              onClick={() => onChangeType('today')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeType === 'today'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Сьогодні</span>
            </button>

            {/* Tab 2: Серії */}
            <button
              type="button"
              onClick={() => onChangeType('streak')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeType === 'streak'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Серії</span>
            </button>

            {/* Tab 3: Цього тижня */}
            <button
              type="button"
              onClick={() => onChangeType('week')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeType === 'week'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Тиждень</span>
            </button>

            {/* Tab 4: Постійність */}
            <button
              type="button"
              onClick={() => onChangeType('consistency')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeType === 'consistency'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>30 днів</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* 1. TODAY BREAKDOWN */}
          {activeType === 'today' && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Прогрес на сьогодні</span>
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.todayCompleted} з {metrics.todayTotal}{' '}
                    <span className="text-sm font-medium text-emerald-500">
                      ({metrics.todayPercent}%)
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Habits List for Today */}
              <div className="space-y-4">
                {/* Done habits */}
                {todayDoneList.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ✅ Виконано ({todayDoneList.length})
                    </h5>
                    <div className="space-y-1.5">
                      {todayDoneList.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1C1F2B] border border-emerald-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: `${h.color_hex || '#10B981'}15`,
                                color: h.color_hex || '#10B981',
                              }}
                            >
                              <IconRenderer name={h.icon_name} className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {h.title}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {h.target_type === 'numeric'
                                  ? `${h.logs[logicalTodayStr]?.current_value || h.target_value} ${h.unit_label || 'од'}`
                                  : 'Завершено'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            Виконано
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending habits */}
                {todayPendingList.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ⏳ Залишилось виконати ({todayPendingList.length})
                    </h5>
                    <div className="space-y-1.5">
                      {todayPendingList.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1C1F2B] border border-slate-200 dark:border-white/5 opacity-80"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: `${h.color_hex || '#10B981'}10`,
                                color: h.color_hex || '#10B981',
                              }}
                            >
                              <IconRenderer name={h.icon_name} className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {h.title}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {h.target_type === 'numeric'
                                  ? `Ціль: ${h.target_value} ${h.unit_label || 'од'}`
                                  : 'Очікує відмітки'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5">
                            В очікуванні
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. STREAKS BREAKDOWN */}
          {activeType === 'streak' && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Найкраща серія серед звичок</span>
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pluralize(metrics.bestStreak, 'день', 'дні', 'днів')} поспіль
                  </p>
                  {bestOverallStreakHabit && (
                    <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-0.5">
                      Лідер: <span className="font-semibold">{bestOverallStreakHabit.title}</span>
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              {/* All Habits Streaks Ranking */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  🔥 Поточні та рекордні серії по звичках
                </h5>
                <div className="space-y-2">
                  {sortedByCurrentStreak.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C1F2B] border border-slate-200 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${h.color_hex || '#F59E0B'}15`,
                              color: h.color_hex || '#F59E0B',
                            }}
                          >
                            <IconRenderer name={h.icon_name} className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {h.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold" title="Поточна серія">
                            <Flame className="w-3.5 h-3.5 fill-amber-500/30" />
                            <span>{h.currentStreak || 0} дн</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-medium text-[11px]" title="Рекорд">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>Рекорд: {h.bestStreak || 0} дн</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Streak Progress */}
                      <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, ((h.currentStreak || 0) / Math.max(1, h.bestStreak || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. WEEK BREAKDOWN */}
          {activeType === 'week' && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Підсумок поточного тижня</span>
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.thisWeekPercent}%{' '}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({metrics.thisWeekCompleted} з {metrics.thisWeekTotal} завдань)
                    </span>
                  </p>
                  {bestDayOfWeek && (
                    <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 mt-0.5">
                      Найкращий день: <span className="font-semibold">{bestDayOfWeek.dayShortName} ({bestDayOfWeek.percent}%)</span>
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>

              {/* 7 Days of the Week Breakdown */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  📅 Розподіл активності по днях тижня
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {weekBreakdown.map((d) => (
                    <div
                      key={d.dateStr}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        d.isToday
                          ? 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-500/15'
                          : d.isFuture
                          ? 'bg-slate-50/50 dark:bg-[#1C1F2B]/40 border-slate-200/50 dark:border-white/5 opacity-50'
                          : 'bg-slate-50 dark:bg-[#1C1F2B] border-slate-200 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs font-bold shrink-0 ${
                            d.isToday
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-[9px] uppercase leading-none opacity-80">{d.dayShortName}</span>
                          <span className="text-xs leading-tight">{d.dayOfMonth}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{d.dayShortName}, {d.dayOfMonth} {d.monthName}</span>
                            {d.isToday && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold uppercase">
                                Сьогодні
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {d.isFuture
                              ? 'Майбутній день'
                              : `Виконано ${d.completed} з ${d.total} звичок`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {!d.isFuture && (
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {d.percent}%
                            </span>
                          </div>
                        )}
                        <div className="w-16 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full transition-all ${
                              d.percent === 100
                                ? 'bg-emerald-500'
                                : d.percent > 0
                                ? 'bg-blue-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${d.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. CONSISTENCY BREAKDOWN */}
          {activeType === 'consistency' && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Індекс постійності (30 днів)</span>
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.consistencyPercent}%{' '}
                    <span className="text-xs font-normal text-purple-600 dark:text-purple-400">
                      {metrics.consistencyPercent >= 80
                        ? '🌟 Відмінна стабільність'
                        : metrics.consistencyPercent >= 50
                        ? '⚡ Хороший темп'
                        : '🌱 Формування звичок'}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Ідеальних днів (100%): <span className="font-semibold text-purple-500">{perfectDaysCount} з 30</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* 4-Week Activity Buckets */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  📊 Прогрес по тижнях місяця
                </h5>
                <div className="space-y-2">
                  {weeksStats.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C1F2B] border border-slate-200 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {w.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {w.completed}/{w.total} завдань
                          </span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {w.percent}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                          style={{ width: `${w.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1C1F2B]/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-white font-semibold text-xs transition-all active:scale-95"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
