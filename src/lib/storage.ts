import AsyncStorage from '@react-native-async-storage/async-storage';

/** ブラウザでは localStorage に保存される。端末外へは送信しない。 */
export const STORAGE_KEY = 'tomori-homework-005:v1';
const BROKEN_KEY = `${STORAGE_KEY}:broken`;

export async function loadRaw(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function saveRaw(raw: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, raw);
}

/** 読み込めなかったデータは消さずに別キーへ退避する */
export async function backupBroken(raw: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BROKEN_KEY, raw);
  } catch {
    // 退避できなくても続行
  }
}
