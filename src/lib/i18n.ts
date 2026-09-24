/**
 * Українська плюралізація слів
 * @param n число
 * @param one форма для 1 (наприклад: 'день', 'звичка')
 * @param few форма для 2-4 (наприклад: 'дні', 'звички')
 * @param many форма для 5-0 (наприклад: 'днів', 'звичок')
 */
export function pluralize(n: number, one: string, few: string, many: string): string {
  const absN = Math.abs(Math.floor(n));
  const mod10 = absN % 10;
  const mod100 = absN % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${n} ${many}`;
  }
  if (mod10 === 1) {
    return `${n} ${one}`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${n} ${few}`;
  }
  return `${n} ${many}`;
}

export function pluralizeWords(n: number, one: string, few: string, many: string): string {
  const absN = Math.abs(Math.floor(n));
  const mod10 = absN % 10;
  const mod100 = absN % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

export const DAYS_FULL = [
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
  'Неділя',
];

export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export const DAYS_ONE_LETTER = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'];

export const MONTHS_FULL = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

export const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

export const MONTHS_SHORT = [
  'січ',
  'лют',
  'бер',
  'кві',
  'тра',
  'чер',
  'лип',
  'сер',
  'вер',
  'жов',
  'лис',
  'гру',
];

export function formatDateUkrainian(date: Date | string, includeYear = true): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const day = d.getDate();
  const month = MONTHS_GENITIVE[d.getMonth()];
  const year = d.getFullYear();
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}
