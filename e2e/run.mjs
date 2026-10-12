// ビルド済み dist/ を GitHub Pages と同じパスで配信し、実ブラウザで動作を確認する。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const BASE = '/tomori-homework-005';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.ico': 'image/x-icon', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('not found'); }
  p = p.slice(BASE.length) || '/';
  let file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const URL_ = `http://localhost:${server.address().port}${BASE}/`;

const exe = process.env.CHROMIUM_PATH ?? undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let pass = 0;
const fail = [];
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail.push(name); console.log(`  FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); }
}
const eq = (a, b, m = '') => { if (a !== b) throw new Error(`${m} 期待=${JSON.stringify(b)} 実際=${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m); };

// 日付は 2026-10-12(月) 10:00 に固定して判定を再現可能にする
const NOW = new Date(2026, 9, 12, 10, 0, 0);
async function open(viewport = { width: 390, height: 844 }, ctx) {
  const context = ctx ?? (await browser.newContext({ viewport, locale: 'ja-JP' }));
  const page = await context.newPage();
  await page.clock.install({ time: NOW });
  await page.goto(URL_);
  await page.getByTestId('today-label').waitFor();
  return { page, context };
}
const txt = (page, id) => page.getByTestId(id).innerText();

console.log('TOMORI HOMEWORK e2e');
const { page, context } = await open();

