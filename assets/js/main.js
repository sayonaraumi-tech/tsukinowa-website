const toggle=document.querySelector('.menu-toggle'); const nav=document.querySelector('#navigation');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');nav.classList.toggle('open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a')){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');toggle.focus();}});
const config=window.SITE;
function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
const lineUrl=safeUrl(config.lineUrl);
const phoneHref='tel:'+config.phone;
document.querySelectorAll('[data-phone]').forEach(a=>{a.href=phoneHref;if(a.textContent!=='電話')a.textContent=config.phone;});
document.querySelectorAll('[data-email]').forEach(a=>{a.href='mailto:'+config.email;if(!a.classList.contains('button'))a.textContent=config.email;});
document.querySelectorAll('[data-email-text]').forEach(e=>{e.textContent=config.email;});
if(lineUrl){document.querySelectorAll('[data-line-pending]').forEach(e=>e.hidden=true);document.querySelectorAll('[data-line]').forEach(a=>{a.href=lineUrl;a.textContent=a.dataset.lineLabel||(a.closest('.mobile-contact')?'LINE':'LINEで相談');});const direct=document.querySelector('[data-line-direct]');if(direct){direct.hidden=false;direct.href=lineUrl;document.querySelector('[data-line-status]').textContent='写真を添えて、お気軽にご相談ください。';}}
if(config.logoUrl){document.querySelectorAll('.logo-slot').forEach(slot=>{const img=document.createElement('img');img.addEventListener('error',()=>{slot.replaceChildren();},{once:true});img.src=config.logoUrl;img.alt='月輪合同会社 ロゴ';slot.replaceChildren(img);slot.setAttribute('aria-hidden','true');});}
document.querySelectorAll('[data-price]').forEach(e=>{e.textContent=config.price;});

const qrPath = typeof config.lineQrImage === 'string' && /^assets\/images\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|svg)$/.test(config.lineQrImage) ? config.lineQrImage : null;
const qrImage = document.querySelector('[data-line-qr-image]');
if (qrPath && qrImage) {
  const placeholder = document.querySelector('[data-line-qr-placeholder]');
  qrImage.addEventListener('load', () => { qrImage.hidden = false; placeholder.hidden = true; });
  qrImage.addEventListener('error', () => { qrImage.hidden = true; placeholder.hidden = false; });
  qrImage.src = qrPath;
}
