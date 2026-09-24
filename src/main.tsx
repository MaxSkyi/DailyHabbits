import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Disable default browser context menu globally
window.addEventListener(
  'contextmenu',
  (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  },
  { capture: true }
);

// Disable default browser/webview shortcut keys (DevTools, Reload, Save, Print, etc.)
window.addEventListener(
  'keydown',
  (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const code = e.code || '';
    const key = (e.key || '').toLowerCase();

    // F-keys: F5 (reload), F12 (DevTools), F11 (fullscreen), F3, F7
    if (
      code === 'F5' ||
      code === 'F12' ||
      code === 'F11' ||
      code === 'F3' ||
      code === 'F7' ||
      key === 'f5' ||
      key === 'f12' ||
      key === 'f11' ||
      key === 'f3' ||
      key === 'f7'
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl/Cmd + Shift + I / J / C (DevTools / Console / Inspect on any keyboard layout)
    if (
      isCtrlOrCmd &&
      e.shiftKey &&
      (code === 'KeyI' || code === 'KeyJ' || code === 'KeyC' || key === 'i' || key === 'j' || key === 'c' || key === 'ш' || key === 'о' || key === 'с')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl/Cmd + R (Reload), Ctrl/Cmd + Shift + R (Hard reload)
    if (isCtrlOrCmd && (code === 'KeyR' || key === 'r' || key === 'к')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl/Cmd + U (View Source), Ctrl/Cmd + P (Print), Ctrl/Cmd + S (Save Page), Ctrl/Cmd + O (Open), Ctrl/Cmd + H (History), Ctrl/Cmd + J (Downloads)
    if (
      isCtrlOrCmd &&
      (code === 'KeyU' ||
        code === 'KeyP' ||
        code === 'KeyS' ||
        code === 'KeyO' ||
        code === 'KeyH' ||
        code === 'KeyJ' ||
        code === 'KeyE' ||
        code === 'KeyG' ||
        code === 'KeyK' ||
        key === 'u' ||
        key === 'p' ||
        key === 's' ||
        key === 'o' ||
        key === 'h' ||
        key === 'j' ||
        key === 'e' ||
        key === 'g' ||
        key === 'k' ||
        key === 'г' ||
        key === 'з' ||
        key === 'і' ||
        key === 'ы' ||
        key === 'щ' ||
        key === 'р' ||
        key === 'п' ||
        key === 'л')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  },
  { capture: true }
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

