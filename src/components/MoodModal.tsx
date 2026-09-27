import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Sparkles, MessageSquare } from 'lucide-react';
import { DailyMood, MoodLevel } from '../lib/types';
import { formatDateUkrainian } from '../lib/i18n';

export interface MoodOption {
  level: MoodLevel;
  emoji: string;
  label: string;
  description: string;
  colorClass: string;
  activeBg: string;
  borderClass: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    level: 5,
    emoji: '🤩',
    label: 'Чудово',
    description: 'Енергія на максимумі, супер день',
    colorClass: 'text-amber-500',
    activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-amber-500/10',
    borderClass: 'border-amber-500/30',
  },
  {
    level: 4,
    emoji: '😊',
    label: 'Добре',
    description: 'Спокійний, хороший продуктивний день',
    colorClass: 'text-emerald-500',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 shadow-emerald-500/10',
    borderClass: 'border-emerald-500/30',
  },
  {
    level: 3,
    emoji: '😐',
    label: 'Нейтрально',
    description: 'Звичайний день, нормальний стан',
    colorClass: 'text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-blue-500/10',
    borderClass: 'border-blue-500/30',
  },
  {
    level: 2,
    emoji: '😔',
    label: 'Втома / Сумно',
    description: 'Мало енергії, відчуття виснаження',
    colorClass: 'text-orange-400',
    activeBg: 'bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-orange-500/10',
    borderClass: 'border-orange-500/30',
  },
  {
    level: 1,
    emoji: '😫',
    label: 'Важко / Стрес',
    description: 'Складний або напружений день',
    colorClass: 'text-rose-500',
    activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-rose-500/10',
    borderClass: 'border-rose-500/30',
  },
];

interface MoodModalProps {
  isOpen: boolean;
  dateStr: string | null;
  currentMood?: DailyMood | null;
  onClose: () => void;
  onSaveMood: (dateStr: string, level: MoodLevel, emoji: string, note?: string | null) => void;
  onDeleteMood: (dateStr: string) => void;
}

export const MoodModal: React.FC<MoodModalProps> = ({
  isOpen,
  dateStr,
  currentMood,
  onClose,
  onSaveMood,
  onDeleteMood,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<MoodLevel>(currentMood?.mood_level || 5);
  const [note, setNote] = useState<string>(currentMood?.note || '');

  useEffect(() => {
    if (currentMood) {
      setSelectedLevel(currentMood.mood_level);
      setNote(currentMood.note || '');
    } else {
      setSelectedLevel(5);
      setNote('');
    }
  }, [currentMood, dateStr, isOpen]);

  if (!isOpen || !dateStr) return null;

  const handleSelectOption = (opt: MoodOption) => {
    setSelectedLevel(opt.level);
  };

  const handleSave = () => {
    const selectedOpt = MOOD_OPTIONS.find((o) => o.level === selectedLevel) || MOOD_OPTIONS[0];
    onSaveMood(dateStr, selectedOpt.level, selectedOpt.emoji, note);
    onClose();
  };

  const handleDelete = () => {
    onDeleteMood(dateStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1C1F2B]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Настрій дня
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatDateUkrainian(dateStr)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Mood Options Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
              Як минув цей день?
            </label>

            <div className="grid grid-cols-1 gap-2">
              {MOOD_OPTIONS.map((opt) => {
                const isSelected = selectedLevel === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                      isSelected
                        ? `${opt.activeBg} shadow-md ring-1 ring-white/10`
                        : 'bg-slate-50/60 dark:bg-[#1C1F2B]/60 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl scale-100 hover:scale-110 transition-transform">
                        {opt.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${isSelected ? opt.colorClass : 'text-gray-900 dark:text-white'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-slate-300 dark:border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Short Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <span>Коротка замітка до дня (опціонально)</span>
            </label>
            <input
              type="text"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Наприклад: Чудове тренування та прогулянка увечері..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none text-xs text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1C1F2B]/50 flex items-center justify-between gap-2">
          <div>
            {currentMood && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Видалити настрій для цього дня"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистити</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
