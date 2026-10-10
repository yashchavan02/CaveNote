import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, Copy, Check, Minus, Plus, ArrowLeft, CircleAlert } from 'lucide-react'
import { useNote } from '../hooks/useNote'
import { useFontSizeStore } from '../hooks/useFontSize'
import { useThemeStore } from '../hooks/useTheme'
import { parseDocument, serializeDocument, formatDocumentText, sanitizeDocument, MAX_PAGES } from '../utils/document'
import PasswordModal from './PasswordModal'
import TopBar from './TopBar'
import SteganoModal from './SteganoModal'
import DownloadButton from './DownloadButton'
import PageTabs from './PageTabs'

export default function Editor() {
  const { size, increase, decrease, MIN, MAX } = useFontSizeStore()
  const { dark, toggle } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const decodedView = location.state?.decodedView
  const decodedText = location.state?.decodedText
  const [decodedCopied, setDecodedCopied] = useState(false)
  const [bold, setBold] = useState(false)
  const [showStegano, setShowStegano] = useState(false)
  const pendingSteganoRef = useRef(false)
  const textareaRef = useRef(null)
  const {
    noteName,
    document,
    pages,
    activePageId,
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
    addPage,
    removePage,
    selectPage,
  } = useNote()

  const decodedDoc = useMemo(() => parseDocument(decodedText || ''), [decodedText])
  const [decodedActiveId, setDecodedActiveId] = useState(() => decodedDoc.pages[0]?.id || null)
  const decodedPage = decodedDoc.pages.find((p) => p.id === decodedActiveId) || decodedDoc.pages[0]

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

  const handleStegano = () => {
    if (!document.pages.some((p) => p.content.trim())) return
    if (!password) {
      pendingSteganoRef.current = true
      setShowSavePrompt(true)
    } else {
      setShowStegano(true)
    }
  }

  const showLoading = locked && exists === null && !error
  const showDecryptModal = locked && exists === true

  if (decodedView) {
    return (
      <>
        <header className="border-b bg-notion-bg dark:bg-notion-bg-dark dark:border-notion-border-dark">
          <div className="mx-auto flex w-full max-w-notion items-center justify-between px-6 lg:px-12 py-3">
            <button
              onClick={() => navigate('/', { replace: true, state: {} })}
              className="btn-notion px-3 py-2.5 gap-2"
              title="Home"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Home</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(decodedPage?.content || '')
                  setDecodedCopied(true)
                  setTimeout(() => setDecodedCopied(false), 2000)
                }}
                className="btn-notion px-3 py-2.5 gap-1.5"
                title="Copy decrypted note"
              >
                {decodedCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline text-sm">{decodedCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <DownloadButton content={formatDocumentText(decodedDoc)} label="Download" className="px-3 py-2.5 gap-1.5" />
              <div className="flex items-center rounded-lg border border-notion-border dark:border-notion-border-dark overflow-hidden">
                <button onClick={decrease} disabled={size <= MIN} className="flex items-center justify-center w-7 h-7 hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-30 transition-colors" title="Decrease font size">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex items-center justify-center w-7 h-7 text-[11px] font-medium text-notion-muted dark:text-notion-muted-dark select-none border-x border-notion-border dark:border-notion-border-dark">{size}</span>
                <button onClick={increase} disabled={size >= MAX} className="flex items-center justify-center w-7 h-7 hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-30 transition-colors" title="Increase font size">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mx-2 h-6 w-px bg-notion-border dark:bg-notion-border-dark" />
              <button onClick={toggle} className="btn-notion p-2.5" title="Toggle theme">
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-notion flex-1 flex-col">
            <PageTabs
              pages={decodedDoc.pages}
              activePageId={decodedActiveId}
              onSelect={setDecodedActiveId}
              readOnly
            />
            <textarea
              readOnly
              value={decodedPage?.content || ''}
              className="flex-1 resize-none border-0 bg-transparent px-6 py-6 font-mono leading-relaxed outline-none sm:py-10 lg:px-12"
              style={{ fontSize: `${size}px` }}
            />
          </div>
        </main>
      </>
    )
  }

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
        onStegano={handleStegano}
      />

      {showSavePrompt && (
        <PasswordModal
          mode="save"
          onSubmit={async (pw) => {
            const saved = await saveEncrypted(pw)
            if (saved && pendingSteganoRef.current) {
              pendingSteganoRef.current = false
              setShowStegano(true)
            }
          }}
          error={error}
          onClose={() => {
            pendingSteganoRef.current = false
            setShowSavePrompt(false)
          }}
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

      <SteganoModal
        open={showStegano}
        onClose={() => setShowStegano(false)}
        content={serializeDocument(sanitizeDocument(document))}
        password={password}
        noteName={noteName}
      />

      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-notion flex-1 flex-col">
          {showLoading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border border-notion-border border-t-notion-text dark:border-notion-border-dark dark:border-t-notion-text-dark" />
            </div>
          )}

          {locked && error && !showLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <CircleAlert className="h-6 w-6 text-red-500" />
              <p className="max-w-sm text-sm text-notion-muted dark:text-notion-muted-dark leading-snug">{error}</p>
              <button onClick={() => navigate('/', { replace: true })} className="btn-notion">
                Back to home
              </button>
            </div>
          )}

          {!locked && (
            <div className="flex flex-1 min-h-0 flex-col">
              <PageTabs
                pages={pages}
                activePageId={activePageId}
                onSelect={selectPage}
                onAdd={addPage}
                onRemove={removePage}
                maxPages={MAX_PAGES}
              />
              <textarea
                ref={textareaRef}
                className="w-full flex-1 resize-none border-0 bg-transparent px-6 py-6 font-mono leading-relaxed outline-none placeholder-notion-muted/50 dark:placeholder-notion-muted-dark/50 lg:px-12 sm:py-10"
                style={{ fontSize: `${size}px`, fontWeight: bold ? 700 : 400 }}
                placeholder="Start typing..."
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      </main>
    </>
  )
}
