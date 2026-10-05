(() => {
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const validId = id => typeof id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(id);
  // Explicit provenance AND the case's own real-photo paths are required.
  // This guard prevents accidental mixing; maintainers still verify photo provenance.
  const isPublishedReal = work => work && validId(work.id) && work.published === true &&
    work.imageType === 'real' && typeof work.title === 'string' && typeof work.category === 'string' &&
    (work.source === 'firebase' ?
      window.WORKS_MODEL.imagePath(work.id, 'before', work.beforeImage) && window.WORKS_MODEL.imagePath(work.id, 'after', work.afterImage) :
      work.beforeImage === `assets/images/works/real/${work.id}/before.webp` && work.afterImage === `assets/images/works/real/${work.id}/after.webp`);
  const dateKey = value => {
    if (value?.toDate) return value.toDate().toISOString();
    if (typeof value !== 'string') return '';
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return `${value}-01`;
    if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return value;
    return '';
  };
  const publishedWorks = data => {
    const ids = new Set();
    return (Array.isArray(data) ? data : []).filter(work => {
      if (!isPublishedReal(work) || ids.has(work.id)) return false;
      ids.add(work.id);
      return true;
    }).sort((a, b) => {
      const key = work => work.source === 'firebase' ? (dateKey(work.publishedAt) || dateKey(work.date)) : (dateKey(work.date) || dateKey(work.publishedAt));
      return key(b).localeCompare(key(a)) || dateKey(b.publishedAt).localeCompare(dateKey(a.publishedAt)) || a.id.localeCompare(b.id);
    });
  };
  window.WORKS = { publishedWorks }; // Shared selection rule for both pages and validation.
  let imageReader;
  let generation = 0;
  const blobURLs = new Set();
  const clearImages = () => { blobURLs.forEach(url => URL.revokeObjectURL(url)); blobURLs.clear(); };
  let works = [];
  let revealCurrent = () => {};
  let activeCategory = '';
  const redraws = [];
  function renderWork(work, preview) {
    const article = node('article', null, 'work');
    article.id = work.id;
    article.dataset.imageType = 'real';
    article.dataset.category = work.category;
    const pair = node('div', null, 'comparison');
    [['BEFORE', work.beforeImage], ['AFTER', work.afterImage]].forEach(([label, src]) => {
      const figure = node('figure');
      const image = node('img');
      image.alt = `${work.title} ${label}の実際の施工写真`;
      image.width = 800;
      image.height = 600;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        // Remove the incomplete pair: never substitute an illustration or fake After.
        pair.replaceChildren(node('p', '写真を確認中です。', 'notice'));
      }, { once: true });
      if (work.source === 'firebase') {
        const current = generation;
        imageReader(src).then(blob => {
          if (current !== generation || !image.isConnected) return;
          const url = URL.createObjectURL(blob); blobURLs.add(url); image.src = url;
        }).catch(() => { if (current === generation && pair.isConnected) pair.replaceChildren(node('p', '写真を読み込めませんでした。ページを再読み込みしてください。', 'notice')); });
      } else image.src = src;
      figure.append(image, node('figcaption', label));
      pair.append(figure);
    });
    const heading = node('div', null, 'work-heading');
    const title = node('h3');
    if (preview) {
      const link = node('a', work.title);
      link.href = `works.html#${work.id}`;
      title.append(link);
    } else title.textContent = work.title;
    heading.append(title);
    const tags = node('div', null, 'work-tags');
    tags.append(node('span', work.category, 'work-tag'));
    if (preview) {
      const link = node('a', null, 'work-preview-link');
      link.href = `works.html#${work.id}`;
      link.setAttribute('aria-label', `${work.title}の施工事例を見る`);
      link.append(pair);
      article.append(link, heading, tags);
    } else {
      article.append(pair, heading, tags);
      const details = node('dl');
      [['施工年月', dateKey(work.date) ? work.date : ''], ['地区', work.area], ['物件', work.propertyType]].forEach(([label, value]) => {
        if (value) details.append(node('dt', label), node('dd', value));
      });
      if (details.childElementCount) article.append(details);
      if (work.description) article.append(node('p', work.description));
    }
    return article;
  }
  document.querySelectorAll('[data-works]').forEach(grid => {
    const preview = grid.hasAttribute('data-work-preview');
    const draw = category => {
      const visible = preview ? works.slice(0, 4) : works;
      const selected = category ? visible.filter(work => work.category === category) : visible;
      grid.replaceChildren(...selected.map(work => renderWork(work, preview)));
      if (!selected.length) grid.append(node('p', '施工写真は掲載準備中です。', 'notice'));
    };
    const filters = !preview && document.querySelector('[data-work-filters]');
    const update = () => {
      if (filters) {
        filters.replaceChildren();
        const categories = ['', ...new Set(works.map(work => work.category))];
        if (!categories.includes(activeCategory)) activeCategory = '';
        categories.forEach(category => {
          const button = node('button', category || 'すべて', 'work-filter');
          button.type = 'button';
          button.setAttribute('aria-pressed', String(category === activeCategory));
          button.addEventListener('click', () => {
            activeCategory = category; clearImages(); generation++;
            filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            draw(category);
          });
          filters.append(button);
        });
      }
      draw(preview ? '' : activeCategory);
    };
    redraws.push(update);
    if (!preview) {
      const reveal = () => {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        if (!works.some(work => work.id === id)) return;
        activeCategory = ''; update();
        document.getElementById(id)?.scrollIntoView();
      };
      revealCurrent = reveal;
      window.addEventListener('hashchange', reveal);
    }
  });
  function display(data, reader) {
    generation++; clearImages(); imageReader = reader;
    works = publishedWorks(data);
    redraws.forEach(draw => draw()); revealCurrent();
  }
  const fallback = () => display(window.WORKS_DATA);
  if (!window.FIREBASE_WORKS_CONFIG) { fallback(); return; }
  document.querySelectorAll('[data-works]').forEach(grid => grid.append(node('p', '施工写真を読み込み中です。', 'notice')));
  let remoteReceived = false;
  // Historical local cases are only a startup/offline fallback, never merged into live data.
  const timer = setTimeout(() => { if (!remoteReceived) fallback(); }, 8000);
  import('./firebase-works.js').then(async api => {
    if (!api.configured()) { clearTimeout(timer); fallback(); return; }
    await api.watchPublished(data => {
      clearTimeout(timer); remoteReceived = true; display(data, api.publicImageBlob);
    }, () => {
      clearTimeout(timer);
      if (!remoteReceived) fallback();
      else display([]); // Do not resurrect deleted/unpublished local cases after a live session.
    });
  }).catch(() => { clearTimeout(timer); if (!remoteReceived) fallback(); });
})();
