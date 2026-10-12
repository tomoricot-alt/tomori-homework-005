import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { todayString } from './lib/date';
import { backupBroken, loadRaw, saveRaw } from './lib/storage';
import { createTask, parseStored, sampleTasks, StoredData, TaskInput } from './lib/tasks';
import { Task } from './lib/types';

interface Store {
  ready: boolean;
  tasks: Task[];
  /** 端末のローカル日付（日付が変わると自動で更新される） */
  today: string;
  loadWarning: string | null;
  saveError: boolean;
  add: (input: TaskInput) => void;
  update: (id: string, input: TaskInput) => void;
  remove: (id: string) => void;
  setDone: (id: string, done: boolean) => void;
  clearSamples: () => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider が必要です');
  return v;
}

/** ローカル日付を返す。0時をまたいだ・画面に戻ったときに更新する。 */
function useToday(): string {
  const [today, setToday] = useState(() => todayString());
  useEffect(() => {
    const check = () => setToday((prev) => {
      const now = todayString();
      return now === prev ? prev : now;
    });
    const timer = setInterval(check, 15_000);
    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') check();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', check);
    }
    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('focus', check);
      }
    };
  }, []);
  return today;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sampleSeeded, setSampleSeeded] = useState(false);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const today = useToday();
  const latest = useRef<StoredData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let raw: string | null = null;
      try {
        raw = await loadRaw();
      } catch {
        setLoadWarning('保存データを読み込めませんでした。ブラウザの設定を確認してね。');
      }
      const parsed = parseStored(raw);
      if (cancelled) return;
      if (parsed) {
        setTasks(parsed.tasks);
        setSampleSeeded(parsed.sampleSeeded);
      } else if (raw) {
        await backupBroken(raw);
        setLoadWarning('保存データが壊れていたため、空の状態で始めました。');
        setSampleSeeded(true);
      } else {
        // 初回起動：サンプルを表示（サンプル印つき）
        setTasks(sampleTasks(todayString()));
        setSampleSeeded(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 変更があるたびに自動保存
  useEffect(() => {
    if (!ready) return;
    const data: StoredData = { version: 1, tasks, sampleSeeded };
    latest.current = data;
    saveRaw(JSON.stringify(data)).then(
      () => setSaveError(false),
      () => setSaveError(true),
    );
  }, [tasks, sampleSeeded, ready]);

  const add = useCallback((input: TaskInput) => setTasks((p) => [...p, createTask(input)]), []);
  const update = useCallback(
    (id: string, input: TaskInput) =>
      setTasks((p) =>
        p.map((t) =>
          t.id === id
            ? { ...t, kind: input.kind, subject: input.subject.trim() || 'その他', title: input.title.trim(), dueDate: input.dueDate, memo: input.memo.trim() }
            : t,
        ),
      ),
    [],
  );
  const remove = useCallback((id: string) => setTasks((p) => p.filter((t) => t.id !== id)), []);
  const setDone = useCallback(
    (id: string, done: boolean) =>
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, done, doneAt: done ? Date.now() : null } : t))),
    [],
  );
  const clearSamples = useCallback(() => setTasks((p) => p.filter((t) => !t.sample)), []);

  const value = useMemo(
    () => ({ ready, tasks, today, loadWarning, saveError, add, update, remove, setDone, clearSamples }),
    [ready, tasks, today, loadWarning, saveError, add, update, remove, setDone, clearSamples],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
