import { useState, useRef, useEffect } from 'react'
import { Image, Download, RefreshCw, Loader, CircleAlert, CircleCheck, X } from 'lucide-react'
import { encryptStegano, decryptStegano } from '../hooks/useCrypto'
import { embedNoteInImage, extractNoteFromImage } from '../utils/steganography'
import { loadRandomImage, loadImage } from '../api/imageApi'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SteganoModal({ open, onClose, plaintext, password, noteName }) {
  const [state, setState] = useState('selecting')
  const [imageBlob, setImageBlob] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    if (open) {
      setState('selecting')
      setImageBlob(null)
      setImagePreviewUrl(null)
      setError('')
      setMeta(null)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const embedWithImage = async (imgEl) => {
    setState('embedding')
    setError('')
    try {
      if (!password || !password.trim()) {
        throw new Error('A saved password is required to hide this note. Save the note first, then try again.')
      }
      const ciphertext = await encryptStegano(plaintext, password)
      const blob = await embedNoteInImage(imgEl, { ciphertext })

      const verifyUrl = URL.createObjectURL(blob)
      const verifyImg = await loadImage(verifyUrl)
      URL.revokeObjectURL(verifyUrl)
      const extracted = await extractNoteFromImage(verifyImg)
      if (!extracted) {
        throw new Error('Verification failed: the hidden note could not be re-read from the image.')
      }
      let decrypted
      try {
        decrypted = await decryptStegano(extracted.ciphertext, password)
      } catch {
        throw new Error(
          'Verification failed: the generated image could not be decoded. Try a different cover image.'
        )
      }
      if (decrypted !== plaintext) {
        throw new Error('Verification failed: the note did not round-trip correctly. Try a different image.')
      }

      setImageBlob(blob)
      setImagePreviewUrl(URL.createObjectURL(blob))
      setMeta({ size: blob.size, noteLength: plaintext.length })
      setState('ready')
    } catch (err) {
      setError(err.message || 'Failed to generate steganographic image')
      setState('error')
    }
  }

  const handleRandom = async () => {
    setState('fetching')
    setError('')
    try {
      const img = await loadRandomImage()
      await embedWithImage(img)
    } catch (err) {
      setError('Failed to fetch image. Try again later.')
      setState('error')
    }
  }

  const handleDownload = () => {
    if (!imageBlob) return
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cavenote-${noteName || 'note'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-notion-card rounded-lg border shadow-notion-modal dark:bg-notion-card-dark max-h-[90vh] overflow-y-auto">
        {state === 'selecting' && (
          <>
            <div className="p-5 sm:p-7 pb-6">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                <h2 className="text-lg font-semibold tracking-tight">Generate Steganographic Image</h2>
              </div>
              <p className="mt-1.5 text-sm text-notion-muted dark:text-notion-muted-dark leading-snug">
                Hide this encrypted note inside a picture using LSB steganography.
              </p>

              <div className="mt-6 space-y-4">
                <button onClick={handleRandom} className="btn-notion-primary w-full">
                  <RefreshCw className="h-4 w-4" />
                  Use Random Image
                </button>

                <p className="text-xs text-notion-muted dark:text-notion-muted-dark leading-relaxed">
                  Your encrypted note will be embedded into the image's pixels using LSB
                  steganography. The resulting PNG can be decoded on the landing page by
                  uploading it.
                </p>
              </div>
            </div>
            <div className="border-t px-5 sm:px-7 py-4 flex justify-end dark:border-notion-border-dark">
              <button onClick={onClose} className="btn-notion">Close</button>
            </div>
          </>
        )}

        {state === 'fetching' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader className="h-6 w-6 animate-spin text-notion-muted dark:text-notion-muted-dark" />
            <p className="text-sm">Fetching cover image...</p>
          </div>
        )}

        {state === 'embedding' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader className="h-6 w-6 animate-spin text-notion-muted dark:text-notion-muted-dark" />
            <p className="text-sm">Embedding encrypted note into image...</p>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="p-5 sm:p-7 pb-6">
              <div className="flex items-start gap-2">
                <CircleCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <h2 className="text-lg font-semibold tracking-tight flex-1">Steganographic image generated!</h2>
                <button onClick={onClose} className="btn-notion p-2 -m-2 shrink-0" title="Close" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-lg border overflow-hidden bg-notion-hover dark:bg-notion-hover-dark">
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Generated steganographic image preview"
                    className="w-full max-h-72 object-cover"
                  />
                )}
              </div>

              {meta && (
                <div className="mt-3 flex items-center justify-between text-xs text-notion-muted dark:text-notion-muted-dark">
                  <span>Size: {formatBytes(meta.size)}</span>
                  <span>Note: {meta.noteLength.toLocaleString()} chars</span>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button onClick={handleDownload} className="btn-notion-primary flex-1">
                  <Download className="h-4 w-4" />
                  Download PNG
                </button>
                <button onClick={handleRandom} className="btn-notion flex-1">
                  <RefreshCw className="h-4 w-4" />
                  New Image
                </button>
              </div>

              <p className="mt-4 text-xs text-notion-muted dark:text-notion-muted-dark leading-relaxed">
                This image contains your encrypted note. Share it with someone who has the
                password. Keep the original PNG — do not compress, re-encode, or convert it
                (e.g., to JPEG), as that destroys the hidden note.
              </p>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="p-5 sm:p-7 pb-6">
              <div className="flex items-center gap-2 text-red-500">
                <CircleAlert className="h-5 w-5" />
                <h2 className="text-lg font-semibold tracking-tight">Something went wrong</h2>
              </div>
              <p className="mt-2 text-sm text-notion-muted dark:text-notion-muted-dark leading-snug">{error}</p>
              <button onClick={() => setState('selecting')} className="btn-notion mt-5">
                Try again
              </button>
            </div>
            <div className="border-t px-5 sm:px-7 py-4 flex justify-end dark:border-notion-border-dark">
              <button onClick={onClose} className="btn-notion">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
