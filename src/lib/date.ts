/**
 * 日付ユーティリティ。
 * 日付は常に「端末のローカル日付」を YYYY-MM-DD の文字列で扱う。
 * 日数の差は UTC の暦日番号で計算するので、夏時間などの影響を受けない。
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(now: Date = new Date()): string {
  return toDateString(now);
}

/** YYYY-MM-DD を厳密に解析する。不正な値（2月30日など）は null。 */
export function parseDateString(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function isValidDateString(s: string): boolean {
  return parseDateString(s) !== null;
}

function dayNumber(s: string): number {
  const p = parseDateString(s);
  if (!p) return NaN;
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
}

/** to - from の日数（to が未来なら正） */
export function diffDays(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function addDays(s: string, n: number): string {
  const p = parseDateString(s);
  if (!p) return s;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 0=日 … 6=土 */
export function weekdayIndex(s: string): number {
  const p = parseDateString(s);
  if (!p) return 0;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function weekdayLabel(s: string): string {
  return WEEKDAYS[weekdayIndex(s)];
}

/** 「10月15日(水)」 */
export function formatDate(s: string): string {
  const p = parseDateString(s);
  if (!p) return s;
  return `${p.m}月${p.d}日(${weekdayLabel(s)})`;
}

/** 「2026年10月15日(水)」 */
export function formatDateFull(s: string): string {
  const p = parseDateString(s);
  if (!p) return s;
  return `${p.y}年${formatDate(s)}`;
}

/** 今週の最終日（日曜日）。月曜はじまり。今日が日曜なら今日。 */
export function endOfWeek(today: string): string {
  const wd = weekdayIndex(today);
  return addDays(today, wd === 0 ? 0 : 7 - wd);
}

export type DueBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later';

export function bucketOf(dueDate: string, today: string): DueBucket {
  const diff = diffDays(today, dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (dueDate <= endOfWeek(today)) return 'week';
  return 'later';
}

/** 「3日超過」「今日まで」「あと5日」など */
export function dueLabel(dueDate: string, today: string): string {
  const diff = diffDays(today, dueDate);
  if (diff < 0) return `${-diff}日超過`;
  if (diff === 0) return '今日まで';
  if (diff === 1) return '明日まで';
  if (diff === 2) return 'あさってまで';
  return `あと${diff}日`;
}

/** 次のローカル0時までのミリ秒（日付切り替わり検知用） */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime() + 500);
}
