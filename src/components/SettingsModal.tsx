import React, { useState, useEffect } from 'react';
import { X, Clock, Bell, Power, Download, Upload, Check, Trash2, AlertTriangle, BellRing, RefreshCw } from 'lucide-react';
import { AppSettings } from '../lib/types';
import { exportBackup, importBackup, clearAllDatabaseData } from '../lib/db';
import { sendTestNotification, ensureNotificationPermission } from '../lib/notifications';
import { checkForAppUpdate } from '../lib/updater';
import { Update } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';
import { enable, disable } from '@tauri-apps/plugin-autostart';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onReloadData: () => void;
  onFoundUpdate?: (update: Update) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onReloadData,
  onFoundUpdate,
}) => {
  const [rolloverHour, setRolloverHour] = useState(settings.dayRolloverHour);
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '20:00');
  const [autostart, setAutostart] = useState(settings.autostartEnabled);
  const [fieldStatus, setFieldStatus] = useState<Record<string, string>>({});
  const [floatingToast, setFloatingToast] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const confirmClearTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (confirmClearTimerRef.current) {
        clearTimeout(confirmClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRolloverHour(settings.dayRolloverHour);
    setNotifications(settings.notificationsEnabled);
    setReminderTime(settings.reminderTime || '20:00');
    setAutostart(settings.autostartEnabled);
  }, [settings]);

  if (!isOpen) return null;

  const showFieldStatus = (field: string, text: string) => {
    setFieldStatus((prev) => ({ ...prev, [field]: text }));
    setTimeout(() => {
      setFieldStatus((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, 2200);
  };

  const showFloatingToast = (msg: string) => {
    setFloatingToast(msg);
    setTimeout(() => setFloatingToast(null), 2500);
  };

  const handleSelectRolloverHour = async (hour: number) => {
    setRolloverHour(hour);
    const updated: AppSettings = {
      ...settings,
      dayRolloverHour: hour,
      notificationsEnabled: notifications,
      reminderTime,
      autostartEnabled: autostart,
    };

    try {
      await invoke('set_rollover_hour', { hour });
    } catch {}

    onSaveSettings(updated);
    showFieldStatus('rollover', `Збережено: ${String(hour).padStart(2, '0')}:00`);
  };

  const handleToggleAutostart = async () => {
    try {
      const next = !autostart;
      if (next) {
        await enable();
      } else {
        await disable();
      }
      setAutostart(next);
      const updated: AppSettings = {
        ...settings,
        dayRolloverHour: Number(rolloverHour),
        notificationsEnabled: notifications,
        reminderTime,
        autostartEnabled: next,
      };
      onSaveSettings(updated);
      showFieldStatus('autostart', next ? 'Активовано' : 'Вимкнено');
    } catch {
      const next = !autostart;
      setAutostart(next);
      const updated: AppSettings = {
        ...settings,
        dayRolloverHour: Number(rolloverHour),
        notificationsEnabled: notifications,
        reminderTime,
        autostartEnabled: next,
      };
      onSaveSettings(updated);
      showFieldStatus('autostart', 'Оновлено');
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const granted = await ensureNotificationPermission();
      const next = granted ? !notifications : false;
      setNotifications(next);
      const updated: AppSettings = {
        ...settings,
        dayRolloverHour: Number(rolloverHour),
        notificationsEnabled: next,
        reminderTime,
        autostartEnabled: autostart,
      };
      onSaveSettings(updated);
      showFieldStatus('notifications', next ? 'Увімкнено' : 'Вимкнено');
    } catch {
      const next = !notifications;
      setNotifications(next);
      const updated: AppSettings = {
        ...settings,
        dayRolloverHour: Number(rolloverHour),
        notificationsEnabled: next,
        reminderTime,
        autostartEnabled: autostart,
      };
      onSaveSettings(updated);
      showFieldStatus('notifications', 'Збережено');
    }
  };

  const handleChangeReminderTime = (newTime: string) => {
    setReminderTime(newTime);
    const updated: AppSettings = {
      ...settings,
      dayRolloverHour: Number(rolloverHour),
      notificationsEnabled: notifications,
      reminderTime: newTime || '20:00',
      autostartEnabled: autostart,
    };
    onSaveSettings(updated);
    showFieldStatus('reminderTime', 'Збережено');
  };

  const handleTestNotification = async () => {
    const ok = await sendTestNotification();
    if (ok) {
      showFloatingToast('Тестове сповіщення надіслано!');
    } else {
      showFloatingToast('Не вдалося надіслати сповіщення (перевірте дозволи Windows)');
    }
  };

  const handleClearAllClick = async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      if (confirmClearTimerRef.current) clearTimeout(confirmClearTimerRef.current);
      confirmClearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 4000);
      return;
    }

    // Confirmed second click
    if (confirmClearTimerRef.current) {
      clearTimeout(confirmClearTimerRef.current);
    }
    setIsConfirmingClear(false);

    try {
      await clearAllDatabaseData();
      showFloatingToast('Всі дані звичок успішно очищено!');
      onReloadData();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      showFloatingToast('Помилка при очищенні бази');
    }
  };

  const handleExport = async () => {
    try {
      const jsonStr = await exportBackup();
      const defaultFilename = `habits-backup-${new Date().toISOString().slice(0, 10)}.json`;

      try {
        const saved = await invoke<boolean>('export_backup_file', {
          content: jsonStr,
          defaultFilename,
        });

        if (saved) {
          showFloatingToast('Резервну копію успішно збережено!');
        }
        return;
      } catch (tauriErr) {
        console.log('Using browser download fallback', tauriErr);
      }

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      a.click();
      URL.revokeObjectURL(url);
      showFloatingToast('Резервну копію успішно експортовано');
    } catch {
      showFloatingToast('Помилка експорту даних');
    }
  };

  const handleNativeImport = async () => {
    try {
      try {
        const content = await invoke<string | null>('import_backup_file');
        if (content) {
          const ok = await importBackup(content);
          if (ok) {
            showFloatingToast('Дані успішно імпортовано!');
            onReloadData();
          } else {
            showFloatingToast('Помилка: некоректний формат файлу');
          }
        }
        return;
      } catch (tauriErr) {
        console.log('Using browser input fallback', tauriErr);
      }

      // If outside Tauri, trigger hidden file input
      document.getElementById('import-file-input')?.click();
    } catch {
      showFloatingToast('Помилка імпорту даних');
    }
  };

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const update = await checkForAppUpdate();
      if (update) {
        if (onFoundUpdate) {
          onFoundUpdate(update);
        } else {
          showFloatingToast(`Знайдено нову версію: ${update.version}!`);
        }
      } else {
        showFloatingToast('У вас найновіша версія додатку!');
      }
    } catch {
      showFloatingToast('Не вдалося перевірити наявність оновлень');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleBrowserImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = await importBackup(content);
        if (ok) {
          showFloatingToast('Дані успішно імпортовано!');
          onReloadData();
        } else {
          showFloatingToast('Помилка: некоректний формат файлу');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 transition-colors relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#12141A]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Налаштування
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Автозбереження
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Day Rollover */}
          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[24px]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Зсув доби (Day Rollover)
                </label>
              </div>
              {fieldStatus.rollover && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 animate-in fade-in bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 leading-none">
                  <Check className="w-3 h-3" />
                  <span>{fieldStatus.rollover}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Дії до встановленої години зараховуються до попереднього дня:
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0, 3, 4, 5].map((hour) => (
                <button
                  type="button"
                  key={hour}
                  onClick={() => handleSelectRolloverHour(hour)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                    rolloverHour === hour
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-slate-50 dark:bg-[#0B0C10] border-slate-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {String(hour).padStart(2, '0')}:00
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-white/5" />

          {/* System Integration Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Power className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 min-h-[22px]">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block leading-tight">
                      Автозапуск при старті
                    </span>
                    {fieldStatus.autostart && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 animate-in fade-in bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 leading-none">
                        <Check className="w-2.5 h-2.5" />
                        <span>{fieldStatus.autostart}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                    Запуск у фоновому режимі в треї
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAutostart}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  autostart ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    autostart ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 min-h-[22px]">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block leading-tight">
                        Системні сповіщення
                      </span>
                      {fieldStatus.notifications && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 animate-in fade-in bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 leading-none">
                          <Check className="w-2.5 h-2.5" />
                          <span>{fieldStatus.notifications}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Нагадування про незавершені звички
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    notifications ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                      notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {notifications && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-white/5 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-3 min-h-[30px]">
                    <div className="flex items-center gap-2 min-h-[22px]">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Час щоденного нагадування:
                      </label>
                      {fieldStatus.reminderTime && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 animate-in fade-in bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 leading-none">
                          <Check className="w-2.5 h-2.5" />
                          <span>{fieldStatus.reminderTime}</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => handleChangeReminderTime(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#16181F] border border-slate-300 dark:border-white/15 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Додаток надішле системне сповіщення у цей час, якщо на сьогодні залишатимуться невиконані звички.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Перевірка сповіщень:
                    </span>
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all active:scale-95"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Надіслати тестове</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-white/5" />

          {/* Backup & Restore */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider block">
              Керування даними
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Експорт бекапу</span>
              </button>

              <button
                type="button"
                onClick={handleNativeImport}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Імпорт JSON</span>
                <input
                  id="import-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleBrowserImport}
                  className="hidden"
                />
              </button>
            </div>
          </div>

          {/* App Updates Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider block">
                Оновлення програми
              </label>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                v1.0.0
              </span>
            </div>

            <button
              type="button"
              disabled={isCheckingUpdate}
              onClick={handleManualCheckUpdate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-300 dark:border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? 'Перевіряємо наявність оновлень...' : 'Перевірити наявність оновлень'}</span>
            </button>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-white/5" />

          {/* Danger Zone: Clear All Database Data */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">
              Небезпечна зона
            </label>

            <button
              type="button"
              onClick={handleClearAllClick}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                isConfirmingClear
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 shadow-rose-600/30 animate-pulse'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 hover:text-rose-400'
              }`}
            >
              {isConfirmingClear ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span>Натисніть ще раз для підтвердження!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Очистити всю базу даних</span>
                </>
              )}
            </button>
          </div>

          {/* Close footer */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-white font-semibold text-xs transition-all active:scale-95"
            >
              Закрити
            </button>
          </div>
        </div>

        {/* Floating Non-disruptive Toast Overlay (Zero Layout Shift) */}
        {floatingToast && (
          <div className="absolute bottom-16 left-6 right-6 z-30 pointer-events-none flex justify-center animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900/95 dark:bg-[#1C1F2B]/95 text-emerald-400 border border-emerald-500/30 shadow-2xl px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{floatingToast}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


