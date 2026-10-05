(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  // No endpoint in the Pages preview. XServer migration must replace this guard.
  form.addEventListener('submit', event => event.preventDefault());
  const input = form.querySelector('#photos');
  const previews = form.querySelector('#photo-previews');
  const status = form.querySelector('#photo-status');
  const urls = new Set();
  const clear = () => {
    urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); previews.replaceChildren();
  };
  input.addEventListener('change', () => {
    clear(); status.textContent = ''; input.setCustomValidity('');
    const files = Array.from(input.files);
    if (files.length > 5 || files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      status.textContent = 'JPEG・PNG・WebPを5枚まで、各10MB以内でお選びください。';
      input.value = ''; return;
    }
    files.forEach(file => {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      const caption = document.createElement('figcaption');
      const url = URL.createObjectURL(file); urls.add(url);
      img.alt = `添付写真のプレビュー：${file.name}`; img.src = url;
      img.addEventListener('error', () => {
        img.remove(); caption.textContent = `${file.name}：プレビューできません。別の写真をお選びください。`;
        URL.revokeObjectURL(url); urls.delete(url);
      }, { once: true });
      caption.textContent = file.name; figure.append(img, caption); previews.append(figure);
    });
    if (files.length) status.textContent = `${files.length}枚を選択しました（未送信）。`;
  });
  form.addEventListener('reset', () => { clear(); status.textContent = ''; });
  window.addEventListener('pagehide', clear);
})();
