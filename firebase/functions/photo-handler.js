// Public response contains only image bytes, never Storage metadata or download tokens.
exports.photoHandler = ({ getWork, getPhoto }) => async (req, res) => {
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.status(405).send('Method not allowed'); return; }
  const { id, side } = req.query;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id) || !['before', 'after'].includes(side)) {
    res.status(400).send('Invalid photo'); return;
  }
  try {
    const work = await getWork(id);
    const path = work?.[`${side}Image`];
    if (!work || work.published !== true || work.imageType !== 'real' || typeof path !== 'string' ||
      !new RegExp(`^works/${id}/${side}-[a-zA-Z0-9-]+\\.(webp|jpg)$`).test(path)) {
      res.status(404).send('Photo unavailable'); return;
    }
    const photo = await getPhoto(path);
    // Check again after file I/O to avoid serving a case withdrawn during download.
    const current = await getWork(id);
    if (!current || current.published !== true || current.imageType !== 'real' || current[`${side}Image`] !== path) {
      res.status(404).send('Photo unavailable'); return;
    }
    res.type(photo.type).status(200).send(photo.bytes);
  } catch { res.status(404).send('Photo unavailable'); }
};
