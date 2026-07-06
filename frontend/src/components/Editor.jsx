import { useState, useEffect, useRef } from 'react'
import { useNote } from '../hooks/useNote'
import { useFontSizeStore } from '../hooks/useFontSize'
import PasswordModal from './PasswordModal'
import TopBar from './TopBar'

export default function Editor() {
  const { size } = useFontSizeStore()
  const [bold, setBold] = useState(false)
  const textareaRef = useRef(null)
  const {
    noteName,
    plaintext,
    setPlaintext,
    password,
    locked,
    exists,
    status,
    error,
    showSavePrompt,
    setShowSavePrompt,
    showChangePassword,
    setShowChangePassword,
    handleChangePassword,
    handleDecrypt,
    handleSave,
    saveEncrypted,
    handleDelete,
    handleLock,
  } = useNote()

  useEffect(() => {
    if (!locked && status === 'unsaved') {
      const handler = (e) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [locked, status])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    if (!locked) {
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [locked, handleSave])

  const handleInsertHR = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const text = plaintext
    const insertion = '\n----------------\n'
    const newText = text.slice(0, start) + insertion + text.slice(textarea.selectionEnd)
    setPlaintext(newText)
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length
      textarea.focus()
    })
  }

  const showLoading = locked && exists === null
  const showDecryptModal = locked && exists === true

  return (
    <>
      <TopBar
        noteName={noteName}
        status={status}
        onLock={handleLock}
        onDelete={handleDelete}
        onSave={handleSave}
        password={password}
        charCount={plaintext.length}
        bold={bold}
        onToggleBold={() => setBold((b) => !b)}
        plaintext={plaintext}
        onChangePassword={() => setShowChangePassword(true)}
        onInsertHR={handleInsertHR}
      />

      {showSavePrompt && (
        <PasswordModal
          mode="save"
          onSubmit={saveEncrypted}
          error={error}
          onClose={() => setShowSavePrompt(false)}
        />
      )}

      {showDecryptModal && (
        <PasswordModal
          mode="decrypt"
          onSubmit={handleDecrypt}
          error={error}
        />
      )}

      {showChangePassword && (
        <PasswordModal
          mode="change"
          onSubmit={handleChangePassword}
          error={error}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-notion flex-1 flex-col px-6 lg:px-12">
          {showLoading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border border-notion-border border-t-notion-text dark:border-notion-border-dark dark:border-t-notion-text-dark" />
            </div>
          )}

          {!locked && (
            <textarea
              ref={textareaRef}
              className="w-full flex-1 resize-none border-0 bg-transparent py-6 sm:py-10 font-mono leading-relaxed outline-none placeholder-notion-muted/50 dark:placeholder-notion-muted-dark/50"
              style={{ fontSize: `${size}px`, fontWeight: bold ? 700 : 400 }}
              placeholder="Start typing..."
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              autoFocus
            />
          )}
        </div>
      </main>
    </>
  )
}
