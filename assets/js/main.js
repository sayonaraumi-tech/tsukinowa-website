const toggle=document.querySelector('.menu-toggle'); const nav=document.querySelector('#navigation');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');nav.classList.toggle('open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a')){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');toggle.focus();}});
const config=window.SITE;
function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
const lineUrl=safeUrl(config.lineUrl);
const phoneHref='tel:'+config.phone.replace(/[^0-9+]/g,'');
document.querySelectorAll('[data-phone]').forEach(a=>{a.href=phoneHref;if(a.textContent!=='電話')a.textContent=config.phone;});
document.querySelectorAll('[data-email]').forEach(a=>{a.href='mailto:'+config.email;if(!a.classList.contains('button'))a.textContent=config.email;});
document.querySelectorAll('[data-email-text]').forEach(e=>{e.textContent=config.email;});
if(lineUrl){document.querySelectorAll('[data-line-pending]').forEach(e=>e.hidden=true);document.querySelectorAll('[data-line]').forEach(a=>{a.href=lineUrl;a.textContent=a.dataset.lineLabel||(a.closest('.mobile-contact')?'LINE':'LINEで相談');});const direct=document.querySelector('[data-line-direct]');if(direct){direct.hidden=false;direct.href=lineUrl;document.querySelector('[data-line-status]').textContent='写真を添えて、お気軽にご相談ください。';}}
if(config.logoUrl){document.querySelectorAll('.logo-slot').forEach(slot=>{const img=document.createElement('img');img.addEventListener('error',()=>{slot.replaceChildren();},{once:true});img.src=config.logoUrl;img.alt='月輪合同会社 ロゴ';slot.replaceChildren(img);slot.setAttribute('aria-hidden','true');});}
document.querySelectorAll('[data-price]').forEach(e=>{e.textContent=config.price;});
const form=document.querySelector('#contact-form');
if(form){const service=new URLSearchParams(location.search).get('service');if([...form.elements.service.options].some(o=>o.value===service))form.elements.service.value=service;
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const values=new FormData(form);const body=`お名前：${values.get('name')}\nメール：${values.get('email')}\n電話：${values.get('phone')||'未記入'}\nご相談内容：${values.get('service')}\n\n${values.get('message')}\n\n※写真はメールに添付してください。`;document.querySelector('#mail-preview').textContent=body;document.querySelector('#mail-open').href=`mailto:${config.email}?subject=${encodeURIComponent('内装工事のご相談・お見積り')}&body=${encodeURIComponent(body)}`;document.querySelector('#mail-confirm').hidden=false;document.querySelector('#mail-confirm').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
form.addEventListener('input',()=>{document.querySelector('#mail-confirm').hidden=true;document.querySelector('#mail-open').removeAttribute('href');});}
