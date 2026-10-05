export async function compressImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPEG・PNG・WebP の写真を選択してください。HEIC は JPEG に変換してください。');
  if (file.size > 30 * 1024 * 1024) throw new Error('30MB 以下の写真を選択してください。');
  let bitmap;
  // Modern browsers apply EXIF orientation while decoding. Do not rotate a second time.
  if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  else {
    const url = URL.createObjectURL(file);
    try {
      bitmap = new Image(); bitmap.src = url; await bitmap.decode();
    } finally { URL.revokeObjectURL(url); }
  }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encode = type => new Promise(resolve => canvas.toBlob(resolve, type, 0.82));
    let blob = await encode('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error('写真を小さくして再度選択してください。');
    return blob;
  } finally { bitmap.close?.(); }
}
