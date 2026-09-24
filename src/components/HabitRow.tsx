import React, { useState } from 'react';
import {
  Check,
  Flame,
  MoreVertical,
  Edit2,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Archive,
  ArchiveRestore,
  Trophy,
  Target,
} from 'lucide-react';
import { HabitWithLogs, DayColumn } from '../lib/types';
import { IconRenderer } from './IconRenderer';
import { pluralize } from '../lib/i18n';

interface HabitRowProps {
  habit: HabitWithLogs;
  days: DayColumn[];
  onToggleDay: (habitId: string, dateStr: string, targetValue: number) => void;
  onEditHabit: (habit: HabitWithLogs) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleArchive?: (habitId: string, isArchived: boolean) => void;
  isDragging?: boolean;
  isFloating?: boolean;
  translateY?: number;
  onGripPointerDown?: (e: React.PointerEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  days,
  onToggleDay,
  onEditHabit,
  onDeleteHabit,
  onToggleArchive,
  isDragging,
  isFloating,
  translateY = 0,
  onGripPointerDown,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuContainerRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showMenu]);

  // Generate background tint & border style dynamically based on habit.color_hex
  const hex = habit.color_hex || '#10B981';

  return (
    <div
      style={{
        transform: translateY !== 0 ? `translate3d(0, ${translateY}px, 0)` : undefined,
        zIndex: showMenu ? 100 : isFloating ? 50 : 1,
        transition: isFloating
          ? 'box-shadow 0.15s ease, border-color 0.15s ease'
          : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s ease, border-color 0.2s ease',
      }}
      className={`bg-white dark:bg-[#16181F] hover:bg-slate-50 dark:hover:bg-[#1A1D27] border rounded-2xl p-4 flex items-center justify-between gap-4 group shadow-sm dark:shadow-none select-none relative ${
        isFloating
          ? 'shadow-2xl ring-2 ring-emerald-500/40 border-emerald-500 bg-slate-50/95 dark:bg-[#1C1F2B]/95 scale-[1.01]'
          : isDragging
          ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-500/5'
          : 'border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
      }`}
    >
      {/* Left: Drag Grip & Habit Info & Icon */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
        {/* Drag Handle Grip */}
        <div
          onPointerDown={onGripPointerDown}
          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0 -ml-1.5 touch-none"
          title="Затисніть та перетягніть для сортування"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Habit Icon Circle */}
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${hex}1A`, // 10% opacity
            borderColor: `${hex}40`,
            borderWidth: '1px',
            color: hex,
          }}
        >
          <IconRenderer name={habit.icon_name} className="w-5 h-5" />
        </div>

        {/* Title, Description & Badges */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate tracking-tight">
              {habit.title}
            </h3>

            {habit.target_type === 'numeric' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 shrink-0">
                {habit.target_value} {habit.unit_label || 'од'}/день
              </span>
            )}

            {/* Goal Target Badge */}
            {habit.goal_type === 'days_count' && (habit.goal_target ?? 0) > 0 && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
                  habit.isGoalReached
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse-subtle'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
                title={`Ціль: ${habit.goal_target} днів. Завершено: ${habit.totalCompletedDays ?? 0} днів (${habit.goalProgressPercent ?? 0}%)`}
              >
                {habit.isGoalReached ? (
                  <>
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Мета досягнута! ({habit.totalCompletedDays ?? 0}/{habit.goal_target} дн)</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3 text-emerald-500" />
                    <span>Челендж: {habit.totalCompletedDays ?? 0}/{habit.goal_target} дн ({habit.goalProgressPercent ?? 0}%)</span>
                  </>
                )}
              </span>
            )}

            {habit.goal_type === 'target_total' && (habit.goal_target ?? 0) > 0 && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
                  habit.isGoalReached
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse-subtle'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                }`}
                title={`Сумарна ціль: ${habit.goal_target} ${habit.unit_label || 'од'}. Накопичено: ${habit.totalAccumulatedValue ?? 0} (${habit.goalProgressPercent ?? 0}%)`}
              >
                {habit.isGoalReached ? (
                  <>
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Мета досягнута! ({habit.totalAccumulatedValue ?? 0}/{habit.goal_target} {habit.unit_label || 'од'})</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3 text-purple-500" />
                    <span>Ціль: {habit.totalAccumulatedValue ?? 0}/{habit.goal_target} {habit.unit_label || 'од'} ({habit.goalProgressPercent ?? 0}%)</span>
                  </>
                )}
              </span>
            )}

            {habit.is_archived === 1 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-slate-300 dark:border-white/10 shrink-0 flex items-center gap-1">
                <Archive className="w-2.5 h-2.5" />
                <span>В архіві</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap overflow-hidden">
            <span className="truncate max-w-[180px] sm:max-w-[240px]">
              {habit.description || 'Щоденна звичка'}
            </span>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {habit.seasonRate}% у сезоні
            </span>
          </div>

          {/* Goal Mini Progress Bar */}
          {habit.goal_type !== 'ongoing' && (habit.goal_target ?? 0) > 0 && (
            <div className="w-full max-w-[200px] sm:max-w-[240px] h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  habit.isGoalReached
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                }`}
                style={{
                  width: `${Math.max(
                    (habit.totalCompletedDays ?? 0) > 0 ? 3 : 0,
                    Math.min(100, habit.goalProgressPercent || 0)
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Day Checkboxes & Streak & Menu */}
      <div className="flex items-center gap-4 shrink-0">
        {/* 7 Days of the Week (Strictly fixed grid columns) */}
        <div className="grid grid-cols-7 gap-2 w-[266px] sm:w-[280px]">
          {days.map((day) => {
            const isCompleted = habit.logs[day.dateStr]?.is_completed === 1;

            return (
              <div key={day.dateStr} className="flex justify-center">
                <button
                  onClick={() => onToggleDay(habit.id, day.dateStr, habit.target_value)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 relative ${
                    isCompleted
                      ? 'shadow-md shadow-emerald-950/20 text-white'
                      : day.isToday
                      ? 'border-2 border-emerald-500/50 bg-emerald-500/5 text-gray-700 dark:text-gray-400 hover:border-emerald-400'
                      : 'border border-slate-300/80 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 bg-slate-100/50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-500'
                  }`}
                  style={
                    isCompleted
                      ? {
                          backgroundColor: hex,
                          boxShadow: `0 2px 10px ${hex}40`,
                        }
                      : {}
                  }
                  title={`${day.dayShortName}, ${day.dayOfMonth} ${day.monthName}: ${
                    isCompleted ? 'Виконано' : 'Не виконано'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3] text-white" />
                  ) : (
                    <span className="text-[11px] font-semibold opacity-80">
                      {day.dayLetter}
                    </span>
                  )}

                  {/* Today dot indicator */}
                  {day.isToday && !isCompleted && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Streak Pill (Compact numeric only, strictly fixed width 56px) */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-[56px] shrink-0 select-none justify-center whitespace-nowrap"
          title={`Поточний стрик: ${pluralize(habit.currentStreak, 'день', 'дні', 'днів')} (Найкращий: ${habit.bestStreak})`}
        >
          <Flame
            className={`w-3.5 h-3.5 shrink-0 ${
              habit.currentStreak > 0
                ? 'text-amber-500 dark:text-amber-400 fill-amber-400 animate-pulse-subtle'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span
            className={`text-xs font-bold tracking-tight ${
              habit.currentStreak > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {habit.currentStreak}
          </span>
        </div>

        {/* Context Menu Button (Strictly fixed width 28px) */}
        <div ref={menuContainerRef} className="relative w-[28px] flex justify-center shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-1.5 rounded-lg transition-colors ${
              showMenu
                ? 'text-gray-900 dark:text-white bg-slate-200/80 dark:bg-white/15'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Опції звички"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className={`absolute right-0 w-44 bg-white/95 dark:bg-[#1C1F2B]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1 z-[120] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                isLast ? 'bottom-9 origin-bottom-right' : 'top-8 origin-top-right'
              }`}
            >
              {!isFirst && onMoveUp && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveUp();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Підняти вище</span>
                </button>
              )}

              {!isLast && onMoveDown && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveDown();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Опустити нижче</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  onEditHabit(habit);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Редагувати</span>
              </button>

              {onToggleArchive && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleArchive(habit.id, habit.is_archived === 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors text-left"
                >
                  {habit.is_archived === 1 ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Відновити з архіву</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Перенести в архів</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDeleteHabit(habit.id);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Видалити</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
