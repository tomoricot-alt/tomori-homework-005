import { bucketOf, DueBucket, addDays, isValidDateString } from './date';
import { KINDS, Task } from './types';

/** 未完了を締切の早い順に。同じ日はテスト→提出物→宿題、最後に登録順。 */
const KIND_ORDER = { test: 0, submission: 1, homework: 2 } as const;

export function compareByDue(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  return a.createdAt - b.createdAt;
}

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done).sort(compareByDue);
}

/** 完了履歴：新しく完了したものが上 */
export function historyTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
}

export interface HomeSections {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  week: Task[];
  later: Task[];
}

export function groupByBucket(tasks: Task[], today: string): HomeSections {
  const out: HomeSections = { overdue: [], today: [], tomorrow: [], week: [], later: [] };
  for (const t of activeTasks(tasks)) {
    out[bucketOf(t.dueDate, today) as DueBucket].push(t);
  }
  return out;
}

export interface SubjectGroup {
  subject: string;
  tasks: Task[];
}

/** 科目別。科目は最も近い締切の順に並べ、各科目の中も締切順。 */
export function groupBySubject(tasks: Task[]): SubjectGroup[] {
  const map = new Map<string, Task[]>();
  for (const t of activeTasks(tasks)) {
    const key = t.subject || 'その他';
    const list = map.get(key);
    if (list) list.push(t);
    else map.set(key, [t]);
  }
  return Array.from(map, ([subject, list]) => ({ subject, tasks: list }));
}

export interface TaskInput {
  kind: Task['kind'];
  subject: string;
  title: string;
  dueDate: string;
  memo: string;
}

/** 入力チェック。問題がなければ null、あれば表示用メッセージ。 */
export function validateInput(input: TaskInput): string | null {
  if (!input.title.trim()) return '内容を入力してね';
  if (!isValidDateString(input.dueDate)) return '締切日を選んでね';
  return null;
}

export function createTask(input: TaskInput, now: number = Date.now(), sample = false): Task {
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    subject: input.subject.trim() || 'その他',
    title: input.title.trim(),
    dueDate: input.dueDate,
    memo: input.memo.trim(),
    done: false,
    doneAt: null,
    createdAt: now,
    sample,
  };
}

export function sampleTasks(today: string, now: number = Date.now()): Task[] {
  const mk = (
    n: number,
    kind: Task['kind'],
    subject: string,
    title: string,
    offset: number,
    memo = '',
  ) => ({ ...createTask({ kind, subject, title, dueDate: addDays(today, offset), memo }, now + n, true), id: `sample-${n}` });
  return [
    mk(1, 'homework', '数学', 'ワーク p.24〜26', 0, 'サンプルです。右上の「サンプルを消す」で消せます'),
    mk(2, 'submission', '国語', '読書感想文', 1),
    mk(3, 'test', '英語', '単語テスト（Unit 3）', 3),
    mk(4, 'homework', '理科', '実験レポート', -1),
    mk(5, 'test', '社会', '中間テスト（歴史）', 10),
  ];
}

// ---- 保存データの読み込み・検証 ----

export interface StoredData {
  version: 1;
  tasks: Task[];
  /** サンプルを一度表示したか */
  sampleSeeded: boolean;
}

function isTask(x: unknown): x is Task {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    KINDS.includes(t.kind as Task['kind']) &&
    typeof t.subject === 'string' &&
    typeof t.title === 'string' &&
    typeof t.dueDate === 'string' &&
    isValidDateString(t.dueDate) &&
    typeof t.done === 'boolean'
  );
}

/** 保存文字列を安全に読み込む。壊れたデータは null。壊れた行だけ捨てる。 */
export function parseStored(raw: string | null): StoredData | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.tasks)) return null;
    const tasks: Task[] = obj.tasks.filter(isTask).map((t: Task) => ({
      id: t.id,
      kind: t.kind,
      subject: t.subject,
      title: t.title,
      dueDate: t.dueDate,
      memo: typeof t.memo === 'string' ? t.memo : '',
      done: t.done,
      doneAt: typeof t.doneAt === 'number' ? t.doneAt : t.done ? 0 : null,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : 0,
      sample: t.sample === true,
    }));
    return { version: 1, tasks, sampleSeeded: obj.sampleSeeded === true };
  } catch {
    return null;
  }
}
