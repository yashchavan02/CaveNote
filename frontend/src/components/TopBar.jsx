import { useState } from 'react'
import { Sun, Moon, Lock, Trash2, Copy, Check, Save, Minus, Plus, Bold, KeyRound, SeparatorHorizontal } from 'lucide-react'
import { useThemeStore } from '../hooks/useTheme'
import { useFontSizeStore } from '../hooks/useFontSize'

export default function TopBar({ noteName, status, onLock, onDelete, onSave, password, charCount, bold, onToggleBold, onInsertHR, plaintext, onChangePassword }) {
  const { dark, toggle } = useThemeStore()
  const { size, increase, decrease, MIN, MAX } = useFontSizeStore()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyContent = async () => {
    if (plaintext) await navigator.clipboard.writeText(plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const actions = (
    <>
      {status !== 'saved' && status !== 'unsaved' ? null : (
        <span className="text-xs text-notion-muted dark:text-notion-muted-dark mr-2 max-sm:hidden">
          {status === 'saved' ? 'Saved' : 'Unsaved'}
        </span>
      )}

      <div className="flex items-center rounded-lg border border-notion-border dark:border-notion-border-dark overflow-hidden mr-1 max-sm:mr-0.5">
        <button onClick={decrease} disabled={size <= MIN} className="flex items-center justify-center w-7 h-7 max-sm:w-6 max-sm:h-6 hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-30 transition-colors" title="Decrease font size">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="flex items-center justify-center w-7 h-7 max-sm:w-6 max-sm:h-6 text-[11px] font-medium text-notion-muted dark:text-notion-muted-dark select-none border-x border-notion-border dark:border-notion-border-dark">{size}</span>
        <button onClick={increase} disabled={size >= MAX} className="flex items-center justify-center w-7 h-7 max-sm:w-6 max-sm:h-6 hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-30 transition-colors" title="Increase font size">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <button onClick={onToggleBold} className={`btn-notion p-2.5 max-sm:p-2 ${bold ? 'bg-notion-hover dark:bg-notion-hover-dark' : ''}`} title="Bold">
        <Bold className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
      </button>
      <button onClick={onInsertHR} className="btn-notion p-2.5 max-sm:p-2" title="Insert horizontal rule (---)">
        <SeparatorHorizontal className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
      </button>
      <button onClick={handleCopyContent} className="btn-notion p-2.5 max-sm:p-2" title="Copy note content">
        {copied ? <Check className="h-5 w-5 max-sm:h-4 max-sm:w-4" /> : <Copy className="h-5 w-5 max-sm:h-4 max-sm:w-4" />}
      </button>
      <button onClick={onSave} className="btn-notion p-2.5 max-sm:p-2" title="Save (Ctrl+S)">
        <Save className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
      </button>
      {password && (
        <>
          <button onClick={onChangePassword} className="btn-notion p-2.5 max-sm:p-2" title="Change password">
            <KeyRound className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
          </button>
          <button onClick={onLock} className="btn-notion p-2.5 max-sm:p-2" title="Lock">
            <Lock className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
          </button>
        </>
      )}
      <button onClick={() => setShowDelete(!showDelete)} className="btn-notion p-2.5 max-sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
        <Trash2 className="h-5 w-5 max-sm:h-4 max-sm:w-4 text-red-500" />
      </button>
    </>
  )

  return (
    <>
      <header className="border-b bg-notion-bg dark:bg-notion-bg-dark dark:border-notion-border-dark">
        <div className="mx-auto w-full max-w-notion px-6 lg:px-12">
          {/* Mobile: breadcrumb + theme on one line, actions below */}
          <div className="flex items-center justify-between pt-3 md:hidden">
            <a href="/" className="text-base font-semibold tracking-tight whitespace-nowrap hover:text-notion-muted dark:hover:text-notion-muted-dark transition-colors">
              CaveNote
            </a>
            <button onClick={toggle} className="btn-notion p-2.5" title="Toggle theme">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-center justify-end gap-1 max-sm:gap-0.5 pb-3 pt-1 md:hidden overflow-x-auto">
            {actions}
          </div>

          {/* Desktop: all in one row */}
          <div className="hidden md:flex items-center justify-between py-3">
            <a href="/" className="text-base font-semibold tracking-tight whitespace-nowrap hover:text-notion-muted dark:hover:text-notion-muted-dark transition-colors">
              CaveNote
            </a>
            <div className="flex items-center gap-1">
              {actions}
              <div className="mx-2 h-6 w-px bg-notion-border dark:bg-notion-border-dark" />
              <button onClick={toggle} className="btn-notion p-2.5" title="Toggle theme">
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showDelete && (
        <div className="border-b bg-red-50 dark:bg-red-950/10 dark:border-notion-border-dark">
          <div className="mx-auto flex w-full max-w-notion items-center justify-between px-6 lg:px-12 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              Delete this note forever?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="btn-notion text-sm">
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true)
                  await onDelete()
                  setDeleting(false)
                }}
                disabled={deleting}
                className="btn-notion text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {deleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border border-red-400 border-t-transparent" />
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
