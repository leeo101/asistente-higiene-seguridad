const DB_NAME = 'AsistenteHysDB';
const STORE_NAME = 'pdfBlobs';
const DB_VERSION = 1;

/**
 * Initializes the IndexedDB database.
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

/**
 * Saves a PDF Blob to IndexedDB for permanent storage.
 * @param id The checklist ID to associate with the PDF.
 * @param blob The generated PDF Blob.
 */
export async function savePdfBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, `pdf_${id}`);

      request.onsuccess = () => resolve();
      request.onerror = (event: any) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Error saving PDF to IndexedDB:', err);
    throw err;
  }
}

/**
 * Retrieves a previously saved PDF Blob from IndexedDB.
 * @param id The checklist ID.
 * @returns The PDF Blob, or null if not found.
 */
export async function getPdfBlob(id: string): Promise<Blob | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`pdf_${id}`);

      request.onsuccess = (event: any) => {
        const result = event.target.result;
        resolve(result instanceof Blob ? result : null);
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Error retrieving PDF from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a PDF Blob from IndexedDB.
 * @param id The checklist ID.
 */
export async function deletePdfBlob(id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(`pdf_${id}`);

      request.onsuccess = () => resolve();
      request.onerror = (event: any) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Error deleting PDF from IndexedDB:', err);
    throw err;
  }
}
