import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { bucketOf, dueLabel, formatDate } from '../lib/date';
import { KIND_EMOJI, KIND_LABEL, Task } from '../lib/types';
import { colors, radius } from '../theme';

export function CheckBox({ done, onPress, label, testID }: { done: boolean; onPress: () => void; label: string; testID?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: false }),
    ]).start();
    onPress();
  };
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      onPress={press}
      hitSlop={8}
      style={s.checkHit}
    >
      <Animated.View style={[s.check, done && s.checkOn, { transform: [{ scale }] }]}>
        <Text style={s.checkMark}>{done ? '✓' : ''}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TaskCard({
  task,
  today,
  onToggle,
  onEdit,
  showDate = true,
}: {
  task: Task;
  today: string;
  onToggle: () => void;
  onEdit: () => void;
  showDate?: boolean;
}) {
  const bucket = bucketOf(task.dueDate, today);
  const overdue = bucket === 'overdue';
  const urgent = bucket === 'today' || bucket === 'tomorrow';
  return (
    <View
      testID={`task-${task.title}`}
      style={[s.card, overdue && s.cardOverdue, urgent && s.cardUrgent]}
    >
      <CheckBox done={false} onPress={onToggle} label={`${task.title} を完了にする`} testID={`check-${task.title}`} />
      <Pressable style={s.body} onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${task.title} を編集`} testID={`edit-${task.title}`}>
        <View style={s.metaRow}>
          <Text style={s.kind}>
            {KIND_EMOJI[task.kind]} {KIND_LABEL[task.kind]}
          </Text>
          <Text style={s.subject}>{task.subject}</Text>
          {task.sample && <Text style={s.sample}>サンプル</Text>}
        </View>
        <Text style={s.title}>{task.title}</Text>
        <View style={s.metaRow}>
          <Text
            testID={`due-${task.title}`}
            style={[s.due, overdue && s.dueOverdue, urgent && s.dueUrgent]}
          >
            {overdue ? '⚠ ' : urgent ? '🔥 ' : ''}
            {dueLabel(task.dueDate, today)}
          </Text>
          {showDate && <Text style={s.date}>{formatDate(task.dueDate)}</Text>}
        </View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    gap: 8,
  },
  cardOverdue: { borderColor: colors.danger, backgroundColor: '#FFF6F6', borderLeftWidth: 6 },
  cardUrgent: { borderColor: colors.warn, backgroundColor: '#FFFBEF', borderLeftWidth: 6 },
  body: { flex: 1, gap: 4, minHeight: 56, justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kind: { fontSize: 12, fontWeight: '700', color: colors.greenDark, backgroundColor: colors.greenSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  subject: { fontSize: 13, fontWeight: '700', color: colors.inkSub },
  sample: { fontSize: 11, fontWeight: '800', color: '#7A5C00', backgroundColor: '#FFE9A8', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink },
  due: { fontSize: 14, fontWeight: '800', color: colors.greenDark },
  dueOverdue: { color: '#fff', backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  dueUrgent: { color: '#7A4B00', backgroundColor: '#FFE2A0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  date: { fontSize: 13, color: colors.inkSub },
  checkHit: { padding: 2 },
  check: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkOn: { backgroundColor: colors.green },
  checkMark: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 26 },
});
