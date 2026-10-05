const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, collection, where, serverTimestamp } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, getMetadata, listAll, deleteObject } = require('firebase/storage');
let env, admin, visitor, other;
const work = (id, published = false, overrides = {}) => ({title:'本物の施工',category:'壁面補修',date:'',area:'',propertyType:'',description:'補修',beforeImage:`works/${id}/before-1.webp`,afterImage:`works/${id}/after-1.webp`,published,imageType:'real',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),publishedAt:published ? serverTimestamp() : null,...overrides});
const meta = {contentType:'image/webp',cacheControl:'private,max-age=0,no-store'};
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-tsukinowa',firestore:{rules:fs.readFileSync('firebase/firestore.rules','utf8')},storage:{rules:fs.readFileSync('firebase/storage.rules','utf8')}});
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(),'worksAdmins','test-admin'), {enabled:true}));
  admin = env.authenticatedContext('test-admin'); visitor = env.unauthenticatedContext(); other = env.authenticatedContext('ordinary-user');
});
after(async () => { await env?.cleanup(); });
test('only provisioned administrator may create/update/delete, never self-authorize', async () => {
  for (const ctx of [visitor, other]) {
    await assertFails(setDoc(doc(ctx.firestore(),'works','denied'),work('denied')));
    await assertFails(setDoc(doc(ctx.firestore(),'worksAdmins','ordinary-user'),{enabled:true}));
  }
  await assertSucceeds(getDoc(doc(admin.firestore(),'worksAdmins','test-admin')));
  await assertFails(getDoc(doc(other.firestore(),'worksAdmins','test-admin')));
  await assertSucceeds(setDoc(doc(admin.firestore(),'works','draft'),work('draft',false,{beforeImage:'',afterImage:''})));
  await assertFails(updateDoc(doc(other.firestore(),'works','draft'),{published:true}));
  await assertFails(deleteDoc(doc(other.firestore(),'works','draft')));
});
test('drafts hidden, both image paths required, AI and invalid schemas rejected', async () => {
  await assertFails(getDoc(doc(visitor.firestore(),'works','draft')));
  await assertFails(getDoc(doc(other.firestore(),'works','draft')));
  for (const patch of [{afterImage:''},{beforeImage:''},{imageType:'ai'},{category:'invalid'},{beforeImage:'https://example.com/fake.webp'},{date:'2026-13'},{extra:'unknown'},{title:''}]) {
    await assertFails(setDoc(doc(admin.firestore(),'works','bad'), work('bad',true,patch)));
  }
  await assertSucceeds(setDoc(doc(admin.firestore(),'works','live'),work('live',true)));
  await assertSucceeds(getDoc(doc(visitor.firestore(),'works','live')));
  await assertSucceeds(getDocs(query(collection(visitor.firestore(),'works'),where('published','==',true))));
  await assertFails(getDocs(collection(visitor.firestore(),'works')));
});
test('only admin uploads approved images; draft and unreferenced versions remain private', async () => {
  for (const ctx of [visitor,other]) await assertFails(uploadBytes(ref(ctx.storage(),'works/live/before-1.webp'),new Uint8Array([1]),meta));
  for (const path of ['works/live/before-1.webp','works/live/after-1.webp','works/live/before-2.webp','works/draft/before-1.webp']) await assertSucceeds(uploadBytes(ref(admin.storage(),path),new Uint8Array([1,2,3]),meta));
  await assertFails(getBytes(ref(visitor.storage(),'works/live/before-1.webp')));
  await assertFails(getBytes(ref(visitor.storage(),'works/live/before-2.webp')));
  await assertFails(getBytes(ref(visitor.storage(),'works/draft/before-1.webp')));
  await assertSucceeds(getBytes(ref(admin.storage(),'works/draft/before-1.webp')));
  await assertFails(listAll(ref(visitor.storage(),'works/live')));
  await assertSucceeds(listAll(ref(admin.storage(),'works/live')));
  await assertFails(uploadBytes(ref(admin.storage(),'works/live/after-2.webp'),new Uint8Array([1]),{...meta,contentType:'image/svg+xml'}));
  await assertFails(uploadBytes(ref(admin.storage(),'works/live/before-1.webp'),new Uint8Array([9]),meta));
  await assertFails(getMetadata(ref(visitor.storage(),'works/live/before-1.webp')));
  await assertSucceeds(getMetadata(ref(admin.storage(),'works/live/before-1.webp')));
});
test('unpublish and delete immediately revoke public document and image access', async () => {
  await assertSucceeds(updateDoc(doc(admin.firestore(),'works','live'),{published:false,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(visitor.firestore(),'works','live')));
  await assertFails(getBytes(ref(visitor.storage(),'works/live/before-1.webp')));
  await assertSucceeds(updateDoc(doc(admin.firestore(),'works','live'),{published:true,updatedAt:serverTimestamp()}));
  await assertFails(getBytes(ref(visitor.storage(),'works/live/before-1.webp')));
  await assertSucceeds(deleteDoc(doc(admin.firestore(),'works','live')));
  await assertFails(getBytes(ref(visitor.storage(),'works/live/before-1.webp')));
  await assertSucceeds(deleteObject(ref(admin.storage(),'works/live/before-1.webp')));
});
