import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNote, saveNote, deleteNote } from '../api/noteApi'
import { encrypt, decrypt } from './useCrypto'
import { useSyncStore } from './useSync'
import { getCachedRow, SYNCED_TEXT } from '../db/noteStore'

export function useNote() {
  const { noteName } = useParams()
  const navigate = useNavigate()
  const [plaintext, setPlaintext] = useState('')
  const [password, setPassword] = useState('')
  const [locked, setLocked] = useState(true)
  const [exists, setExists] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [encryptedData, setEncryptedData] = useState(null)
  const syncing = useSyncStore((s) => s.syncing)
  const prevSyncing = useRef(false)

  useEffect(() => {
    if (!prevSyncing.current || syncing) {
      prevSyncing.current = syncing
      return
    }
    prevSyncing.current = false
    if (status !== 'queued') return
    let cancelled = false
    ;(async () => {
      try {
        const row = await getCachedRow(noteName)
        if (!cancelled && row && row.synced === SYNCED_TEXT) setStatus('saved')
      } catch {
        // keep showing 'Saved locally'
      }
    })()
    return () => { cancelled = true }
  }, [syncing, status, noteName])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getNote(noteName)
        if (!cancelled) {
          setExists(true)
          setEncryptedData(data)
        }
      } catch (err) {
        if (!cancelled) {
          if (err.code === 'PGRST116') {
            setExists(false)
            setLocked(false)
            const prefill = localStorage.getItem('cavenote-prefill')
            if (prefill) {
              localStorage.removeItem('cavenote-prefill')
              setPlaintext(prefill)
              setStatus('unsaved')
            }
          } else if (err.code === 'OFFLINE') {
            setError(err.message)
          } else {
            setError('Failed to load this note.')
          }
        }
      }
    })()
    return () => { cancelled = true }
  }, [noteName])

  useEffect(() => {
    setCharCount(plaintext.length)
    setWordCount(plaintext.trim() ? plaintext.trim().split(/\s+/).length : 0)
  }, [plaintext])

  const handleDecrypt = useCallback(async (pw) => {
    if (!encryptedData) return
    setError(null)
    try {
      const text = await decrypt(
        encryptedData.ciphertext,
        encryptedData.iv,
        encryptedData.salt,
        pw
      )
      setPassword(pw)
      setPlaintext(text)
      setLocked(false)
    } catch {
      throw new Error('Wrong password')
    }
  }, [encryptedData])

  const saveEncrypted = useCallback(async (pw) => {
    setStatus('saving')
    setError(null)
    try {
      const payload = await encrypt(plaintext, pw)
      const result = await saveNote(noteName, payload)
      setPassword(pw)
      setExists(true)
      setShowSavePrompt(false)
      setStatus(result.status)
      return true
    } catch {
      setStatus('error')
      setError('Failed to save')
      return false
    }
  }, [plaintext, noteName])

  const handleSave = useCallback(() => {
    if (password) {
      saveEncrypted(password)
    } else {
      setShowSavePrompt(true)
    }
  }, [password, saveEncrypted])

  const handleDelete = useCallback(async () => {
    await deleteNote(noteName)
    navigate('/', { replace: true })
  }, [noteName, navigate])

  const handleChangePassword = useCallback(async (newPw) => {
    setShowChangePassword(false)
    await saveEncrypted(newPw)
  }, [saveEncrypted])

  const handleLock = useCallback(() => {
    setPlaintext('')
    setPassword('')
    setLocked(true)
    setStatus('idle')
  }, [])

  const updatePlaintext = useCallback((text) => {
    setPlaintext(text)
    setStatus('unsaved')
  }, [])

  return {
    noteName,
    plaintext,
    setPlaintext: updatePlaintext,
    password,
    locked,
    exists,
    status,
    error,
    showSavePrompt,
    charCount,
    wordCount,
    setShowSavePrompt,
    showChangePassword,
    setShowChangePassword,
    handleChangePassword,
    handleDecrypt,
    handleSave,
    saveEncrypted,
    handleDelete,
    handleLock,
  }
}
