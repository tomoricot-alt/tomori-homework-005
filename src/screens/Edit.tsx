import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { DateField } from '../components/DateField';
import { Button, Chip } from '../components/ui';
import { addDays } from '../lib/date';
import { TaskInput, validateInput } from '../lib/tasks';
import { Kind, KIND_EMOJI, KIND_LABEL, KINDS, SUBJECTS } from '../lib/types';
import { useStore } from '../store';
import { colors, radius } from '../theme';

export function Edit({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { tasks, today, add, update, remove } = useStore();
  const existing = id ? tasks.find((t) => t.id === id) : undefined;
  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'homework');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? addDays(today, 1));
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const input: TaskInput = { kind, subject, title, dueDate, memo };
  const save = () => {
    const err = validateInput(input);
    if (err) {
      setError(err);
      return;
    }
    if (existing) update(existing.id, input);
    else add(input);
    onClose();
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={s.h1}>{existing ? '予定を編集' : '予定を登録'}</Text>

      <Text style={s.label}>種類</Text>
      <View style={s.row}>
        {KINDS.map((k) => (
          <Chip key={k} label={`${KIND_EMOJI[k]} ${KIND_LABEL[k]}`} active={kind === k} onPress={() => setKind(k)} testID={`edit-kind-${k}`} />
        ))}
      </View>

      <Text style={s.label}>科目（えらばなくてもOK）</Text>
      <View style={s.row}>
        {SUBJECTS.map((x) => (
          <Chip key={x} label={x} active={subject === x} onPress={() => setSubject(subject === x ? '' : x)} testID={`subject-${x}`} />
        ))}
      </View>
      <TextInput
        testID="subject-input"
        value={subject}
        onChangeText={setSubject}
        placeholder="ほかの科目は自分で入力"
        placeholderTextColor="#A5ACA6"
        style={s.input}
        maxLength={20}
      />

      <Text style={s.label}>内容 *</Text>
      <TextInput
        testID="title-input"
        value={title}
        onChangeText={(v) => {
          setTitle(v);
          setError(null);
        }}
        placeholder="例）ワーク p.24〜26"
        placeholderTextColor="#A5ACA6"
        style={s.input}
        maxLength={60}
      />

      <Text style={s.label}>締切日 *</Text>
      <DateField value={dueDate} today={today} onChange={(v) => { setDueDate(v); setError(null); }} />

      <Text style={s.label}>メモ（なくてもOK）</Text>
      <TextInput
        testID="memo-input"
        value={memo}
        onChangeText={setMemo}
        placeholder="例）提出先は職員室"
        placeholderTextColor="#A5ACA6"
        style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]}
        multiline
        maxLength={200}
      />

      {error && <Text testID="form-error" style={s.error}>{error}</Text>}

      <View style={{ gap: 10, marginTop: 14 }}>
        <Button label={existing ? '保存する' : '登録する'} onPress={save} testID="save" />
        <Button label="キャンセル" kind="ghost" onPress={onClose} testID="cancel" />
        {existing &&
          (confirmDelete ? (
            <View style={s.confirm}>
              <Text style={s.confirmText}>本当に削除する？（もどせません）</Text>
              <Button label="削除する" kind="danger" onPress={() => { remove(existing.id); onClose(); }} testID="delete-confirm" />
              <Button label="やめる" kind="ghost" onPress={() => setConfirmDelete(false)} testID="delete-cancel" />
            </View>
          ) : (
            <Button label="この予定を削除" kind="danger" onPress={() => setConfirmDelete(true)} testID="delete" />
          ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  label: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 12, marginBottom: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17, color: colors.ink, marginTop: 6 },
  error: { color: colors.danger, fontWeight: '800', fontSize: 15, marginTop: 8 },
  confirm: { gap: 8, padding: 12, borderRadius: radius.card, backgroundColor: colors.dangerSoft },
  confirmText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
});
