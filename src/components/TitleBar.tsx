import React from 'react';
import { Minus, X, Plus, Settings, Moon, Sun, Laptop, Download } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { formatDateUkrainian } from '../lib/i18n';
import { ThemeMode } from '../lib/types';
import { Update } from '@tauri-apps/plugin-updater';

interface TitleBarProps {
  currentDateStr: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  availableUpdate?: Update | null;
  onOpenUpdateModal?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentDateStr,
  theme,
  onToggleTheme,
  onOpenAddModal,
  onOpenSettingsModal,
  availableUpdate,
  onOpenUpdateModal,
}) => {
  const handleMinimize = async () => {
    try {
      await invoke('minimize_window');
    } catch {
      console.log('Minimize window (browser mode)');
    }
  };

  const handleClose = async () => {
    try {
      await invoke('close_to_tray');
    } catch {
      console.log('Close to tray (browser mode)');
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-14 bg-[#0E1017]/90 dark:bg-[#0E1017]/90 bg-white/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 flex items-center justify-between select-none fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
    >
      {/* Left: App Logo & Brand */}
      <div data-tauri-drag-region className="flex items-center gap-3">
        <img
          src="/app-icon.svg"
          alt="Трекер Звичок Logo"
          className="w-8 h-8 rounded-xl shadow-glow pointer-events-none object-contain"
        />
        <div className="flex flex-col" data-tauri-drag-region>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white">
              Трекер Звичок
            </span>
            {/* <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Настільний
            </span> */}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            {formatDateUkrainian(currentDateStr)}
          </span>
        </div>
      </div>

      {/* Middle Drag Area */}
      <div data-tauri-drag-region className="flex-1 h-full mx-4" />

      {/* Right: Actions & Window Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Add Habit Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 shadow-emerald-500/20"
          title="Створити нову звичку"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Нова звичка</span>
        </button>

        {/* Theme Switcher Button (Single icon cycling Dark -> Light -> System) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90 border border-transparent hover:border-black/10 dark:hover:border-white/10"
          title={`Тема: ${
            theme === 'dark' ? 'Темна' : theme === 'light' ? 'Світла' : 'Системна'
          } (натисніть для перемикання)`}
        >
          {theme === 'dark' && (
            <Moon className="w-4 h-4 text-indigo-400 animate-in fade-in zoom-in-75 duration-200" />
          )}
          {theme === 'light' && (
            <Sun className="w-4 h-4 text-amber-500 animate-in fade-in zoom-in-75 duration-200" />
          )}
          {theme === 'system' && (
            <Laptop className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </button>

        {/* Available Update Notification Button */}
        {availableUpdate && (
          <button
            onClick={onOpenUpdateModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-semibold text-xs transition-all active:scale-95 shadow-sm shadow-emerald-500/10 group"
            title={`Доступне оновлення v${availableUpdate.version}! Натисніть для перегляду та встановлення`}
          >
            <div className="relative flex items-center justify-center">
              <Download className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-y-0.5 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="hidden sm:inline font-medium">Оновлення v{availableUpdate.version}</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 border border-transparent hover:border-black/10 dark:hover:border-white/10"
          title="Налаштування"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Згорнути"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-white hover:bg-rose-500/80 transition-colors"
            title="Сховати у трей"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
