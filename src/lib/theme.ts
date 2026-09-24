import { ThemeMode } from './types';

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  root.setAttribute('data-theme', mode);
}

export function getNextTheme(current: ThemeMode): ThemeMode {
  switch (current) {
    case 'system':
      return 'dark';
    case 'dark':
      return 'light';
    case 'light':
    default:
      return 'system';
  }
}
