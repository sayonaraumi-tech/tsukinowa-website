const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('assets/js/works-model.js', 'utf8'), ctx);
const model = ctx.window.WORKS_MODEL;
const fields = {title:'実際の施工',category:'壁面補修',date:'',area:'',propertyType:'',description:'',beforeImage:'',afterImage:''};
test('draft accepts independent images; publication requires both', () => {
  model.validate(fields);
  assert.throws(() => model.validate(fields, true), /Before/);
  assert.throws(() => model.validate({...fields, beforeImage:'works/case/before-1.webp'}, true), /Before/);
  model.validate({...fields, beforeImage:'works/case/before-1.webp', afterImage:'works/case/after-1.webp'}, true);
});
test('category, month, and image provenance paths are restricted', () => {
  assert.throws(() => model.validate({...fields, category:'unknown'}));
  assert.throws(() => model.validate({...fields, date:'2026-13'}));
  assert.equal(model.imagePath('Case123', 'before', 'works/Case123/before-123.webp'), true);
  for (const path of ['https://example.com/a.jpg','works/other/before-123.webp','works/Case123/after-123.webp','assets/images/ai/a.webp']) assert.equal(model.imagePath('Case123','before',path), false);
});
