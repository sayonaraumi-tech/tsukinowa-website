// Actual browser UI + Firebase Auth/Firestore/Storage emulators; no production project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { photoHandler } = require('../firebase/functions/photo-handler');
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Run only through Firebase emulators:exec.');
const root = process.cwd();
const sdkURL = 'https://www.gstatic.com/firebasejs/12.4.0/';
const config = {apiKey:'demo-key',authDomain:'demo-tsukinowa.firebaseapp.com',projectId:'demo-tsukinowa',storageBucket:'demo-tsukinowa.appspot.com',appId:'demo-app',photoEndpoint:'https://photo.test/workPhoto'};
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const app = initializeApp({projectId:config.projectId,storageBucket:config.storageBucket},'browser-test');
const db = getFirestore(app), storage = getStorage(app);
const handler = photoHandler({getWork:async id=>(await db.doc(`works/${id}`).get()).data(),getPhoto:async p=>({bytes:(await storage.bucket().file(p).download())[0],type:'image/webp'})});
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url,'http://localhost');
  if (url.pathname === '/workPhoto') {
    const response={set(k,v){res.setHeader(k,v);return this;},type(t){res.setHeader('Content-Type',t);return this;},status(n){res.statusCode=n;return this;},send(b){res.end(b);return this;}};
    await handler({method:req.method,query:Object.fromEntries(url.searchParams)},response);return;
  }
  const file = path.join(root,url.pathname === '/' ? 'index.html' : url.pathname);
  try {res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));} catch {res.statusCode=404;res.end('missing');}
});
const report=[];
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sdk = {};
  for (const name of ['app','auth','firestore','storage']) {
    const file=`firebase-${name}.js`;
    sdk[file]=process.env.SDK_DIR ? fs.readFileSync(path.join(process.env.SDK_DIR,file),'utf8') : await (await fetch(sdkURL+file)).text();
  }
  browser = await chromium.launch({headless:true});
  const fallback = await browser.newPage();
  for (const width of [320,390,768,1440]) {
    await fallback.setViewportSize({width,height:1000});
    for (const page of ['index.html','works.html','admin/works.html']) {
      await fallback.goto(`${base}/${page}`);
      if (page !== 'admin/works.html') await fallback.waitForSelector('[data-works] .work');
      assert.equal(await fallback.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`${page} ${width}`);
      assert.match(await fallback.locator('meta[name=robots]').getAttribute('content'),/noindex/);
      if (page === 'admin/works.html') assert.equal(await fallback.locator('#manager').isVisible(),false);
      else assert.equal(await fallback.locator('[data-works] .work').count(),4);
    }
  }
  const compression = await fallback.evaluate(async () => {
    const { compressImage } = await import('/assets/js/works-image.js');
    const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1200;canvas.getContext('2d').fillRect(0,0,2400,1200);
    const input=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const output=await compressImage(input), bitmap=await createImageBitmap(output);
    const orientation=await compressImage(await (await fetch('/tests/fixtures/exif-orientation.jpg')).blob());
    const oriented=await createImageBitmap(orientation);
    return {type:output.type,width:bitmap.width,height:bitmap.height,orientation:[oriented.width,oriented.height]};
  });
  assert.deepEqual(compression,{type:'image/webp',width:1600,height:800,orientation:[80,40]});
  report.push('unconfigured fallback and 320/390/768/1440 public + login layouts pass; WebP resizing and EXIF rotation pass');
  await fallback.close();
  const ctx = await browser.newContext();
  await ctx.route('**/assets/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.FIREBASE_WORKS_CONFIG=${JSON.stringify(config)};`}));
  await ctx.route(`${sdkURL}*`,r=>r.fulfill({contentType:'text/javascript',body:sdk[r.request().url().split('/').pop()]}));
  await ctx.route('**/assets/js/firebase-works.js',r=> {
    let body = fs.readFileSync('assets/js/firebase-works.js','utf8');
    const original=`return { dbSDK, authSDK, storageSDK, db: dbSDK.getFirestore(app),\n      auth: authSDK.getAuth(app), storage: storageSDK.getStorage(app) };`;
    assert.ok(body.includes(original));
    body=body.replace(original,`const db=dbSDK.getFirestore(app),auth=authSDK.getAuth(app),storage=storageSDK.getStorage(app);\n    dbSDK.connectFirestoreEmulator(db,'127.0.0.1',8080);\n    authSDK.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});\n    storageSDK.connectStorageEmulator(storage,'127.0.0.1',9199);\n    return {dbSDK,authSDK,storageSDK,db,auth,storage};`);
    return r.fulfill({contentType:'text/javascript',body});
  });
  await ctx.route('https://photo.test/**',async r=>{const url=new URL(r.request().url());const response=await r.fetch({url:base+url.pathname+url.search});await r.fulfill({response});});
  await db.recursiveDelete(db.collection('works'));
  const password = require('node:crypto').randomBytes(16).toString('hex');
  const signup = async email => {
    const res=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    assert.equal(res.status,200);return (await res.json()).localId;
  };
  const adminEmail='admin@example.invalid',otherEmail='visitor@example.invalid';
  const uid=await signup(adminEmail);await signup(otherEmail);
  await db.doc(`worksAdmins/${uid}`).set({enabled:true});
  const admin=await ctx.newPage(); const errors=[];admin.on('pageerror',e=>errors.push(e.message));
  await admin.goto(`${base}/admin/works.html`);
  assert.equal(await admin.locator('#manager').isVisible(),false);
  const login=async email=>{
    await admin.fill('#email',email);await admin.fill('#password',password);await admin.click('#login-form button');
  };
  await login(otherEmail);await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('管理者権限がありません'));
  assert.equal(await admin.locator('#manager').isVisible(),false);
  await admin.click('#logout');await admin.waitForSelector('#login-panel');
  await login(adminEmail);await admin.waitForSelector('#manager');
  report.push('real Auth unauthenticated/ordinary-user/authorized-admin interface passes');
  const home=await ctx.newPage(),all=await ctx.newPage();
  await home.goto(base+'/index.html');await all.goto(base+'/works.html');
  await home.waitForFunction(()=>document.querySelector('[data-works]').textContent.includes('掲載準備中'));
  assert.equal(await home.locator('[data-works] .work').count(),0);
  await admin.fill('[name=title]','テスト施工');
  await admin.click('#save-draft');await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('草稿を保存しました'));
  assert.equal((await db.collection('works').get()).size,1);
  assert.equal(await home.locator('[data-works] .work').count(),0);
  await admin.check('#real-confirm');await admin.click('#publish');
  await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('両方が必要'));
  const fixture = path.join(root,'assets/images/works/real/white-grain-door/before.webp');
  await admin.setInputFiles('#before-file',fixture);await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('Before を準備'));
  await admin.click('#save-draft');await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('草稿を保存しました'));
  let doc=(await db.collection('works').get()).docs[0];
  assert.ok(doc.data().beforeImage);assert.equal(doc.data().afterImage,'');assert.equal(doc.data().published,false);
  await admin.check('#real-confirm');await admin.click('#publish');await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('両方が必要'));
  await admin.setInputFiles('#after-file',fixture);await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('After を準備'));
  await admin.click('#publish');await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('公開しました'));
  await home.waitForSelector('[data-works] .work');await all.waitForSelector('[data-works] .work');
  await home.waitForFunction(()=>[...document.querySelectorAll('[data-works] img')].every(i=>i.complete&&i.naturalWidth));
  report.push('empty Firebase stays empty; partial draft stays private; missing pair rejected; real uploads + public photo endpoint pass');
  // Seed additional real cases to verify latest four selection and filtering live updates.
  const original=(await db.doc(`works/${doc.id}`).get()).data();
  for(let n=1;n<=5;n++){
    const id=`extra-${n}`,before=`works/${id}/before-test.webp`,after=`works/${id}/after-test.webp`;
    await storage.bucket().file(before).save(fs.readFileSync(fixture),{metadata:{contentType:'image/webp'}});
    await storage.bucket().file(after).save(fs.readFileSync(fixture),{metadata:{contentType:'image/webp'}});
    await db.doc(`works/${id}`).set({...original,title:`追加${n}`,category:n%2?'クロス':'ドア補修',beforeImage:before,afterImage:after,publishedAt:new Date(Date.now()+n*1000)});
  }
  await all.waitForFunction(()=>document.querySelectorAll('[data-works] .work').length===6);
  await home.waitForFunction(()=>document.querySelectorAll('[data-works] .work').length===4);
  assert.deepEqual(await home.locator('[data-works] .work').evaluateAll(items=>items.map(i=>i.id)),['extra-5','extra-4','extra-3','extra-2']);
  await all.getByRole('button',{name:'クロス',exact:true}).click();assert.equal(await all.locator('[data-works] .work').count(),3);
  await all.goto(base+'/works.html#extra-1');await all.waitForSelector('#extra-1');
  await all.waitForFunction(()=>document.getElementById('extra-1').getBoundingClientRect().top < 400);
  for (const width of [320,390,768,1440]) {
    for (const page of [home,all,admin]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`configured width ${width}`);
    }
  }
  report.push('latest4/all6/filter/anchor and all four widths with manager + live photos pass');
  await admin.click('#unpublish');await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('下架しました'));
  await all.waitForFunction(id=>!document.getElementById(id),doc.id);
  const photoURL=base+`/workPhoto?id=${doc.id}&side=before`;
  assert.equal((await fetch(photoURL)).status,404);
  await admin.check('#real-confirm');await admin.click('#publish');await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('公開しました'));
  assert.equal((await fetch(photoURL)).status,200);
  admin.once('dialog',d=>d.dismiss());await admin.click('#delete');assert.equal((await db.doc(`works/${doc.id}`).get()).exists,true);
  admin.once('dialog',d=>d.accept());await admin.click('#delete');await admin.waitForFunction(()=>document.getElementById('message').textContent.startsWith('施工実績と写真を削除'));
  assert.equal((await db.doc(`works/${doc.id}`).get()).exists,false);assert.equal((await fetch(photoURL)).status,404);
  await all.waitForFunction(()=>document.querySelectorAll('[data-works] .work').length===5);
  await db.doc('works/extra-5').delete();
  await home.waitForFunction(()=>document.querySelector('[data-works] .work')?.id==='extra-4');
  assert.equal(await home.locator('[data-works] .work').count(),4);
  admin.once('dialog',d=>d.accept());await admin.click('#import-local');
  await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('5件を草稿として取り込みました'));
  const pet=(await db.doc('works/pet-wall-repair').get()).data();
  assert.equal(pet.published,false);assert.equal(pet.beforeImage,'');assert.ok(pet.afterImage);
  admin.once('dialog',d=>d.accept());await admin.click('#import-local');
  await admin.waitForFunction(()=>document.getElementById('message').textContent.includes('0件を草稿として取り込みました'));
  await all.waitForFunction(()=>document.querySelectorAll('[data-works] .work').length===4);
  report.push('unpublish/republish/delete confirmation, realtime updates and photo revoke pass; existing data imports once as drafts including missing Before');
  assert.deepEqual(errors,[]);
  await ctx.close();
  // Initial connection failure uses the existing historical data.
  const failure=await browser.newPage();
  await failure.route('**/assets/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.FIREBASE_WORKS_CONFIG=${JSON.stringify(config)};`}));
  await failure.route('**/assets/js/firebase-works.js',r=>r.fulfill({contentType:'text/javascript',body:'export const configured=()=>true; export const watchPublished=async()=>{throw new Error("offline")};'}));
  await failure.goto(base+'/works.html');await failure.waitForSelector('[data-works] .work');assert.equal(await failure.locator('[data-works] .work').count(),4);
  report.push('initial Firebase failure fallback passes');
  console.log(report.join('\n'));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
