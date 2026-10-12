import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Edit } from './src/screens/Edit';
import { History } from './src/screens/History';
import { Home } from './src/screens/Home';
import { List } from './src/screens/List';
import { StoreProvider, useStore } from './src/store';
import { colors, MAX_WIDTH } from './src/theme';

type Route = { name: 'home' } | { name: 'list' } | { name: 'history' } | { name: 'edit'; id: string | null };

const CHEERS = ['やったね！🎉', 'ナイス！✨', 'えらい！👏', 'また1つクリア！🌟', 'いいね、その調子！💪'];

function Shell() {
  const { ready, tasks, setDone, loadWarning, saveError } = useStore();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  // 完了したときのお祝い表示（取り消し可能）
  const prevDone = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!ready) return;
    const now = new Set(tasks.filter((t) => t.done).map((t) => t.id));
    if (prevDone.current.size || tasks.length) {
      for (const id of now) {
        if (!prevDone.current.has(id) && route.name !== 'history') {
          setToast({ id, text: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setToast(null), 4000);
        }
      }
    }
    prevDone.current = now;
  }, [tasks, ready, route.name]);

  if (!ready) {
    return (
      <View style={s.center}>
        <Text style={{ color: colors.inkSub }}>読み込み中…</Text>
      </View>
    );
  }

  const go = (r: Route) => {
    setRoute(r);
    setToast(null);
  };
  const editing = route.name === 'edit';
  const tab = (name: 'home' | 'list' | 'history', icon: string, label: string) => (
    <Pressable
      testID={`tab-${name}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: route.name === name }}
      onPress={() => go({ name })}
      style={s.tab}
    >
      <Text style={[s.tabIcon, route.name === name && { opacity: 1 }]}>{icon}</Text>
      <Text style={[s.tabLabel, route.name === name && s.tabLabelOn]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.headerWrap}>
        <View style={s.header}>
          <Text style={s.brand}>TOMORI HOMEWORK</Text>
          <Text style={s.brandSub}>宿題・提出物・テストをまとめて管理</Text>
        </View>
      </View>

      {(loadWarning || saveError) && (
        <View style={s.warning} testID="warning">
          <Text style={s.warningText}>
            {saveError ? '⚠ 保存できませんでした。ブラウザの保存が禁止されているかもしれません。' : `⚠ ${loadWarning}`}
          </Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.page}>
          {route.name === 'home' && <Home onEdit={(id) => go({ name: 'edit', id })} onGoList={() => go({ name: 'list' })} />}
          {route.name === 'list' && <List onEdit={(id) => go({ name: 'edit', id })} />}
          {route.name === 'history' && <History onEdit={(id) => go({ name: 'edit', id })} />}
          {route.name === 'edit' && <Edit key={route.id ?? 'new'} id={route.id} onClose={() => go({ name: 'home' })} />}
          <View style={s.footer}>
            <Text style={s.footerText}>
              データはこの端末（ブラウザ）の中だけに保存されます。外部には送信されません。ブラウザのデータを消すと記録も消えるので注意してね。
            </Text>
          </View>
        </View>
      </ScrollView>

      {toast && (
        <View style={s.toastWrap} pointerEvents="box-none">
          <View style={s.toast} testID="toast">
            <Text style={s.toastText}>{toast.text}</Text>
            <Pressable
              testID="toast-undo"
              accessibilityRole="button"
              onPress={() => {
                setDone(toast.id, false);
                setToast(null);
              }}
            >
              <Text style={s.toastUndo}>取り消す</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!editing && (
        <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          <View style={s.tabInner}>
            {tab('home', '🏠', 'ホーム')}
            {tab('list', '📋', '予定一覧')}
            <Pressable testID="add" accessibilityRole="button" accessibilityLabel="予定を登録" onPress={() => go({ name: 'edit', id: null })} style={s.addBtn}>
              <Text style={s.addText}>＋</Text>
            </Pressable>
            {tab('history', '✅', '完了履歴')}
          </View>
        </View>
      )}
    </View>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'TOMORI HOMEWORK';
      document.documentElement.lang = 'ja';
    }
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerWrap: { backgroundColor: colors.card, borderBottomWidth: 3, borderBottomColor: colors.green },
  header: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  brand: { fontSize: 18, fontWeight: '900', color: colors.greenDark, letterSpacing: 1 },
  brandSub: { fontSize: 11, color: colors.inkSub },
  scroll: { paddingBottom: 110 },
  page: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16 },
  footer: { marginTop: 28, padding: 12, borderRadius: 12, backgroundColor: '#F3EFE0' },
  footerText: { fontSize: 12, color: colors.inkSub, lineHeight: 18 },
  warning: { backgroundColor: colors.dangerSoft, padding: 10 },
  warningText: { color: colors.danger, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
  tabInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 48 },
  tabIcon: { fontSize: 22, opacity: 0.55 },
  tabLabel: { fontSize: 11, color: colors.inkSub, fontWeight: '700' },
  tabLabelOn: { color: colors.greenDark },
  addBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: colors.card },
  addText: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 36 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', paddingHorizontal: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.ink, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  toastText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  toastUndo: { color: '#9FE8B5', fontWeight: '800', fontSize: 15 },
});
