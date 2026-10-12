import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { Chip, Empty, SectionTitle } from '../components/ui';
import { activeTasks, groupBySubject } from '../lib/tasks';
import { Kind, KIND_LABEL, KINDS } from '../lib/types';
import { useStore } from '../store';
import { colors } from '../theme';

export function List({ onEdit }: { onEdit: (id: string) => void }) {
  const { tasks, today, setDone } = useStore();
  const [mode, setMode] = useState<'due' | 'subject'>('due');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const filtered = tasks.filter((t) => kind === 'all' || t.kind === kind);
  const render = (list: typeof tasks) =>
    list.map((t) => <TaskCard key={t.id} task={t} today={today} onToggle={() => setDone(t.id, true)} onEdit={() => onEdit(t.id)} />);

  return (
    <View>
      <Text style={s.h1}>予定一覧</Text>
      <View style={s.row}>
        <Chip label="締切順" active={mode === 'due'} onPress={() => setMode('due')} testID="mode-due" />
        <Chip label="科目別" active={mode === 'subject'} onPress={() => setMode('subject')} testID="mode-subject" />
      </View>
      <View style={[s.row, { marginTop: 8 }]}>
        <Chip label="すべて" active={kind === 'all'} onPress={() => setKind('all')} testID="kind-all" />
        {KINDS.map((k) => (
          <Chip key={k} label={KIND_LABEL[k]} active={kind === k} onPress={() => setKind(k)} testID={`kind-${k}`} />
        ))}
      </View>

      <View style={{ marginTop: 8 }}>
        {activeTasks(filtered).length === 0 && <Empty text="未完了の予定はありません 🎉" />}
        {mode === 'due'
          ? render(activeTasks(filtered))
          : groupBySubject(filtered).map((g) => (
              <View key={g.subject}>
                <SectionTitle title={g.subject} count={g.tasks.length} tone="green" />
                {render(g.tasks)}
              </View>
            ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '900', color: colors.ink, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