await t('初回起動：サンプルが「サンプル」印つきで表示される', async () => {
  ok(await page.getByTestId('sample-banner').isVisible(), 'バナー');
  eq(await txt(page, 'today-label'), '2026年10月12日(月)');
  ok((await page.getByText('サンプル', { exact: true }).count()) >= 4, 'サンプル印');
});
await t('期限超過がわかりやすく表示される（1日超過）', async () => {
  eq(await txt(page, 'stat-overdue'), '1');
  eq(await txt(page, 'due-実験レポート'), '⚠ 1日超過');
});
await t('今日・明日・今週の件数', async () => {
  eq(await txt(page, 'stat-today'), '1');
  eq(await txt(page, 'stat-tomorrow'), '1');
  eq(await txt(page, 'stat-week'), '1'); // 水曜の英語テスト
});
await t('サンプルを消せる', async () => {
  await page.getByTestId('clear-samples').click();
  eq(await page.getByTestId('sample-banner').count(), 0);
  eq(await txt(page, 'stat-overdue'), '0');
});
await t('宿題の新規登録（科目・締切日つき）', async () => {
  await page.getByTestId('add').click();
  await page.getByTestId('subject-数学').click();
  await page.getByTestId('title-input').fill('ワーク p.10');
  await page.getByTestId('date-明日').click();
  await page.getByTestId('save').click();
  ok(await page.getByTestId('task-ワーク p.10').isVisible(), '追加された');
  eq(await txt(page, 'stat-tomorrow'), '1');
  eq(await txt(page, 'due-ワーク p.10'), '🔥 明日まで');
});
await t('内容が空だと登録できない', async () => {
  await page.getByTestId('add').click();
  await page.getByTestId('save').click();
  ok((await txt(page, 'form-error')).includes('内容'), 'エラー表示');
  await page.getByTestId('cancel').click();
});
await t('学校名・氏名などの入力欄が無い', async () => {
  await page.getByTestId('add').click();
  const body = await page.locator('body').innerText();
  ok(!/学校名|氏名|名前|学年/.test(body), '個人情報欄なし');
  await page.getByTestId('cancel').click();
});
await t('日付ピッカーで過去日を指定 → 期限超過表示', async () => {
  await page.getByTestId('add').click();
  await page.getByTestId('title-input').fill('提出プリント');
  await page.getByTestId('subject-input').fill('総合');
  await page.getByTestId('date-input').fill('2026-10-09');
  eq(await txt(page, 'date-display'), '2026年10月9日(金)');
  await page.getByTestId('edit-kind-submission').click();
  await page.getByTestId('save').click();
  eq(await txt(page, 'due-提出プリント'), '⚠ 3日超過');
  eq(await txt(page, 'stat-overdue'), '1');
});
await t('締切順に並ぶ（一覧画面）', async () => {
  await page.getByTestId('add').click();
  await page.getByTestId('title-input').fill('英単語');
  await page.getByTestId('date-input').fill('2026-10-30');
  await page.getByTestId('save').click();
  await page.getByTestId('tab-list').click();
  const titles = await page.locator('[data-testid^="task-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid').slice(5)));
  eq(titles.join(','), '提出プリント,ワーク p.10,英単語');
});
await t('科目別表示・種類で絞り込み', async () => {
  await page.getByTestId('mode-subject').click();
  const body = await page.locator('body').innerText();
  ok(body.includes('数学') && body.includes('総合'), '科目見出し');
  await page.getByTestId('kind-submission').click();
  eq(await page.locator('[data-testid^="task-"]').count(), 1);
  await page.getByTestId('kind-all').click();
  await page.getByTestId('mode-due').click();
});
await t('編集：内容と締切の変更が反映される', async () => {
  await page.getByTestId('edit-ワーク p.10').click();
  await page.getByTestId('title-input').fill('ワーク p.10-12');
  await page.getByTestId('date-今日').click();
  await page.getByTestId('save').click();
  eq(await txt(page, 'due-ワーク p.10-12'), '🔥 今日まで');
  eq(await txt(page, 'stat-today'), '1');
});
await t('完了にすると履歴へ移動し、取り消しできる', async () => {
  await page.getByTestId('check-ワーク p.10-12').click();
  ok(await page.getByTestId('toast').isVisible(), 'お祝い表示');
  eq(await page.getByTestId('task-ワーク p.10-12').count(), 0);
  await page.getByTestId('toast-undo').click();
  ok(await page.getByTestId('task-ワーク p.10-12').isVisible(), '未完了にもどる');
  await page.getByTestId('check-ワーク p.10-12').click();
  await page.getByTestId('tab-history').click();
  ok(await page.getByTestId('done-ワーク p.10-12').isVisible(), '履歴に表示');
  eq(await txt(page, 'history-count'), 'これまでに 1件 終わらせたよ！ 👏');
});
await t('履歴から未完了にもどせる', async () => {
  await page.getByTestId('undo-ワーク p.10-12').click();
  eq(await page.getByTestId('done-ワーク p.10-12').count(), 0);
  await page.getByTestId('tab-home').click();
  ok(await page.getByTestId('task-ワーク p.10-12').isVisible(), 'ホームに戻った');
});
await t('完了状態がページ再読み込み後も残る', async () => {
  await page.getByTestId('tab-list').click();
  await page.getByTestId('check-英単語').click();
  await page.reload();
  await page.getByTestId('today-label').waitFor();
  eq(await page.getByTestId('sample-banner').count(), 0, 'サンプルが復活しない');
  ok(await page.getByTestId('task-ワーク p.10-12').isVisible(), '登録が残る');
  ok(await page.getByTestId('task-提出プリント').isVisible(), '提出物が残る');
  await page.getByTestId('tab-history').click();
  ok(await page.getByTestId('done-英単語').isVisible(), '履歴が残る');
});
await t('削除（確認つき）', async () => {
  await page.getByTestId('tab-home').click();
  await page.getByTestId('edit-提出プリント').click();
  await page.getByTestId('delete').click();
  await page.getByTestId('delete-cancel').click();
  await page.getByTestId('delete').click();
  await page.getByTestId('delete-confirm').click();
  eq(await page.getByTestId('task-提出プリント').count(), 0);
  await page.reload();
  await page.getByTestId('today-label').waitFor();
  eq(await page.getByTestId('task-提出プリント').count(), 0, '削除が保存される');
});
await t('日付が変わると判定が更新される（今日→期限超過）', async () => {
  eq(await txt(page, 'stat-today'), '1');
  await page.clock.fastForward('15:00:00'); // 翌日 01:00
  await page.waitForFunction(() => document.body.innerText.includes('10月13日'));
  eq(await txt(page, 'today-label'), '2026年10月13日(火)');
  eq(await txt(page, 'stat-overdue'), '1');
  eq(await txt(page, 'due-ワーク p.10-12'), '⚠ 1日超過');
});
await t('壊れた保存データでも落ちずに警告を出す', async () => {
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await c2.newPage();
  await p2.addInitScript(() => localStorage.setItem('tomori-homework-005:v1', '{broken'));
  await p2.goto(URL_);
  await p2.getByTestId('warning').waitFor();
  await p2.getByTestId('tab-list').click();
  await c2.close();
});
await t('通信は同一サイト内のみ（外部送信なし）', async () => {
  const c3 = await browser.newContext();
  const p3 = await c3.newPage();
  const external = [];
  p3.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== 'localhost' && !r.url().startsWith('data:')) external.push(r.url()); });
  await p3.goto(URL_);
  await p3.getByTestId('today-label').waitFor();
  await p3.getByTestId('add').click();
  await p3.getByTestId('title-input').fill('外部通信テスト');
  await p3.getByTestId('save').click();
  eq(external.length, 0, external.join(','));
  await c3.close();
});

// ---- レイアウト ----
fs.mkdirSync(path.resolve(root, '../e2e/shots'), { recursive: true });
const shots = path.resolve(root, '../e2e/shots');
for (const [name, vp] of [['iphone-se', { width: 375, height: 667 }], ['iphone', { width: 390, height: 844 }], ['pc', { width: 1280, height: 800 }]]) {
  await t(`レイアウト ${name}：横スクロールなし・主要UIが見える`, async () => {
    const c = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const { page: p } = await open(vp, c);
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    ok(sw[0] <= sw[1], `横にはみ出し ${sw}`);
    ok(await p.getByTestId('add').isVisible(), '＋ボタン');
    const box = await p.getByTestId('add').boundingBox();
    ok(box.y + box.height <= vp.height, '＋ボタンが画面内');
    await p.screenshot({ path: path.join(shots, `${name}-home.png`) });
    await p.getByTestId('add').click();
    const sw2 = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    ok(sw2[0] <= sw2[1], `編集画面で横にはみ出し ${sw2}`);
    await p.screenshot({ path: path.join(shots, `${name}-edit.png`), fullPage: true });
    await c.close();
  });
}

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
