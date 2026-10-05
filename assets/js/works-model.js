// Shared validation; security rules independently enforce the stored schema.
(() => {
  const categories = ['壁面補修', 'ドア補修', 'クロス', 'CF・床', '原状回復', 'その他'];
  const validId = id => typeof id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(id);
  const imagePath = (id, side, path) => validId(id) && typeof path === 'string' &&
    new RegExp(`^works/${id}/${side}-[a-zA-Z0-9-]+\\.(webp|jpg)$`).test(path);
  function validate(work, publish = false) {
    if (!work.title?.trim() || work.title.length > 120) throw new Error('タイトルを120文字以内で入力してください。');
    if (!categories.includes(work.category)) throw new Error('カテゴリーを選択してください。');
    if (work.date && !/^\d{4}-(0[1-9]|1[0-2])$/.test(work.date)) throw new Error('施工年月を確認してください。');
    for (const [field, max] of [['area', 120], ['propertyType', 120], ['description', 3000]]) {
      if (typeof work[field] !== 'string' || work[field].length > max) throw new Error(`${field}の文字数を確認してください。`);
    }
    if (publish && (!work.beforeImage || !work.afterImage)) throw new Error('公開には Before と After の両方が必要です。');
  }
  window.WORKS_MODEL = { categories, validId, imagePath, validate };
})();
