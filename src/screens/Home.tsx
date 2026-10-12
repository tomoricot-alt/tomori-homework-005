import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { Button, Empty, SectionTitle } from '../components/ui';
import { formatDateFull } from '../lib/date';
import { groupByBucket } from '../lib/tasks';
import { Task } from '../lib/types';
import { useStore } from '../store';
import { colors, radius } from '../theme';

export function Home({ onEdit, onGoList }: { onEdit: (id: string) => void; onGoList: () => void }) {
  const { tasks, today, setDone, clearSamples } = useStore();
  const g = groupByBucket(tasks, today);
  const hasSample = tasks.some((t) => t.sample);
  const activeCount = tasks.filter((t) => !t.done).length;
  const render = (list: Task[]) =>
    list.map((t) => <TaskCard key={t.id} task={t} today={today} onToggle={() => setDone(t.id, true)} onEdit={() => onEdit(t.id)} />);

  return (
    <View>
      <Text style={s.date} testID="today-label">{formatDateFull(today)}</Text>
      <Text style={s.hello}>今日もがんばろう！</Text>

      <View style={s.summary}>
        <Stat label="期限超過" n={g.overdue.length} color={colors.danger} testID="stat-overdue" />
        <Stat label="今日" n={g.today.length} color="#B9770E" testID="stat-today" />
        <Stat label="明日" n={g.tomorrow.length} color="#B9770E" testID="stat-tomorrow" />
        <Stat label="今週" n={g.week.length} color={colors.greenDark} testID="stat-week" />
      </View>

      {hasSample && (
        <View style={s.sampleBox} testID="sample-banner">
          <Text style={s.sampleText}>
            「サンプル」と書かれた予定は、使い方を見るための見本だよ。自分の予定を登録したら消してね。
          </Text>
          <Button label="サンプルを消す" kind="ghost" onPress={clearSamples} testID="clear-samples" />
        </View>
      )}

      {g.overdue.length > 0 && (
        <>
          <SectionTitle title="⚠ 期限が過ぎているよ" count={g.overdue.length} tone="danger" />
          {render(g.overdue)}
        </>
      )}

      <SectionTitle title="今日" count={g.today.length} tone="warn" />
      {g.today.length ? render(g.today) : <Empty text="今日までのものはありません 🎉" />}

      <SectionTitle title="明日" count={g.tomorrow.length} tone="warn" />
      {g.tomorrow.length ? render(g.tomorrow) : <Empty text="明日までのものはありません" />}

      <SectionTitle title="今週（日曜まで）" count={g.week.length} tone="green" />
      {g.week.length ? render(g.week) : <Empty text="今週の残りの予定はありません" />}

      {g.later.length > 0 && (
        <View style={{ marginTop: 18 }}>
          <Button label={`それ以降の予定 ${g.later.length}件を見る`} kind="ghost" onPress={onGoList} testID="go-later" />
        </View>
      )}
      {activeCount === 0 && <Empty text="未完了の予定はありません。「＋」から登録できるよ" />}
    </View>
  );
}

function Stat({ label, n, color, testID }: { label: string; n: number; color: string; testID: string }) {
  return (
    <View style={s.stat}>
      <Text testID={testID} style={[s.statNum, { color: n > 0 ? color : colors.inkSub }]}>{n}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  date: { fontSize: 15, color: colors.inkSub, fontWeight: '700' },
  hello: { fontSize: 26, fontWeight: '900', color: colors.ink, marginTop: 2, marginBottom: 14 },
  summary: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 10, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: colors.inkSub, fontWeight: '700' },
  sampleBox: { marginTop: 16, padding: 14, borderRadius: radius.card, backgroundColor: '#FFF6D8', gap: 10 },
  sampleText: { fontSize: 14, color: '#6B5200', lineHeight: 20 },
});
