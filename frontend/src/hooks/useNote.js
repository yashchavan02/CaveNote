import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNote, saveNote, deleteNote } from '../api/noteApi'
import { encrypt, decrypt } from './useCrypto'
import { useSyncStore } from './useSync'
import { getCachedRow, SYNCED_TEXT } from '../db/noteStore'
import { emptyDocument, parseDocument, serializeDocument, sanitizeDocument, createPage, MAX_PAGES } from '../utils/document'

export function useNote() {
  const { noteName } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(() => emptyDocument())
  const [activePageId, setActivePageId] = useState(null)
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

  const activePage = document.pages.find((p) => p.id === activePageId) || document.pages[0]
  const plaintext = activePage ? activePage.content : ''

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
    if (!noteName) return
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
              const doc = parseDocument(prefill)
              setDocument(doc)
              setActivePageId(doc.pages[0].id)
              setStatus('unsaved')
            } else {
              setActivePageId(document.pages[0].id)
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
      const doc = parseDocument(text)
      setDocument(doc)
      setActivePageId(doc.pages[0].id)
      setPassword(pw)
      setLocked(false)
    } catch {
      throw new Error('Wrong password')
    }
  }, [encryptedData])

  const saveEncrypted = useCallback(async (pw) => {
    setStatus('saving')
    setError(null)
    try {
      const payload = await encrypt(serializeDocument(sanitizeDocument(document)), pw)
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
  }, [document, noteName])

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
    setDocument(emptyDocument())
    setActivePageId(null)
    setPassword('')
    setLocked(true)
    setStatus('idle')
  }, [])

  const updatePlaintext = useCallback((text) => {
    setDocument((doc) => {
      const targetId = activePageId || doc.pages[0].id
      return {
        ...doc,
        pages: doc.pages.map((p) => (p.id === targetId ? { ...p, content: text } : p)),
      }
    })
    setStatus('unsaved')
  }, [activePageId])

  const addPage = useCallback(() => {
    if (document.pages.length >= MAX_PAGES) return
    const page = createPage()
    setDocument((doc) => ({ ...doc, pages: [...doc.pages, page] }))
    setActivePageId(page.id)
    setStatus('unsaved')
  }, [document.pages.length])

  const removePage = useCallback((id) => {
    if (document.pages.length <= 1) return
    const index = document.pages.findIndex((p) => p.id === id)
    const pages = document.pages.filter((p) => p.id !== id)
    setDocument({ ...document, pages })
    if (activePageId === id) {
      const neighbor = pages[Math.min(index, pages.length - 1)]
      setActivePageId(neighbor ? neighbor.id : null)
    }
    setStatus('unsaved')
  }, [document, activePageId])

  const selectPage = useCallback((id) => {
    setActivePageId(id)
  }, [])

  return {
    noteName,
    document,
    pages: document.pages,
    activePageId,
    plaintext,
    setPlaintext: updatePlaintext,
    addPage,
    removePage,
    selectPage,
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