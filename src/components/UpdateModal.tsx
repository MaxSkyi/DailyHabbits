import React, { useState } from 'react';
import { Sparkles, Download, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Update } from '@tauri-apps/plugin-updater';
import { downloadAndInstallUpdate, UpdateProgress } from '../lib/updater';

interface UpdateModalProps {
  update: Update | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ update, isOpen, onClose }) => {
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  if (!isOpen || !update) return null;

  const isInstalling = progress?.status === 'downloading' || progress?.status === 'installing';
  const isCompleted = progress?.status === 'completed';
  const isError = progress?.status === 'error';

  const handleStartUpdate = async () => {
    await downloadAndInstallUpdate(update, (p) => {
      setProgress(p);
    });
  };

  const formatMb = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#12141A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Доступне оновлення!
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Версія {update.version}
              </span>
            </div>
          </div>
          {!isInstalling && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Вийшла нова версія додатку <strong>Трекер Звичок ({update.version})</strong>. Вона містить покращення та виправлення.
          </p>

          {/* Release Notes */}
          {update.body && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300 space-y-1.5 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Що нового:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{update.body}</p>
            </div>
          )}

          {/* Live Progress State */}
          {progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {progress.status === 'downloading' && 'Завантаження оновлення...'}
                  {progress.status === 'installing' && 'Встановлення...'}
                  {progress.status === 'completed' && 'Оновлення завершено! Перезапуск...'}
                  {progress.status === 'error' && 'Помилка оновлення'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {progress.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isError
                      ? 'bg-rose-500'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {progress.totalBytes > 0 && progress.status === 'downloading' && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block text-right">
                  {formatMb(progress.downloadedBytes)} MB / {formatMb(progress.totalBytes)} MB
                </span>
              )}

              {isError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{progress.error || 'Не вдалося завантажити файл оновлення'}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
            {!isInstalling && !isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Пізніше
              </button>
            )}

            {!isInstalling && !isCompleted && (
              <button
                type="button"
                onClick={handleStartUpdate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Оновити зараз</span>
              </button>
            )}

            {isInstalling && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Завантажуємо...</span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Перезапуск додатку...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
