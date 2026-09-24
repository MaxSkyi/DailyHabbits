import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown, Pipette, Palette, Target } from 'lucide-react';
import { Habit, TargetType, GoalType } from '../lib/types';
import { AVAILABLE_ICONS, PRESET_COLORS, IconRenderer } from './IconRenderer';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'created_at'> & { created_at?: string }) => void;
  editingHabit: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Flame');
  const [colorHex, setColorHex] = useState('#10B981');
  const [targetType, setTargetType] = useState<TargetType>('binary');
  const [targetValue, setTargetValue] = useState(1);
  const [unitLabel, setUnitLabel] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('ongoing');
  const [goalTarget, setGoalTarget] = useState<number | ''>(21);
  const [showAllIcons, setShowAllIcons] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setIconName(editingHabit.icon_name || 'Flame');
      setColorHex(editingHabit.color_hex || '#10B981');
      setTargetType(editingHabit.target_type || 'binary');
      setTargetValue(editingHabit.target_value || 1);
      setUnitLabel(editingHabit.unit_label || '');
      setGoalType(editingHabit.goal_type || 'ongoing');
      setGoalTarget(editingHabit.goal_target != null ? editingHabit.goal_target : 21);
    } else {
      setTitle('');
      setDescription('');
      setIconName('Sparkles');
      setColorHex('#10B981');
      setTargetType('binary');
      setTargetValue(1);
      setUnitLabel('');
      setGoalType('ongoing');
      setGoalTarget(21);
    }
    setShowAllIcons(false);
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = editingHabit ? editingHabit.id : `habit-${Date.now()}`;
    const position = editingHabit ? editingHabit.position : 999;
    const is_archived = editingHabit ? editingHabit.is_archived : 0;
    const created_at = editingHabit ? editingHabit.created_at : new Date().toISOString();

    onSave({
      id,
      title: title.trim(),
      description: description.trim() || null,
      icon_name: iconName,
      color_hex: colorHex,
      target_type: targetType,
      target_value: targetType === 'numeric' ? Number(targetValue) || 1 : 1,
      unit_label: targetType === 'numeric' ? unitLabel.trim() || null : null,
      goal_type: goalType,
      goal_target: goalType !== 'ongoing' ? Number(goalTarget) || 21 : null,
      position,
      is_archived,
      created_at,
    });

    onClose();
  };

  const visibleIcons = showAllIcons ? AVAILABLE_ICONS : AVAILABLE_ICONS.slice(0, 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#12141A]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colorHex}20`, color: colorHex }}
            >
              <IconRenderer name={iconName} className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              {editingHabit ? 'Редагувати звичку' : 'Нова щоденна звичка'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Назва звички *
            </label>
            <input
              type="text"
              required
              placeholder="наприклад: Пробіжка, Читання книги..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Опис або примітка
            </label>
            <input
              type="text"
              placeholder="наприклад: 20 сторінок щодня, вранці"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Color Picker with Preset Palette and Custom Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Акцентний колір
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{colorHex.toUpperCase()}</span>
                <label className="w-6 h-6 rounded-lg cursor-pointer flex items-center justify-center bg-gradient-to-tr from-pink-500 via-emerald-400 to-cyan-400 p-[1.5px] hover:scale-105 transition-transform" title="Обрати власний колір з палітри">
                  <div className="w-full h-full rounded-[6px] flex items-center justify-center" style={{ backgroundColor: colorHex }}>
                    <Pipette className="w-3 h-3 text-white drop-shadow" />
                  </div>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-[#0B0C10] p-2.5 rounded-xl border border-slate-300 dark:border-white/10">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setColorHex(c.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 relative ${
                    colorHex.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-emerald-500 dark:ring-white scale-110 shadow-lg'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {colorHex.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </button>
              ))}

              {/* Custom Color Palette trigger circle */}
              <label
                className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 relative border border-dashed border-slate-400 dark:border-white/30 hover:border-slate-600 dark:hover:border-white hover:scale-105 ${
                  !PRESET_COLORS.some((c) => c.hex.toLowerCase() === colorHex.toLowerCase())
                    ? 'ring-2 ring-emerald-500 dark:ring-white scale-110 shadow-lg'
                    : ''
                }`}
                style={{
                  backgroundColor: !PRESET_COLORS.some((c) => c.hex.toLowerCase() === colorHex.toLowerCase())
                    ? colorHex
                    : 'transparent',
                }}
                title="Обрати інший колір (Палітра спектру)"
              >
                {!PRESET_COLORS.some((c) => c.hex.toLowerCase() === colorHex.toLowerCase()) ? (
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                ) : (
                  <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
                )}
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="sr-only"
                />
              </label>

              {/* Direct Hex Input */}
              <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-white/10">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={colorHex.replace('#', '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setColorHex(`#${val}`);
                    }
                  }}
                  className="w-16 px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 uppercase"
                  placeholder="10B981"
                />
              </div>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Іконка
              </label>
              <button
                type="button"
                onClick={() => setShowAllIcons(!showAllIcons)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 font-medium"
              >
                <span>{showAllIcons ? 'Згорнути' : 'Усі іконки'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showAllIcons ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-[#0B0C10] p-2.5 rounded-xl border border-slate-300 dark:border-white/10">
              {visibleIcons.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIconName(ic)}
                  className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                    iconName === ic
                      ? 'bg-slate-200 dark:bg-white/15 text-gray-900 dark:text-white ring-1 ring-slate-400 dark:ring-white/30 scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                  }`}
                >
                  <IconRenderer name={ic} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Target Type: Binary vs Numeric */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Тип щоденного обліку
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('binary')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  targetType === 'binary'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Так / Ні (Виконано)
              </button>
              <button
                type="button"
                onClick={() => setTargetType('numeric')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  targetType === 'numeric'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Кількісна норма
              </button>
            </div>

            {targetType === 'numeric' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                    Норма на день
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                    Одиниця виміру
                  </label>
                  <input
                    type="text"
                    placeholder="склянок, сторінок, хв..."
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Goal & Target Duration */}
          <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-white/5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>Термін або фінальна мета</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('ongoing')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                  goalType === 'ongoing'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>♾️ Безстрокова</span>
                <span className="text-[10px] font-normal opacity-70">Щоденна рутина</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoalType('days_count');
                  if (!goalTarget || typeof goalTarget !== 'number') setGoalTarget(21);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                  goalType === 'days_count'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>🎯 Челендж на дні</span>
                <span className="text-[10px] font-normal opacity-70">21, 30, 66+ днів</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoalType('target_total');
                  if (!goalTarget || typeof goalTarget !== 'number') setGoalTarget(100);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                  goalType === 'target_total'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>📚 Сумарна ціль</span>
                <span className="text-[10px] font-normal opacity-70">Разом за весь час</span>
              </button>
            </div>

            {goalType === 'days_count' && (
              <div className="p-3 bg-slate-50 dark:bg-[#0B0C10] rounded-xl border border-slate-200 dark:border-white/10 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Кількість днів челенджу:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-[#16181F] border border-slate-300 dark:border-white/15 text-xs font-semibold text-gray-900 dark:text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">днів</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[21, 30, 42, 66, 73, 100].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setGoalTarget(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        goalTarget === preset
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-slate-300'
                      }`}
                    >
                      {preset} дн.
                    </button>
                  ))}
                </div>
              </div>
            )}

            {goalType === 'target_total' && (
              <div className="p-3 bg-slate-50 dark:bg-[#0B0C10] rounded-xl border border-slate-200 dark:border-white/10 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Загальна сумарна ціль:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="300"
                      className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-[#16181F] border border-slate-300 dark:border-white/15 text-xs font-semibold text-gray-900 dark:text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {unitLabel || 'од.'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Досягнення підраховується сумарно за всі дні (наприклад, 300 сторінок або 1000 віджимань).
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 shadow-emerald-500/20"
            >
              {editingHabit ? 'Зберегти зміни' : 'Створити звичку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
