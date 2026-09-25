import React from 'react';
import { Flame, CheckCircle, TrendingUp, Calendar, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { MetricStats } from '../lib/types';
import { pluralize } from '../lib/i18n';
import { triggerCelebrationConfetti } from '../lib/confetti';
import { MetricDetailType } from './MetricDetailModal';

interface MetricCardsProps {
  metrics: MetricStats;
  onOpenDetail?: (type: MetricDetailType) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, onOpenDetail }) => {
  const isAllTodayDone = metrics.todayCompleted === metrics.todayTotal && metrics.todayTotal > 0;

  const handleCardClick = (type: MetricDetailType) => {
    if (type === 'today' && isAllTodayDone) {
      triggerCelebrationConfetti();
    }
    if (onOpenDetail) {
      onOpenDetail(type);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-3.5 mb-6">
      {/* 1. Сьогодні */}
      <div
        onClick={() => handleCardClick('today')}
        className="bg-white dark:bg-[#16181F] hover:bg-slate-50 dark:hover:bg-[#1A1D27] transition-all duration-300 border border-slate-200/80 dark:border-white/5 hover:border-emerald-500/40 hover:shadow-md dark:hover:shadow-card-hover rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm dark:shadow-card cursor-pointer active:scale-[0.98]"
        title="Натисніть для детальної статистики на сьогодні"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/15 transition-colors" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
            <span>Сьогодні</span>
            {isAllTodayDone && <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />}
          </span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ${
            isAllTodayDone
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.todayCompleted}/{metrics.todayTotal}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              {metrics.todayPercent}%
            </span>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center justify-between">
            <span>
              {isAllTodayDone
                ? '🎉 Всі звички закрито!'
                : `${pluralize(metrics.todayCompleted, 'звичку', 'звички', 'звичок')} виконано`}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Mini progress bar */}
        <div className="mt-2.5 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${metrics.todayPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Найкраща серія */}
      <div
        onClick={() => handleCardClick('streak')}
        className="bg-white dark:bg-[#16181F] hover:bg-slate-50 dark:hover:bg-[#1A1D27] transition-all duration-300 border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 hover:shadow-md dark:hover:shadow-card-hover rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm dark:shadow-card cursor-pointer active:scale-[0.98]"
        title="Натисніть для перегляду серій по звичках"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/15 transition-colors" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate group-hover:text-amber-500 transition-colors">
            Найкраща серія
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 transition-transform group-hover:scale-110">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400/20" />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
              {pluralize(metrics.bestStreak, 'день', 'дні', 'днів')}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between truncate">
            <span className="flex items-center gap-1 truncate">
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 inline shrink-0" />
              <span className="truncate">Максимальний темп</span>
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </p>
        </div>

        <div className="mt-2.5 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (metrics.bestStreak / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Цього тижня */}
      <div
        onClick={() => handleCardClick('week')}
        className="bg-white dark:bg-[#16181F] hover:bg-slate-50 dark:hover:bg-[#1A1D27] transition-all duration-300 border border-slate-200/80 dark:border-white/5 hover:border-blue-500/40 hover:shadow-md dark:hover:shadow-card-hover rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm dark:shadow-card cursor-pointer active:scale-[0.98]"
        title="Натисніть для перегляду аналітики по днях тижня"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/15 transition-colors" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate group-hover:text-blue-500 transition-colors">
            Цього тижня
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0 transition-transform group-hover:scale-110">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.thisWeekPercent}%
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              ({metrics.thisWeekCompleted}/{metrics.thisWeekTotal})
            </span>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center justify-between">
            <span>
              {metrics.activeHabitsCount > 0 && metrics.thisWeekTotal > 0
                ? `Пройдено ${Math.min(7, Math.round(metrics.thisWeekTotal / Math.max(1, metrics.activeHabitsCount)))} з 7 днів`
                : 'Поточний тиждень'}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </p>
        </div>

        <div className="mt-2.5 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${metrics.thisWeekPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Постійність */}
      <div
        onClick={() => handleCardClick('consistency')}
        className="bg-white dark:bg-[#16181F] hover:bg-slate-50 dark:hover:bg-[#1A1D27] transition-all duration-300 border border-slate-200/80 dark:border-white/5 hover:border-purple-500/40 hover:shadow-md dark:hover:shadow-card-hover rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm dark:shadow-card cursor-pointer active:scale-[0.98]"
        title="Натисніть для перегляду аналітики регулярності за 30 днів"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/15 transition-colors" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate group-hover:text-purple-500 transition-colors">
            Постійність
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0 transition-transform group-hover:scale-110">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.consistencyPercent}%
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
              30 днів
            </span>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center justify-between">
            <span>Стабільність за місяць</span>
            <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </p>
        </div>

        <div className="mt-2.5 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${metrics.consistencyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

