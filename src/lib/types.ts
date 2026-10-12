export type Kind = 'homework' | 'submission' | 'test';

export const KIND_LABEL: Record<Kind, string> = {
  homework: '宿題',
  submission: '提出物',
  test: 'テスト',
};

export const KIND_EMOJI: Record<Kind, string> = {
  homework: '📘',
  submission: '📮',
  test: '📝',
};

export const KINDS: Kind[] = ['homework', 'submission', 'test'];

export interface Task {
  id: string;
  kind: Kind;
  subject: string;
  title: string;
  /** ローカル日付 YYYY-MM-DD */
  dueDate: string;
  memo: string;
  done: boolean;
  /** 完了した時刻（ミリ秒） */
  doneAt: number | null;
  createdAt: number;
  /** 初回起動時のサンプルデータかどうか */
  sample: boolean;
}

export const SUBJECTS = [
  '国語',
  '数学',
  '英語',
  '理科',
  '社会',
  '音楽',
  '美術',
  '技術・家庭',
  '保健体育',
  'その他',
];
