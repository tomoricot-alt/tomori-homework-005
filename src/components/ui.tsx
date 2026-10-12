import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  testID?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        kind === 'primary' && s.btnPrimary,
        kind === 'ghost' && s.btnGhost,
        kind === 'danger' && s.btnDanger,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[s.btnText, kind === 'ghost' && { color: colors.ink }, kind === 'danger' && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ title, count, tone }: { title: string; count?: number; tone?: 'danger' | 'warn' | 'green' }) {
  const color = tone === 'danger' ? colors.danger : tone === 'warn' ? '#B9770E' : tone === 'green' ? colors.greenDark : colors.ink;
  return (
    <View style={s.sectionRow}>
      <Text style={[s.sectionTitle, { color }]}>{title}</Text>
      {count !== undefined && <Text style={[s.sectionCount, { color }]}>{count}件</Text>}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  chipText: { fontSize: 15, color: colors.inkSub, fontWeight: '600' },
  chipTextActive: { color: colors.greenDark },
  btn: { minHeight: 50, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnPrimary: { backgroundColor: colors.green },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line },
  btnDanger: { backgroundColor: colors.dangerSoft },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionCount: { fontSize: 14, fontWeight: '700' },
  empty: { padding: 18, borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line, alignItems: 'center' },
  emptyText: { color: colors.inkSub, fontSize: 15 },
});
