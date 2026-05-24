import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export async function getNote(noteId) {
  const { data } = await api.get(`/notes/${encodeURIComponent(noteId)}/`)
  return data
}

export async function saveNote(noteId, payload) {
  const { data } = await api.post(`/notes/${encodeURIComponent(noteId)}/`, payload)
  return data
}

export async function deleteNote(noteId) {
  try {
    await api.delete(`/notes/${encodeURIComponent(noteId)}/`)
  } catch {
    // ignore — note may not exist on server
  }
}
