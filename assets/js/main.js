const toggle=document.querySelector('.menu-toggle'); const nav=document.querySelector('#navigation');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');nav.classList.toggle('open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a')){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');toggle.focus();}});
const config=window.SITE;
function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
const lineUrl=safeUrl(config.lineUrl),marketUrl=safeUrl(config.marketUrl);
const phoneHref='tel:'+config.phone.replace(/[^0-9+]/g,'');
document.querySelectorAll('[data-phone]').forEach(a=>{a.href=phoneHref;if(a.textContent!=='電話')a.textContent=config.phone;});
document.querySelectorAll('[data-email]').forEach(a=>{a.href='mailto:'+config.email;if(!a.classList.contains('button'))a.textContent=config.email;});
document.querySelectorAll('[data-email-text]').forEach(e=>{e.textContent=config.email;});
if(lineUrl){document.querySelectorAll('[data-line]').forEach(a=>{a.href=lineUrl;a.textContent=a.closest('.mobile-contact')?'LINE':'LINEで相談';});const direct=document.querySelector('[data-line-direct]');if(direct){direct.hidden=false;direct.href=lineUrl;document.querySelector('[data-line-status]').textContent='写真を添えて、お気軽にご相談ください。';}}
if(marketUrl){document.querySelectorAll('[data-market]').forEach(a=>{a.href=marketUrl;a.textContent='店舗ページを見る';});const direct=document.querySelector('[data-market-direct]');if(direct){direct.hidden=false;direct.href=marketUrl;document.querySelector('[data-market-status]').textContent='店舗ページはこちらからご覧いただけます。';}}
if(config.logoUrl){document.querySelectorAll('.logo-slot').forEach(slot=>{const img=document.createElement('img');img.addEventListener('error',()=>{slot.textContent='LOGO';slot.setAttribute('aria-label','既存ロゴの掲載準備中');slot.style.border='';},{once:true});img.src=config.logoUrl;img.alt='月輪合同会社 ロゴ';slot.replaceChildren(img);slot.removeAttribute('aria-label');slot.style.border='none';});}
document.querySelectorAll('[data-price]').forEach(e=>{e.textContent=config.price;});
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
// WORKS accepts real photo paths only; AI/illustration or unclassified entries stay placeholders.
const realPhotoPath=value=>typeof value==='string' && /^assets\/images\/works\/real\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:webp|avif|jpe?g|png)$/i.test(value);
const hasRealPhotos=w=>w.imageType==='real' && w.placeholder===false && realPhotoPath(w.before) && realPhotoPath(w.after);
function renderWork(w){
  const published=hasRealPhotos(w);
  const article=el('article',null,'work');
  article.dataset.imageType=published?'real':'placeholder';
  const pair=el('div',null,'comparison');
  [['BEFORE',w.before],['AFTER',w.after]].forEach(([label,src])=>{
    const figure=el('figure');const img=el('img');
    img.src=published?src:'assets/images/works/placeholders/real-photo.svg';
    img.alt=published?`${w.title} ${label}の実際の施工写真`:`${w.title} ${label} 実際の施工写真を掲載予定`;
    img.width=800;img.height=600;img.loading='lazy';
    // Missing photos return the whole case to a clear preparation state.
    if(published)img.addEventListener('error',()=>{if(article.parentNode)article.replaceWith(renderWork({...w,placeholder:true}));},{once:true});
    figure.append(img,el('figcaption',label));pair.append(figure);
  });
  const heading=el('div',null,'work-heading');heading.append(el('h3',w.title),el('span',published?'実際の施工写真':'写真掲載予定','badge'));
  const dl=el('dl');
  [['地区',published?w.area:'公開準備中'],['物件',published?w.propertyType:'公開準備中'],['施工内容',w.content]].forEach(([t,d])=>dl.append(el('dt',t),el('dd',d)));
  article.append(pair,heading,dl,el('p',published?w.description:'実際の施工写真・詳細は、掲載準備が整い次第ご紹介します。'));
  return article;
}
document.querySelectorAll('[data-works]').forEach(grid=>{config.works.forEach(w=>grid.append(renderWork(w)));});
const form=document.querySelector('#contact-form');
if(form){const service=new URLSearchParams(location.search).get('service');if([...form.elements.service.options].some(o=>o.value===service))form.elements.service.value=service;
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const values=new FormData(form);const body=`お名前：${values.get('name')}\nメール：${values.get('email')}\n電話：${values.get('phone')||'未記入'}\nご相談内容：${values.get('service')}\n\n${values.get('message')}\n\n※写真はメールに添付してください。`;document.querySelector('#mail-preview').textContent=body;document.querySelector('#mail-open').href=`mailto:${config.email}?subject=${encodeURIComponent('内装工事のご相談・お見積り')}&body=${encodeURIComponent(body)}`;document.querySelector('#mail-confirm').hidden=false;document.querySelector('#mail-confirm').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
form.addEventListener('input',()=>{document.querySelector('#mail-confirm').hidden=true;document.querySelector('#mail-open').removeAttribute('href');});}
