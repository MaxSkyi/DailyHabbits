import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Calendar, Archive } from 'lucide-react';
import { HabitWithLogs, DayColumn } from '../lib/types';
import { HabitRow } from './HabitRow';

interface HabitListProps {
  habits: HabitWithLogs[];
  days: DayColumn[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onTodayWeek: () => void;
  isCurrentWeek: boolean;
  onToggleDay: (habitId: string, dateStr: string, targetValue: number) => void;
  onEditHabit: (habit: HabitWithLogs) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleArchive: (habitId: string, isArchived: boolean) => void;
  onOpenAddModal: () => void;
  onReorderHabits: (newOrderedHabits: HabitWithLogs[]) => void;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  days,
  onPrevWeek,
  onNextWeek,
  onTodayWeek,
  isCurrentWeek,
  onToggleDay,
  onEditHabit,
  onDeleteHabit,
  onToggleArchive,
  onOpenAddModal,
  onReorderHabits,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'archived'>('active');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const activeHabits = habits.filter((h) => h.is_archived === 0);
  const archivedHabits = habits.filter((h) => h.is_archived === 1);
  const displayedHabits = filterTab === 'active' ? activeHabits : archivedHabits;

  const habitsRef = React.useRef(displayedHabits);
  habitsRef.current = displayedHabits;

  const startDay = days[0];
  const endDay = days[6];

  const weekTitle =
    startDay && endDay
      ? `${startDay.dayOfMonth} ${startDay.monthName} — ${endDay.dayOfMonth} ${endDay.monthName}`
      : 'Поточний тиждень';

  // Ultra-smooth 60fps Pointer Dragging (only on active habits)
  const handleStartPointerDrag = (startIndex: number, e: React.PointerEvent) => {
    if (filterTab !== 'active') return;
    e.preventDefault();
    setDraggingIndex(startIndex);
    setTargetIndex(startIndex);
    setDragOffsetY(0);

    const startY = e.clientY;
    const ROW_HEIGHT = 80; // card height + spacing gap

    let currentTarget = startIndex;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setDragOffsetY(deltaY);

      const step = Math.round(deltaY / ROW_HEIGHT);
      const newTarget = Math.max(0, Math.min(habitsRef.current.length - 1, startIndex + step));
      currentTarget = newTarget;
      setTargetIndex(newTarget);
    };

    const onPointerUp = () => {
      if (currentTarget !== startIndex && currentTarget >= 0 && currentTarget < habitsRef.current.length) {
        const updated = [...habitsRef.current];
        const [moved] = updated.splice(startIndex, 1);
        updated.splice(currentTarget, 0, moved);
        onReorderHabits(updated);
      }

      setDraggingIndex(null);
      setDragOffsetY(0);
      setTargetIndex(null);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...displayedHabits];
    const [moved] = updated.splice(index, 1);
    updated.splice(index - 1, 0, moved);
    onReorderHabits(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= displayedHabits.length - 1) return;
    const updated = [...displayedHabits];
    const [moved] = updated.splice(index, 1);
    updated.splice(index + 1, 0, moved);
    onReorderHabits(updated);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Top Header & Week Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-[#16181F]/80 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                {filterTab === 'active' ? 'Щоденні звички' : 'Архів / Завершені цілі'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-slate-200 dark:border-white/10">
                {displayedHabits.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{weekTitle}</p>
          </div>
        </div>

        {/* View Controls & Filter Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active vs Archived Filter Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-[#0B0C10] rounded-xl border border-slate-200 dark:border-white/10 p-0.5">
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'active'
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Активні ({activeHabits.length})
            </button>

            <button
              onClick={() => setFilterTab('archived')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterTab === 'archived'
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Архів ({archivedHabits.length})</span>
            </button>
          </div>

          {/* Week controls */}
          {!isCurrentWeek && (
            <button
              onClick={onTodayWeek}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all active:scale-95"
            >
              Сьогодні
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-[#0B0C10] rounded-xl border border-slate-200 dark:border-white/10 p-0.5">
            <button
              onClick={onPrevWeek}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors active:scale-95"
              title="Попередній тиждень"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-300 dark:bg-white/10 mx-0.5" />
            <button
              onClick={onNextWeek}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors active:scale-95"
              title="Наступний тиждень"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Header Columns */}
      <div className="hidden md:flex items-center justify-between px-4 py-1 text-xs font-semibold text-gray-400">
        <span className="flex-1 min-w-0 pr-2 pl-7">Назва звички</span>
        <div className="flex items-center gap-4 shrink-0">
          <div className="grid grid-cols-7 gap-2 w-[266px] sm:w-[280px]">
            {days.map((d) => (
              <div
                key={d.dateStr}
                className={`text-center flex flex-col items-center justify-center ${
                  d.isToday ? 'text-emerald-400 font-bold' : 'text-gray-400'
                }`}
              >
                <span className="text-[11px]">{d.dayShortName}</span>
                <span className="text-[10px] opacity-70">{d.dayOfMonth}</span>
              </div>
            ))}
          </div>
          <span className="text-[11px] w-[56px] text-center shrink-0">Стрик</span>
          <div className="w-[28px] shrink-0" />
        </div>
      </div>

      {/* Habit Rows */}
      <div className="space-y-2.5 relative z-20">
        {displayedHabits.length === 0 ? (
          <div className="bg-white dark:bg-[#16181F] border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center shadow-sm dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              {filterTab === 'active' ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <Archive className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {filterTab === 'active' ? 'Немає активних звичок' : 'Архів порожній'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4">
              {filterTab === 'active'
                ? 'Створіть свою першу щоденну звичку, щоб розпочати трекінг та відслідковувати прогрес на тепловій карті!'
                : 'Тут зберігатимуться завершені челенджі та виконані звички, перенесені в архів.'}
            </p>
            {filterTab === 'active' && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Додати звичку</span>
              </button>
            )}
          </div>
        ) : (
          displayedHabits.map((habit, index) => {
            const isFloating = draggingIndex === index;
            let translateY = 0;

            if (isFloating) {
              translateY = dragOffsetY;
            } else if (draggingIndex !== null && targetIndex !== null) {
              const ROW_HEIGHT = 80;
              if (draggingIndex < targetIndex && index > draggingIndex && index <= targetIndex) {
                translateY = -ROW_HEIGHT;
              } else if (draggingIndex > targetIndex && index < draggingIndex && index >= targetIndex) {
                translateY = ROW_HEIGHT;
              }
            }

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                days={days}
                onToggleDay={onToggleDay}
                onEditHabit={onEditHabit}
                onDeleteHabit={onDeleteHabit}
                onToggleArchive={onToggleArchive}
                isFloating={isFloating}
                translateY={translateY}
                onGripPointerDown={(e) => handleStartPointerDrag(index, e)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === displayedHabits.length - 1}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
