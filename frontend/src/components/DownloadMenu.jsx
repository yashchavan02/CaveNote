import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CloudDownload, FileText, FileDown } from 'lucide-react'
import { downloadTextFile, downloadPdfFile } from '../utils/download'

const MENU_WIDTH = 176

export default function DownloadMenu({ noteName, content, label = '', className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const baseName = noteName || 'cavenote-decoded'

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
      })
    }
    setOpen(!open)
  }

  const close = (fn) => {
    setOpen(false)
    fn()
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={!content}
        className={`btn-notion ${className}`}
        title="Download note"
      >
        <CloudDownload className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
        {label && <span className="hidden sm:inline text-sm">{label}</span>}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 overflow-hidden rounded-lg border py-1 bg-notion-card shadow-notion-modal dark:bg-notion-card-dark dark:border-notion-border-dark"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          >
            <button
              onClick={() => close(() => downloadTextFile(`${baseName}.txt`, content))}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            >
              <FileText className="h-4 w-4" />
              Download .txt
            </button>
            <button
              onClick={() => close(() => downloadPdfFile(`${baseName}.pdf`, content))}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            >
              <FileDown className="h-4 w-4" />
              Download .pdf
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}