// SDK is loaded only when a real, independent Firebase Web config is supplied.
const SDK = 'https://www.gstatic.com/firebasejs/12.4.0';
let client;
export function configured() {
  const c = window.FIREBASE_WORKS_CONFIG;
  return c && ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'].every(k =>
    typeof c[k] === 'string' && c[k] && !c[k].startsWith('YOUR_'));
}
export async function connect() {
  if (!configured()) throw new Error('Firebase の設定がまだ完了していません。');
  if (!client) client = (async () => {
    const [appSDK, dbSDK, authSDK, storageSDK] = await Promise.all([
      import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-firestore.js`),
      import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-storage.js`)
    ]);
    const app = appSDK.initializeApp(window.FIREBASE_WORKS_CONFIG, 'tsukinowa-works');
    return { dbSDK, authSDK, storageSDK, db: dbSDK.getFirestore(app),
      auth: authSDK.getAuth(app), storage: storageSDK.getStorage(app) };
  })();
  return client;
}
export async function imageBlob(path) {
  const c = await connect();
  // Admin preview only. Raw Storage access is denied to all public users.
  return c.storageSDK.getBlob(c.storageSDK.ref(c.storage, path), 5 * 1024 * 1024);
}
export async function publicImageBlob(path) {
  const match = /^works\/([a-zA-Z0-9-]{1,80})\/(before|after)-[a-zA-Z0-9-]+\.(webp|jpg)$/.exec(path);
  const endpoint = window.FIREBASE_WORKS_CONFIG?.photoEndpoint;
  if (!match || typeof endpoint !== 'string' || !endpoint.startsWith('https://')) throw new Error('公開写真の接続先を設定してください。');
  const url = new URL(endpoint); url.searchParams.set('id', match[1]); url.searchParams.set('side', match[2]);
  const response = await fetch(url, { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('施工写真を読み込めません。');
  return response.blob();
}
export async function watchPublished(onData, onError) {
  const c = await connect();
  const q = c.dbSDK.query(c.dbSDK.collection(c.db, 'works'), c.dbSDK.where('published', '==', true));
  return c.dbSDK.onSnapshot(q, { includeMetadataChanges: true }, snap => {
    // Do not display persistent/offline cached records that may have been unpublished.
    if (!snap.metadata.fromCache) onData(snap.docs.map(d => ({ ...d.data(), id: d.id, source: 'firebase' })));
  }, onError);
}
export async function isAdmin(user) {
  if (!user) return false;
  const c = await connect();
  const d = await c.dbSDK.getDocFromServer(c.dbSDK.doc(c.db, 'worksAdmins', user.uid));
  return d.exists() && d.data().enabled === true;
}
export async function uploadImage(id, side, blob) {
  const c = await connect();
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  // Immutable names keep pending edits from replacing the live published photo.
  const path = `works/${id}/${side}-${crypto.randomUUID()}.${extension}`;
  await c.storageSDK.uploadBytes(c.storageSDK.ref(c.storage, path), blob, {
    contentType: blob.type, cacheControl: 'private,max-age=0,no-store'
  });
  return path;
}
export async function removeImage(path) {
  if (!path) return;
  const c = await connect();
  try { await c.storageSDK.deleteObject(c.storageSDK.ref(c.storage, path)); }
  catch (error) { if (error.code !== 'storage/object-not-found') throw error; }
}
export async function saveWork(id, fields, publish) {
  window.WORKS_MODEL.validate(fields, publish);
  const c = await connect();
  if (publish) {
    for (const side of ['before', 'after']) {
      if (!window.WORKS_MODEL.imagePath(id, side, fields[`${side}Image`])) throw new Error('施工写真の保存先を確認してください。');
      await c.storageSDK.getMetadata(c.storageSDK.ref(c.storage, fields[`${side}Image`]));
    }
  }
  const ref = c.dbSDK.doc(c.db, 'works', id);
  await c.dbSDK.runTransaction(c.db, async tx => {
    const old = await tx.get(ref);
    const timestamp = c.dbSDK.serverTimestamp;
    tx.set(ref, { ...fields, imageType: 'real', published: publish,
      createdAt: old.exists() ? old.data().createdAt : timestamp(), updatedAt: timestamp(),
      publishedAt: publish ? (old.data()?.publishedAt || timestamp()) : (old.data()?.publishedAt || null) });
  });
}
