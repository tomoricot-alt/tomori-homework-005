import { describe, expect, it } from 'vitest';
import {
  addDays,
  bucketOf,
  diffDays,
  dueLabel,
  endOfWeek,
  formatDate,
  isValidDateString,
  msUntilNextMidnight,
  todayString,
  toDateString,
} from './date';
import {
  activeTasks,
  createTask,
  groupBySubject,
  groupByBucket,
  historyTasks,
  parseStored,
  sampleTasks,
  validateInput,
} from './tasks';
import { Task } from './types';

const mk = (over: Partial<Task>): Task => ({
  ...createTask({ kind: 'homework', subject: '数学', title: 'x', dueDate: '2026-10-12', memo: '' }, 1000),
  ...over,
});

describe('日付', () => {
  it('ローカル日付で今日を返す（UTCではない）', () => {
    // ローカル 2026-10-12 00:30 はUTCでは前日のことがあるが、ローカルの日付になる
    expect(todayString(new Date(2026, 9, 12, 0, 30))).toBe('2026-10-12');
    expect(todayString(new Date(2026, 9, 12, 23, 59))).toBe('2026-10-12');
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('厳密に検証する', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2028-02-29')).toBe(true);
    expect(isValidDateString('2027-02-29')).toBe(false);
    expect(isValidDateString('2026-1-5')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
  it('日数差・加算が月またぎ・年またぎで正しい', () => {
    expect(diffDays('2026-12-31', '2027-01-01')).toBe(1);
    expect(diffDays('2026-03-01', '2026-02-28')).toBe(-1);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });
  it('表示形式', () => {
    expect(formatDate('2026-10-12')).toBe('10月12日(月)');
  });
  it('今週の終わりは日曜（月曜はじまり）', () => {
    expect(endOfWeek('2026-10-12')).toBe('2026-10-18'); // 月
    expect(endOfWeek('2026-10-17')).toBe('2026-10-18'); // 土
    expect(endOfWeek('2026-10-18')).toBe('2026-10-18'); // 日
  });
  it('期限の区分', () => {
    const today = '2026-10-12'; // 月
    expect(bucketOf('2026-10-11', today)).toBe('overdue');
    expect(bucketOf('2026-01-01', today)).toBe('overdue');
    expect(bucketOf('2026-10-12', today)).toBe('today');
    expect(bucketOf('2026-10-13', today)).toBe('tomorrow');
    expect(bucketOf('2026-10-18', today)).toBe('week');
    expect(bucketOf('2026-10-19', today)).toBe('later');
  });
  it('日付が変わると判定が変わる', () => {
    expect(bucketOf('2026-10-12', '2026-10-12')).toBe('today');
    expect(bucketOf('2026-10-12', '2026-10-13')).toBe('overdue');
    expect(dueLabel('2026-10-12', '2026-10-15')).toBe('3日超過');
  });
  it('ラベル', () => {
    expect(dueLabel('2026-10-12', '2026-10-12')).toBe('今日まで');
    expect(dueLabel('2026-10-13', '2026-10-12')).toBe('明日まで');
    expect(dueLabel('2026-10-14', '2026-10-12')).toBe('あさってまで');
    expect(dueLabel('2026-10-20', '2026-10-12')).toBe('あと8日');
  });
  it('次の0時まで', () => {
    expect(msUntilNextMidnight(new Date(2026, 9, 12, 23, 59, 0))).toBeLessThan(61_000);
    expect(msUntilNextMidnight(new Date(2026, 9, 12, 0, 0, 1))).toBeGreaterThan(86_000_000);
  });
});

describe('並び替えとグループ', () => {
  const tasks = [
    mk({ id: 'a', dueDate: '2026-10-20', createdAt: 1 }),
    mk({ id: 'b', dueDate: '2026-10-10', createdAt: 2 }),
    mk({ id: 'c', dueDate: '2026-10-15', createdAt: 3, done: true, doneAt: 50 }),
    mk({ id: 'd', dueDate: '2026-10-12', createdAt: 4 }),
    mk({ id: 'e', dueDate: '2026-10-12', kind: 'test', createdAt: 5 }),
    mk({ id: 'f', dueDate: '2026-10-13', createdAt: 6, done: true, doneAt: 90 }),
  ];
  it('未完了は締切順、同日はテスト優先', () => {
    expect(activeTasks(tasks).map((t) => t.id)).toEqual(['b', 'e', 'd', 'a']);
  });
  it('履歴は完了が新しい順', () => {
    expect(historyTasks(tasks).map((t) => t.id)).toEqual(['f', 'c']);
  });
  it('区分ごとに分ける', () => {
    const g = groupByBucket(tasks, '2026-10-12');
    expect(g.overdue.map((t) => t.id)).toEqual(['b']);
    expect(g.today.map((t) => t.id)).toEqual(['e', 'd']);
    expect(g.later.map((t) => t.id)).toEqual(['a']);
  });
  it('科目別でも各科目は締切順', () => {
    const s = groupBySubject([
      mk({ id: '1', subject: '英語', dueDate: '2026-10-20' }),
      mk({ id: '2', subject: '数学', dueDate: '2026-10-13' }),
      mk({ id: '3', subject: '英語', dueDate: '2026-10-14' }),
    ]);
    expect(s.map((g) => g.subject)).toEqual(['数学', '英語']);
    expect(s[1].tasks.map((t) => t.id)).toEqual(['3', '1']);
  });
});

describe('登録・検証・保存データ', () => {
  it('内容が空だと登録できない', () => {
    expect(validateInput({ kind: 'homework', subject: '', title: '  ', dueDate: '2026-10-12', memo: '' })).not.toBeNull();
    expect(validateInput({ kind: 'homework', subject: '', title: 'ワーク', dueDate: '2026-02-30', memo: '' })).not.toBeNull();
    expect(validateInput({ kind: 'homework', subject: '', title: 'ワーク', dueDate: '2026-10-12', memo: '' })).toBeNull();
  });
  it('科目が空なら「その他」', () => {
    expect(createTask({ kind: 'test', subject: ' ', title: ' t ', dueDate: '2026-10-12', memo: '' }).subject).toBe('その他');
  });
  it('サンプルはサンプル印付き・過去と未来を含む', () => {
    const s = sampleTasks('2026-10-12');
    expect(s.every((t) => t.sample)).toBe(true);
    expect(s.some((t) => t.dueDate < '2026-10-12')).toBe(true);
  });
  it('保存→読み込みで同じ内容、壊れた行は捨てる', () => {
    const t = mk({ id: 'z' });
    const raw = JSON.stringify({ version: 1, sampleSeeded: true, tasks: [t, { id: 1 }, { ...t, id: 'bad', dueDate: '2026-13-40' }] });
    const parsed = parseStored(raw)!;
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0]).toEqual(t);
    expect(parsed.sampleSeeded).toBe(true);
  });
  it('壊れたJSONは null', () => {
    expect(parseStored('{oops')).toBeNull();
    expect(parseStored(null)).toBeNull();
    expect(parseStored('{"tasks":3}')).toBeNull();
  });
});
