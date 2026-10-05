import { configured, connect, isAdmin, imageBlob, uploadImage, saveWork, removeImage } from './firebase-works.js';
import { compressImage } from './works-image.js';
const $ = id => document.getElementById(id);
const form = $('work-form');
let c, user, authorized = false, stopList, stopAdmin, authRevision = 0;
let selected = null, works = [], busy = false, dirty = false, revision = 0;
const pending = { before: null, after: null };
const previews = new Map();
function message(text) { $('message').textContent = text; }
function errorText(error) {
  if (error.code?.includes('permission-denied') || error.code === 'storage/unauthorized') return '管理者権限がありません。設定した UID とルールを確認してください。';
  if (error.code?.startsWith('auth/')) return 'ログインできませんでした。メールアドレス・パスワード・接続を確認してください。';
  return error.message || '処理に失敗しました。接続を確認して再度お試しください。';
}
function lock(value) {
  busy = value;
  document.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = value);
}
async function action(fn) {
  if (busy) return;
  lock(true);
  try { await fn(); } catch (error) { message(errorText(error)); } finally { lock(false); }
}
function requireAdmin() { if (!authorized || !user) throw new Error('管理者としてログインしてください。'); }
function cleanupPreviews() { previews.forEach(url => URL.revokeObjectURL(url)); previews.clear(); }
function preview(side, blob) {
  const old = previews.get(side); if (old) URL.revokeObjectURL(old);
  const url = URL.createObjectURL(blob); previews.set(side, url);
  $(`${side}-preview`).src = url; $(`${side}-preview`).hidden = false;
  $(`${side}-status`).textContent = '写真あり'; hint();
}
function hint() {
  const missing = ['before', 'after'].filter(side => !pending[side] && !selected?.[`${side}Image`]);
  $('publish-hint').textContent = missing.length ? `未登録：${missing.map(s => s === 'before' ? 'Before' : 'After').join(' / ')}。草稿は保存できます。` : 'Before / After が揃っています。内容と公開許可を確認して公開してください。';
}
function discard() { return !dirty || confirm('保存していない変更を破棄しますか？'); }
function edit(work = null) {
  revision++; cleanupPreviews(); selected = work ? { ...work } : null; dirty = false;
  pending.before = pending.after = null; form.reset();
  for (const key of ['title', 'category', 'date', 'area', 'propertyType', 'description']) form.elements.namedItem(key).value = work?.[key] || (key === 'category' ? window.WORKS_MODEL.categories[0] : '');
  $('editor-heading').textContent = work ? `${work.published ? '公開中' : '草稿'}：${work.title}` : '新しい施工実績';
  $('delete').hidden = !work; $('unpublish').hidden = !work?.published;
  const current = revision;
  for (const side of ['before', 'after']) {
    $(`${side}-preview`).hidden = true; $(`${side}-preview`).removeAttribute('src');
    $(`${side}-status`).textContent = work?.[`${side}Image`] ? '読み込み中…' : '未選択';
    if (work?.[`${side}Image`]) imageBlob(work[`${side}Image`]).then(blob => {
      if (current === revision && authorized) preview(side, blob);
    }).catch(() => { if (current === revision) $(`${side}-status`).textContent = '写真を読み込めません。再選択できます。'; });
  }
  hint(); drawList();
}
function drawList() {
  $('work-list').replaceChildren();
  for (const work of works) {
    const button = document.createElement('button'); button.type = 'button'; button.disabled = busy;
    button.textContent = `${work.published ? '已发布 / 公開中' : '草稿'} — ${work.title}`;
    button.setAttribute('aria-current', String(work.id === selected?.id));
    button.addEventListener('click', () => { if (!busy && discard()) edit(work); });
    $('work-list').append(button);
  }
  if (!works.length) $('work-list').textContent = 'まだ施工実績がありません。';
}
window.WORKS_MODEL.categories.forEach(category => {
  const option = document.createElement('option'); option.textContent = option.value = category; form.elements.category.append(option);
});
form.addEventListener('input', () => { dirty = true; });
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });
for (const side of ['before', 'after']) $(`${side}-file`).addEventListener('change', () => action(async () => {
  requireAdmin(); const file = $(`${side}-file`).files[0]; if (!file) return;
  pending[side] = await compressImage(file); dirty = true; preview(side, pending[side]);
  message(`${side === 'before' ? 'Before' : 'After'} を準備しました。保存するとアップロードされます。`);
}));
async function save(publish) {
  requireAdmin();
  if (!form.reportValidity()) return;
  const fields = Object.fromEntries(['title', 'category', 'date', 'area', 'propertyType', 'description'].map(key => [key, form.elements.namedItem(key).value.trim()]));
  fields.beforeImage = selected?.beforeImage || ''; fields.afterImage = selected?.afterImage || '';
  window.WORKS_MODEL.validate({ ...fields, beforeImage: pending.before || fields.beforeImage, afterImage: pending.after || fields.afterImage }, publish);
  if (publish && !$('real-confirm').checked) throw new Error('実際の施工写真と公開許可の確認にチェックを入れてください。');
  const id = selected?.id || c.dbSDK.doc(c.dbSDK.collection(c.db, 'works')).id;
  const uploaded = [], previous = selected;
  try {
    for (const side of ['before', 'after']) if (pending[side]) {
      fields[`${side}Image`] = await uploadImage(id, side, pending[side]); uploaded.push(fields[`${side}Image`]);
    }
    await saveWork(id, fields, publish);
  } catch (error) {
    await Promise.allSettled(uploaded.map(removeImage)); throw error;
  }
  // Metadata update is atomic; old photos are removed only after the new pair is saved.
  const cleanup = await Promise.allSettled(['before', 'after'].filter(side => previous?.[`${side}Image`] && previous[`${side}Image`] !== fields[`${side}Image`]).map(side => removeImage(previous[`${side}Image`])));
  dirty = false; edit({ id, ...fields, published: publish });
  message(`${publish ? '公開しました。ホームページに自動反映されます。' : '草稿を保存しました。公開ページには表示されません。'}${cleanup.some(r => r.status === 'rejected') ? ' 古い写真の削除に失敗しました。管理者が Storage を確認してください。' : ''}`);
}
form.addEventListener('submit', event => { event.preventDefault(); action(() => save(false)); });
$('publish').addEventListener('click', () => action(() => save(true)));
$('new-work').addEventListener('click', () => { if (!busy && discard()) edit(); });
$('unpublish').addEventListener('click', () => action(async () => {
  requireAdmin(); if (!selected || !discard()) return;
  await c.dbSDK.updateDoc(c.dbSDK.doc(c.db, 'works', selected.id), { published: false, updatedAt: c.dbSDK.serverTimestamp() });
  edit({ ...selected, published: false }); message('下架しました。公開ページから削除されます。');
}));
$('delete').addEventListener('click', () => action(async () => {
  requireAdmin(); if (!selected || !confirm(`「${selected.title}」と写真を削除しますか？元に戻せません。`)) return;
  const id = selected.id;
  await c.dbSDK.deleteDoc(c.dbSDK.doc(c.db, 'works', id));
  edit(); dirty = false;
  // Delete document first so any remaining file becomes immediately inaccessible publicly.
  try {
    const files = await c.storageSDK.listAll(c.storageSDK.ref(c.storage, `works/${id}`));
    await Promise.all(files.items.map(item => removeImage(item.fullPath)));
    message('施工実績と写真を削除しました。');
  } catch { message('施工実績を削除しました。写真の削除に失敗したため、Storage で残った写真を削除してください。公開アクセスは停止しています。'); }
}));
$('import-local').addEventListener('click', () => action(async () => {
  requireAdmin(); if (!discard() || !confirm('既存の実際の施工写真を草稿として取り込みます。取り込み後に内容を確認して公開してください。同じIDの登録済み案例は上書きしません。')) return;
  let imported = 0;
  for (const work of window.WORKS_DATA || []) {
    if (work.imageType !== 'real' || !window.WORKS_MODEL.validId(work.id)) continue;
    if ((await c.dbSDK.getDocFromServer(c.dbSDK.doc(c.db, 'works', work.id))).exists()) continue;
    const fields = Object.fromEntries(['title', 'category', 'date', 'area', 'propertyType', 'description'].map(key => [key, work[key] || '']));
    fields.beforeImage = fields.afterImage = '';
    const uploaded = [];
    try {
      for (const side of ['before', 'after']) {
        const path = work[`${side}Image`];
        if (path !== `assets/images/works/real/${work.id}/${side}.webp`) continue;
        const response = await fetch(new URL(`../../${path}`, import.meta.url));
        if (!response.ok) continue;
        const blob = await compressImage(await response.blob());
        fields[`${side}Image`] = await uploadImage(work.id, side, blob); uploaded.push(fields[`${side}Image`]);
      }
      await saveWork(work.id, fields, false); imported++;
    } catch (error) { await Promise.allSettled(uploaded.map(removeImage)); throw error; }
  }
  edit(); message(`${imported}件を草稿として取り込みました。写真と内容を確認してから公開してください。`);
}));
$('login-form').addEventListener('submit', event => {
  event.preventDefault(); action(async () => {
    if (!c) throw new Error('Firebase の設定と接続を確認してください。');
    await c.authSDK.setPersistence(c.auth, c.authSDK.browserSessionPersistence);
    await c.authSDK.signInWithEmailAndPassword(c.auth, $('email').value.trim(), $('password').value);
    $('password').value = '';
  });
});
$('logout').addEventListener('click', () => action(async () => {
  if (!discard()) return; dirty = false; await c.authSDK.signOut(c.auth);
}));
function hideManager() {
  authorized = false; stopList?.(); stopList = null; stopAdmin?.(); stopAdmin = null;
  works = []; edit(); $('manager').hidden = true;
}
if (!configured()) {
  message('Firebase 未設定です。FIREBASE_WORKS_SETUP.md の手順で設定してください。');
  $('login-form').querySelector('button').disabled = true;
} else {
  try {
    c = await connect();
    c.authSDK.onAuthStateChanged(c.auth, async nextUser => {
      const current = ++authRevision; hideManager(); user = nextUser;
      $('login-panel').hidden = !!user; $('session-panel').hidden = !user;
      $('account').textContent = user?.email || '';
      if (!user) { dirty = false; message('管理者のメールアドレスでログインしてください。'); return; }
      message('管理者権限を確認しています…');
      try {
        const allowed = await isAdmin(user);
        if (current !== authRevision) return;
        if (!allowed) { message('このアカウントには管理者権限がありません。管理者 UID の設定を確認してください。'); return; }
        authorized = true; $('manager').hidden = false; message('管理者としてログインしました。');
        stopAdmin = c.dbSDK.onSnapshot(c.dbSDK.doc(c.db, 'worksAdmins', user.uid), snap => {
          if (!snap.exists() || snap.data().enabled !== true) { hideManager(); message('管理者権限が解除されました。'); }
        }, () => { hideManager(); message('管理者権限を確認できません。再ログインしてください。'); });
        stopList = c.dbSDK.onSnapshot(c.dbSDK.collection(c.db, 'works'), snap => {
          works = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
          drawList();
        }, error => { hideManager(); message(errorText(error)); });
      } catch (error) { if (current === authRevision) message(errorText(error)); }
    });
  } catch (error) { message(errorText(error)); }
}
