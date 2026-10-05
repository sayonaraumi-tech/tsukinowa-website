(() => {
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const validId = id => typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
  // Explicit provenance AND the case's own real-photo paths are required.
  // This guard prevents accidental mixing; maintainers still verify photo provenance.
  const isPublishedReal = work => work && validId(work.id) && work.published === true &&
    work.imageType === 'real' && typeof work.title === 'string' && typeof work.category === 'string' &&
    work.beforeImage === `assets/images/works/real/${work.id}/before.webp` &&
    work.afterImage === `assets/images/works/real/${work.id}/after.webp`;
  const dateKey = value => {
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
      const key = work => dateKey(work.date) || dateKey(work.publishedAt);
      return key(b).localeCompare(key(a)) || dateKey(b.publishedAt).localeCompare(dateKey(a.publishedAt)) || a.id.localeCompare(b.id);
    });
  };
  window.WORKS = { publishedWorks }; // Shared selection rule for both pages and validation.
  const works = publishedWorks(window.WORKS_DATA);
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
      image.src = src;
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
    const visible = preview ? works.slice(0, 4) : works;
    const draw = category => {
      const selected = category ? visible.filter(work => work.category === category) : visible;
      grid.replaceChildren(...selected.map(work => renderWork(work, preview)));
      if (!selected.length) grid.append(node('p', '施工写真は掲載準備中です。', 'notice'));
    };
    draw('');
    if (!preview) {
      const filters = document.querySelector('[data-work-filters]');
      if (filters && works.length) {
        const categories = ['', ...new Set(works.map(work => work.category))];
        categories.forEach(category => {
          const button = node('button', category || 'すべて', 'work-filter');
          button.type = 'button';
          button.setAttribute('aria-pressed', String(!category));
          button.addEventListener('click', () => {
            filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            draw(category);
          });
          filters.append(button);
        });
      }
      // Deferred rendering has finished; restore direct links to newly created anchors.
      const reveal = () => {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        if (!works.some(work => work.id === id)) return;
        draw('');
        if (filters) filters.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === 0)));
        document.getElementById(id)?.scrollIntoView();
      };
      reveal();
      window.addEventListener('hashchange', reveal);
    }
  });
})();
