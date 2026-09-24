import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { HabitWithLogs } from './types';
import { pluralize } from './i18n';

let lastSentReminderDate: string | null = null;

/**
 * Request notification permission if not yet granted
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    return granted;
  } catch (err) {
    console.warn('Failed to check/request notification permission', err);
    return false;
  }
}

/**
 * Send an immediate test notification to verify Windows Action Center toast delivery
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return false;

    sendNotification({
      title: 'Трекер Звичок 🔔',
      body: 'Тестове сповіщення успішно працює! Нагадування активні.',
    });
    return true;
  } catch (err) {
    console.error('Failed to send test notification', err);
    return false;
  }
}

/**
 * Periodically checked by background interval to trigger daily habit reminder
 */
export async function checkAndSendDailyReminder(
  habits: HabitWithLogs[],
  logicalTodayStr: string,
  reminderTime: string,
  notificationsEnabled: boolean
): Promise<void> {
  if (!notificationsEnabled) return;
  if (!reminderTime) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // If time matches reminderTime and hasn't been sent today yet
  if (currentTimeStr === reminderTime && lastSentReminderDate !== logicalTodayStr) {
    const activeHabits = habits.filter((h) => h.is_archived === 0);
    const uncompletedHabits = activeHabits.filter((h) => {
      const log = h.logs[logicalTodayStr];
      return !log || log.is_completed === 0;
    });

      if (uncompletedHabits.length > 0) {
        const count = uncompletedHabits.length;
        const granted = await ensureNotificationPermission();
        if (granted) {
          const habitText = pluralize(
            count,
            'невиконана звичка',
            'невиконані звички',
            'невиконаних звичок'
          );
          const verb = count % 10 === 1 && count % 100 !== 11 ? 'залишилась' : 'залишилось';

          sendNotification({
            title: 'Трекер Звичок 🔔',
            body: `У вас ${verb} ${habitText} на сьогодні! Час відмітити свій прогрес.`,
          });
          lastSentReminderDate = logicalTodayStr;
        }
      }
  }
}
