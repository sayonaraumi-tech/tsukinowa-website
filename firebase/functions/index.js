// Runs with the isolated project's managed identity; no private key files needed.
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
initializeApp();
const { photoHandler } = require('./photo-handler');
exports.workPhoto = onRequest({ region: 'asia-northeast1', maxInstances: 3, concurrency: 10, timeoutSeconds: 30, invoker: 'public', cors: ['https://sayonaraumi-tech.github.io'] },
  photoHandler({
    getWork: async id => {
      const snapshot = await getFirestore().doc(`works/${id}`).get();
      return snapshot.exists ? snapshot.data() : null;
    },
    getPhoto: async path => {
      const file = getStorage().bucket().file(path);
      const [metadata] = await file.getMetadata();
      if (Number(metadata.size) > 5 * 1024 * 1024 || !['image/webp', 'image/jpeg'].includes(metadata.contentType)) throw new Error('Invalid photo');
      const [bytes] = await file.download();
      return { bytes, type: metadata.contentType };
    }
  }));
