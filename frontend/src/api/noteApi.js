import { supabase } from './supabaseClient'

const TABLE = 'encrypted_notes'

const notFoundError = () => {
  const err = new Error('Note not found')
  err.code = 'PGRST116'
  return err
}

export async function getNote(noteId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('ciphertext, iv, salt')
    .eq('note_path', noteId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw notFoundError()
  return data
}

export async function saveNote(noteId, payload) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { note_path: noteId, ciphertext: payload.ciphertext, iv: payload.iv, salt: payload.salt },
      { onConflict: 'note_path' }
    )
  if (error) throw error
  return { status: 'saved' }
}

export async function deleteNote(noteId) {
  const { error } = await supabase.from(TABLE).delete().eq('note_path', noteId)
  if (error) {
    console.error('Failed to delete note', error)
  }
}
