import { supabase } from './supabaseClient'
import {
  getCachedRow,
  saveCachedNote,
  deleteCachedNote,
  queueDeletion,
  getPendingNotes,
  SYNCED_TEXT,
  SYNCED_PENDING,
} from '../db/noteStore'
import { useSyncStore } from '../hooks/useSync'

const TABLE = 'encrypted_notes'

const notFoundError = () => {
  const err = new Error('Note not found')
  err.code = 'PGRST116'
  return err
}

const offlineError = () => {
  const err = new Error('You need to be online to open a note you have not opened before.')
  err.code = 'OFFLINE'
  return err
}

async function fetchUpdatedAt(noteId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('updated_at')
    .eq('note_path', noteId)
    .maybeSingle()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data ? data.updated_at : null
}

async function fetchFullNote(noteId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('ciphertext, iv, salt, updated_at')
    .eq('note_path', noteId)
    .maybeSingle()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  if (!data) return null
  return {
    ciphertext: data.ciphertext,
    iv: data.iv,
    salt: data.salt,
    updated_at: data.updated_at,
  }
}

function toCacheRow(noteId, data, { synced }) {
  return {
    note_path: noteId,
    ciphertext: data.ciphertext,
    iv: data.iv,
    salt: data.salt,
    updated_at: data.updated_at || null,
    synced,
    saved_at: Date.now(),
  }
}

export async function getNote(noteId) {
  const cached = await getCachedRow(noteId)

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  if (isOffline) {
    if (cached && !cached.deleted) {
      return { ciphertext: cached.ciphertext, iv: cached.iv, salt: cached.salt, updated_at: cached.updated_at }
    }
    throw offlineError()
  }

  let remoteUpdatedAt
  try {
    remoteUpdatedAt = await fetchUpdatedAt(noteId)
  } catch {
    if (cached && !cached.deleted) {
      return { ciphertext: cached.ciphertext, iv: cached.iv, salt: cached.salt, updated_at: cached.updated_at }
    }
    throw offlineError()
  }

  if (remoteUpdatedAt === null) {
    if (cached && !cached.deleted && cached.synced === SYNCED_PENDING) {
      return { ciphertext: cached.ciphertext, iv: cached.iv, salt: cached.salt, updated_at: cached.updated_at }
    }
    await deleteCachedNote(noteId).catch(() => {})
    throw notFoundError()
  }

  if (cached && cached.deleted) {
    throw notFoundError()
  }

  if (cached && cached.synced === SYNCED_PENDING) {
    syncPendingNotes()
    return { ciphertext: cached.ciphertext, iv: cached.iv, salt: cached.salt, updated_at: cached.updated_at }
  }

  if (cached && cached.updated_at === remoteUpdatedAt) {
    return { ciphertext: cached.ciphertext, iv: cached.iv, salt: cached.salt, updated_at: cached.updated_at }
  }

  const fresh = await fetchFullNote(noteId)
  if (!fresh) {
    throw notFoundError()
  }
  await saveCachedNote(toCacheRow(noteId, fresh, { synced: SYNCED_TEXT }))
  return fresh
}

export async function saveNote(noteId, payload) {
  await saveCachedNote(toCacheRow(noteId, payload, { synced: SYNCED_PENDING }))
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        { note_path: noteId, ciphertext: payload.ciphertext, iv: payload.iv, salt: payload.salt },
        { onConflict: 'note_path' }
      )
    if (error) throw error
    const updatedAt = await fetchUpdatedAt(noteId).catch(() => null)
    await saveCachedNote(toCacheRow(noteId, { ...payload, updated_at: updatedAt }, { synced: SYNCED_TEXT }))
    return { status: 'saved' }
  } catch {
    return { status: 'queued' }
  }
}

export async function deleteNote(noteId) {
  await deleteCachedNote(noteId).catch(() => {})
  try {
    const { error } = await supabase.from(TABLE).delete().eq('note_path', noteId)
    if (error) throw error
  } catch {
    await queueDeletion(noteId).catch(() => {})
  }
}

export async function syncPendingNotes() {
  const pending = await getPendingNotes()
  if (!pending.length) return
  useSyncStore.getState().setSyncing(true)
  try {
    for (const row of pending) {
      try {
        if (row.deleted) {
          const { error } = await supabase.from(TABLE).delete().eq('note_path', row.note_path)
          if (error) throw error
          await deleteCachedNote(row.note_path)
        } else {
          const { error } = await supabase
            .from(TABLE)
            .upsert(
              { note_path: row.note_path, ciphertext: row.ciphertext, iv: row.iv, salt: row.salt },
              { onConflict: 'note_path' }
            )
          if (error) throw error
          const updatedAt = await fetchUpdatedAt(row.note_path).catch(() => null)
          await saveCachedNote(toCacheRow(row.note_path, row, { synced: updatedAt !== null ? SYNCED_TEXT : SYNCED_PENDING }))
        }
      } catch {
        // keep row pending for the next sync attempt
      }
    }
  } finally {
    useSyncStore.getState().setSyncing(false)
  }
}