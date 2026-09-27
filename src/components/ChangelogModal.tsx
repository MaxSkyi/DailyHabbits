import React, { useState } from 'react';
import {
  Sparkles,
  History,
  X,
  CheckCircle2,
  Zap,
  Wrench,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { CHANGELOG, ReleaseNote, getReleaseByVersion, getLatestRelease } from '../lib/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
  initialMode?: 'whats-new' | 'full-history';
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  version,
  initialMode = 'whats-new',
}) => {
  const [mode, setMode] = useState<'whats-new' | 'full-history'>(initialMode);

  // Sync mode when modal opens or initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentRelease: ReleaseNote =
    (version ? getReleaseByVersion(version) : undefined) || getLatestRelease();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181F] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#12141A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              {mode === 'whats-new' ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <History className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  {mode === 'whats-new'
                    ? `Що нового у версії ${currentRelease.version} 🎉`
                    : 'Журнал змін (Changelog)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v{currentRelease.version}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'whats-new'
                  ? currentRelease.date
                  : 'Історія всіх оновлень та вдосконалень додатку'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {mode === 'whats-new' ? (
            /* Single Version Showcase */
            <div className="space-y-5">
              {/* Tagline Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {currentRelease.title}
                </h3>
                {currentRelease.tagline && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400/90 mt-1 leading-relaxed">
                    {currentRelease.tagline}
                  </p>
                )}
              </div>

              {/* Release Sections */}
              <div className="space-y-4">
                {/* Features */}
                {currentRelease.features && currentRelease.features.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Нові можливості</span>
                    </div>
                    <ul className="space-y-2">
                      {currentRelease.features.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {currentRelease.improvements && currentRelease.improvements.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Покращення та оптимізації</span>
                    </div>
                    <ul className="space-y-2">
                      {currentRelease.improvements.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5"
                        >
                          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fixes */}
                {currentRelease.fixes && currentRelease.fixes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Виправлення помилок</span>
                    </div>
                    <ul className="space-y-2">
                      {currentRelease.fixes.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5"
                        >
                          <Wrench className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Full Changelog Timeline */
            <div className="space-y-6">
              {CHANGELOG.map((rel, index) => (
                <div
                  key={rel.version}
                  className="relative pl-6 border-l-2 border-emerald-500/30 dark:border-emerald-500/20 space-y-3 pb-2"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-100 dark:bg-[#16181F] border-2 border-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>

                  {/* Version Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        v{rel.version} — {rel.title}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Остання
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {rel.date}
                    </span>
                  </div>

                  {rel.tagline && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      {rel.tagline}
                    </p>
                  )}

                  {/* Bullet Points */}
                  <div className="space-y-2 pt-1">
                    {rel.features &&
                      rel.features.map((f, i) => (
                        <div
                          key={`f-${i}`}
                          className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-emerald-500 font-bold">✦</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    {rel.improvements &&
                      rel.improvements.map((imp, i) => (
                        <div
                          key={`imp-${i}`}
                          className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-amber-500 font-bold">⚡</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    {rel.fixes &&
                      rel.fixes.map((fix, i) => (
                        <div
                          key={`fix-${i}`}
                          className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-sky-500 font-bold">🛠</span>
                          <span>{fix}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#12141A] shrink-0">
          <div>
            {mode === 'whats-new' ? (
              <button
                type="button"
                onClick={() => setMode('full-history')}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
              >
                <span>Вся історія версій</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('whats-new')}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Останнє оновлення</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 shadow-emerald-500/20"
          >
            <span>{mode === 'whats-new' ? 'Чудово, продовжити' : 'Закрити'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
