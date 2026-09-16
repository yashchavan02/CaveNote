const DB_NAME = 'cavenote-db'
const DB_VERSION = 2
const STORE = 'notes'
export const SYNCED_TEXT = '1'
export const SYNCED_PENDING = '0'

let dbPromise = null

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'note_path' }).createIndex('synced', 'synced')
        return
      }
      const store = req.transaction.objectStore(STORE)
      store.getAll().onsuccess = (e) => {
        for (const note of e.target.result) {
          if (typeof note.synced === 'boolean') {
            note.synced = note.synced ? SYNCED_TEXT : SYNCED_PENDING
            store.put(note)
          }
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getDb() {
  if (!dbPromise) dbPromise = openDb()
  return dbPromise
}

function requestResult(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function normalize(note) {
  if (!note || note.deleted) return null
  return note
}

export async function getCachedNote(noteId) {
  const db = await getDb()
  const row = await requestResult(db.transaction(STORE).objectStore(STORE).get(noteId))
  return normalize(row)
}

export async function getCachedRow(noteId) {
  const db = await getDb()
  return requestResult(db.transaction(STORE).objectStore(STORE).get(noteId))
}

export async function saveCachedNote(note) {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite')
    t.objectStore(STORE).put(note)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function deleteCachedNote(noteId) {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite')
    t.objectStore(STORE).delete(noteId)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function queueDeletion(noteId) {
  await saveCachedNote({ note_path: noteId, deleted: true, synced: SYNCED_PENDING })
}

export async function getPendingNotes() {
  const db = await getDb()
  const rows = await requestResult(db.transaction(STORE).objectStore(STORE).index('synced').getAll(SYNCED_PENDING))
  return rows || []
}

export async function getRecentNotes(limit = 8) {
  const db = await getDb()
  const rows = await requestResult(db.transaction(STORE).objectStore(STORE).getAll())
  return (rows || [])
    .filter((r) => !r.deleted && r.saved_at)
    .sort((a, b) => b.saved_at - a.saved_at)
    .slice(0, limit)
}