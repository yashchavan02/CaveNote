import { generateRandomId } from './randomId'

export const DOC_VERSION = 1

export const MAX_PAGES = 5

export function createPage() {
  return { id: generateRandomId(10), content: '' }
}

export function emptyDocument() {
  return { v: DOC_VERSION, pages: [createPage()] }
}

export function serializeDocument(doc) {
  return JSON.stringify(doc && Array.isArray(doc.pages) ? doc : emptyDocument())
}

// Returns a copy of the document with empty (whitespace-only) pages removed.
// If every page is empty, falls back to a single empty page so the document
// envelope always stays valid.
export function sanitizeDocument(doc) {
  if (!doc || !Array.isArray(doc.pages)) return emptyDocument()
  const pages = doc.pages.filter((p) => (p.content || '').trim())
  return { v: doc.v || DOC_VERSION, pages: pages.length ? pages : [createPage()] }
}

// Parses encrypted plaintext into a pages document. If the text is not our
// envelope (e.g. a note saved before pages existed), it falls back to treating
// the whole text as the content of a single page, so legacy notes keep working.
export function parseDocument(text) {
  if (typeof text !== 'string') return emptyDocument()
  const trimmed = text.trim()
  if (!trimmed) return emptyDocument()
  try {
    const parsed = JSON.parse(trimmed)
    if (
      parsed &&
      parsed.v === DOC_VERSION &&
      Array.isArray(parsed.pages) &&
      parsed.pages.length > 0
    ) {
      return {
        v: DOC_VERSION,
        pages: parsed.pages.map((p, i) => ({
          id: typeof p.id === 'string' && p.id ? p.id : `page-${i + 1}`,
          content: typeof p.content === 'string' ? p.content : '',
        })),
      }
    }
  } catch {
    // not our envelope — fall through to legacy single-page handling
  }
  return { v: DOC_VERSION, pages: [{ id: generateRandomId(10), content: text }] }
}

// Plain-text rendering of a whole document, used for .txt export and the
// read-only decoded view.
export function formatDocumentText(doc) {
  if (!doc || !Array.isArray(doc.pages)) return ''
  return doc.pages
    .map((p) => p.content)
    .filter((s) => s && s.trim())
    .join('\n\n---\n\n')
}