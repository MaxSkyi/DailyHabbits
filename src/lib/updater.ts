import { check, Update } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';

export interface UpdateProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'error';
  error?: string;
}

/**
 * Check if a new version is available on GitHub Releases
 */
export async function checkForAppUpdate(): Promise<Update | null> {
  try {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      console.log('Updater only works inside the desktop app environment');
      return null;
    }

    const update = await check();
    return update;
  } catch (err) {
    console.warn('Failed to check for updates:', err);
    return null;
  }
}

/**
 * Download and install the update with live progress
 */
export async function downloadAndInstallUpdate(
  update: Update,
  onProgress: (progress: UpdateProgress) => void
): Promise<void> {
  try {
    let total = 0;
    let downloaded = 0;

    onProgress({
      totalBytes: 0,
      downloadedBytes: 0,
      percent: 0,
      status: 'downloading',
    });

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started': {
          total = event.data.contentLength || 0;
          onProgress({
            totalBytes: total,
            downloadedBytes: 0,
            percent: 0,
            status: 'downloading',
          });
          break;
        }
        case 'Progress': {
          downloaded += event.data.chunkLength || 0;
          const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
          onProgress({
            totalBytes: total,
            downloadedBytes: downloaded,
            percent,
            status: 'downloading',
          });
          break;
        }
        case 'Finished': {
          onProgress({
            totalBytes: total,
            downloadedBytes: downloaded,
            percent: 100,
            status: 'installing',
          });
          break;
        }
      }
    });

    onProgress({
      totalBytes: total,
      downloadedBytes: downloaded,
      percent: 100,
      status: 'completed',
    });

    // Short delay for UI smooth finish, then restart app
    setTimeout(async () => {
      try {
        await invoke('restart_app');
      } catch (err) {
        console.error('Failed to restart app automatically:', err);
      }
    }, 1000);
  } catch (err: any) {
    console.error('Failed to download & install update:', err);
    onProgress({
      totalBytes: 0,
      downloadedBytes: 0,
      percent: 0,
      status: 'error',
      error: err?.message || 'Помилка завантаження оновлення',
    });
  }
}
