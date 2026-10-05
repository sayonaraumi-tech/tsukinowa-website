const { test } = require('node:test');
const assert = require('node:assert/strict');
const { photoHandler } = require('../firebase/functions/photo-handler');
const record = { published:true,imageType:'real',beforeImage:'works/live/before-1.webp' };
async function request(work, query = {id:'live',side:'before'}, getPhoto) {
  const result = {headers:{}};
  const response = {set(k,v){result.headers[k]=v;return this;},type(v){result.type=v;return this;},status(v){result.status=v;return this;},send(v){result.body=v;return this;}};
  await photoHandler({getWork:async()=>work,getPhoto:getPhoto || (async()=>({bytes:Buffer.from('photo'),type:'image/webp'}))})({method:'GET',query},response);
  return result;
}
test('public interface returns only published real photo bytes, never tokens', async () => {
  const result = await request(record);
  assert.equal(result.status,200); assert.equal(result.body.toString(),'photo');
  assert.match(result.headers['Cache-Control'],/no-store/);
  for (const work of [null,{...record,published:false},{...record,imageType:'ai'},{...record,beforeImage:'works/other/before-1.webp'}]) assert.equal((await request(work)).status,404);
  assert.equal((await request(record,{id:'../escape',side:'before'})).status,400);
  assert.equal((await request(record,{id:'live',side:'unknown'})).status,400);
});
test('withdrawal during image reading is checked again before response', async () => {
  let calls=0;const result={};const response={set(){return this;},type(){return this;},status(v){result.status=v;return this;},send(){return this;}};
  await photoHandler({getWork:async()=>++calls===1?record:{...record,published:false},getPhoto:async()=>({bytes:Buffer.from('photo'),type:'image/webp'})})({method:'GET',query:{id:'live',side:'before'}},response);
  assert.equal(result.status,404);
});
