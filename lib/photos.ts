// ── Worksheet photo store (on-device only) ──
// The ONE narrow exception to "never capture photos" — see CLAUDE.md
// Privacy & COPPA rule 4 before touching this file. Photos of a
// completed printable worksheet are stored ONLY in this browser's
// IndexedDB. Nothing here ever calls fetch/XHR — there is no network
// path for an image to leave the device. Gated by family.photoConsent,
// wiped by deleteChildAndData/deleteEverything in lib/family.ts.

const DB_NAME = 'kailia_worksheet_photos';
const STORE = 'photos';
const DB_VERSION = 1;

export interface WorksheetPhoto {
  worksheetId: string;
  blob: Blob;
  takenAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'worksheetId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Shrinks the photo before storing it — plenty for "is this traced?"
// review, and keeps on-device storage small.
function downscale(file: File, maxDim = 700): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas context')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => {
        URL.revokeObjectURL(url);
        if (b) resolve(b); else reject(new Error('toBlob failed'));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

export async function savePhoto(worksheetId: string, file: File): Promise<void> {
  const blob = await downscale(file);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ worksheetId, blob, takenAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getPhoto(worksheetId: string): Promise<WorksheetPhoto | null> {
  const db = await openDb();
  const result = await new Promise<WorksheetPhoto | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(worksheetId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function getAllPhotos(): Promise<WorksheetPhoto[]> {
  const db = await openDb();
  const result = await new Promise<WorksheetPhoto[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function deletePhoto(worksheetId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(worksheetId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// Full wipe — called by lib/family.ts on child/account deletion.
export async function deleteAllPhotos(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* if the store doesn't exist yet, there's nothing to delete */ }
}
