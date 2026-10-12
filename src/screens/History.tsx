import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckBox } from '../components/TaskCard';
import { Empty } from '../components/ui';
import { formatDate, toDateString } from '../lib/date';
import { historyTasks } from '../lib/tasks';
import { KIND_EMOJI, KIND_LABEL } from '../lib/types';
import { useStore } from '../store';
import { colors, radius } from '../theme';

export function History({ onEdit }: { onEdit: (id: string) => void }) {
  const { tasks, setDone } = useStore();
  const list = historyTasks(tasks);
  return (
    <View>
      <Text style={s.h1}>完了履歴</Text>
      <Text style={s.sub} testID="history-count">
        {list.length > 0 ? `これまでに ${list.length}件 終わらせたよ！ 👏` : 'まだ完了したものはありません'}
      </Text>
      {list.length === 0 && <Empty text="予定をチェックするとここに残るよ" />}
      {list.map((t) => (
        <View key={t.id} style={s.card} testID={`done-${t.title}`}>
          <CheckBox done onPress={() => setDone(t.id, false)} label={`${t.title} を未完了にもどす`} testID={`undo-${t.title}`} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.meta}>
              {KIND_EMOJI[t.kind]} {KIND_LABEL[t.kind]}・{t.subject}
              {t.sample ? '・サンプル' : ''}
            </Text>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.meta}>
              締切 {formatDate(t.dueDate)}
              {t.doneAt ? `　完了 ${formatDate(toDateString(new Date(t.doneAt)))}` : ''}
            </Text>
          </View>
        </View>
      ))}
      <Text style={s.note}>チェックを押すと、未完了にもどせるよ。</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '900', color: colors.ink },
  sub: { fontSize: 15, color: colors.greenDark, fontWeight: '700', marginVertical: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.line, padding: 12, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.inkSub, textDecorationLine: 'line-through' },
  meta: { fontSize: 12, color: colors.inkSub },
  note: { marginTop: 8, fontSize: 13, color: colors.inkSub },
});
