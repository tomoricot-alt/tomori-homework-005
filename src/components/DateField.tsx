import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { addDays, formatDateFull, isValidDateString } from '../lib/date';
import { colors, radius } from '../theme';
import { Chip } from './ui';

/** 締切日の入力。クイック選択＋±1日。Webでは日付ピッカーも使える。 */
export function DateField({ value, today, onChange }: { value: string; today: string; onChange: (v: string) => void }) {
  const valid = isValidDateString(value);
  const quick: [string, number][] = [
    ['今日', 0],
    ['明日', 1],
    ['あさって', 2],
    ['1週間後', 7],
  ];
  return (
    <View style={{ gap: 10 }}>
      <Text testID="date-display" style={s.display}>
        {valid ? formatDateFull(value) : '日付を選んでね'}
      </Text>
      <View style={s.row}>
        {quick.map(([label, n]) => (
          <Chip key={label} label={label} active={value === addDays(today, n)} onPress={() => onChange(addDays(today, n))} testID={`date-${label}`} />
        ))}
      </View>
      <View style={s.row}>
        <Chip label="◀ 1日前" onPress={() => onChange(addDays(valid ? value : today, -1))} testID="date-prev" />
        <Chip label="1日後 ▶" onPress={() => onChange(addDays(valid ? value : today, 1))} testID="date-next" />
      </View>
      {Platform.OS === 'web' &&
        React.createElement('input', {
          type: 'date',
          value: valid ? value : '',
          'data-testid': 'date-input',
          'aria-label': 'カレンダーから日付を選ぶ',
          onChange: (e: { target: { value: string } }) => {
            if (isValidDateString(e.target.value)) onChange(e.target.value);
          },
          style: {
            fontSize: 16,
            padding: 10,
            borderRadius: radius.button,
            border: `1.5px solid ${colors.line}`,
            background: '#fff',
            color: colors.ink,
            fontFamily: 'inherit',
          },
        })}
    </View>
  );
}

const s = StyleSheet.create({
  display: { fontSize: 22, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
