import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'

function pageLabel(page) {
  const text = (page.content || '').trim()
  if (!text) return 'Empty page'
  return text.length > 12 ? `${text.slice(0, 12)}...` : text
}

export default function PageTabs({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onRemove,
  readOnly = false,
  maxPages = Infinity,
}) {
  const [pendingRemove, setPendingRemove] = useState(null)
  const atMax = pages.length >= maxPages

  const requestDelete = (id) => {
    if (pages.length > 1) setPendingRemove(id)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 px-6 py-2 lg:px-12">
        {pages.map((page) => {
          const active = page.id === activePageId
          return (
            <div
              key={page.id}
              className={`flex items-center gap-1.5 rounded-lg border transition-colors ${
                active
                  ? 'border-2 border-notion-text/40 px-[11px] py-[5px] dark:border-notion-text-dark/40'
                  : 'border border-notion-border px-3 py-1.5 text-notion-muted dark:border-notion-border-dark dark:text-notion-muted-dark'
              }`}
            >
              <button
                onClick={() => onSelect?.(page.id)}
                className="flex items-center whitespace-nowrap text-sm outline-none"
              >
                {pageLabel(page)}
              </button>
              {!readOnly && pages.length > 1 && (
                <button
                  onClick={() => requestDelete(page.id)}
                  className="rounded p-0.5 text-notion-muted transition-colors hover:bg-notion-hover hover:text-red-500 dark:text-notion-muted-dark dark:hover:bg-notion-hover-dark"
                  title="Close page"
                  aria-label="Close page"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
        {!readOnly && (
          <button
            onClick={onAdd}
            disabled={atMax}
            className="flex items-center gap-1 rounded-lg border border-dashed border-notion-border px-2.5 py-1.5 text-sm text-notion-muted transition-colors hover:border-notion-text hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-notion-border disabled:hover:text-notion-muted dark:border-notion-border-dark dark:text-notion-muted-dark dark:hover:border-notion-text-dark dark:hover:text-notion-text-dark disabled:dark:hover:border-notion-border-dark disabled:dark:hover:text-notion-muted-dark"
            title={atMax ? `Maximum ${maxPages} pages` : 'New page'}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {pendingRemove &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setPendingRemove(null)}
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-lg border bg-notion-card shadow-notion-modal dark:border-notion-border-dark dark:bg-notion-card-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 pb-6 sm:p-7">
                <h2 className="text-lg font-semibold tracking-tight">Delete page?</h2>
                <p className="mt-1.5 text-sm leading-snug text-notion-muted dark:text-notion-muted-dark">
                  This page will be removed from the note. This cannot be undone.
                </p>
              </div>
              <div className="flex border-t border-notion-border divide-x divide-notion-border dark:border-notion-border-dark dark:divide-notion-border-dark">
                <button
                  onClick={() => setPendingRemove(null)}
                  className="flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-notion-muted transition-colors hover:bg-notion-hover focus:outline-none dark:text-notion-muted-dark dark:hover:bg-notion-hover-dark"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRemove?.(pendingRemove)
                    setPendingRemove(null)
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete page
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}