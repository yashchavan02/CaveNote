import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sun, Moon, ImagePlus, FileImage, CircleAlert, Loader,
  Lock, ShieldCheck, Link2, UserX, ArrowRight,
} from 'lucide-react'
import { useThemeStore } from '../hooks/useTheme'
import { extractNoteFromImage } from '../utils/steganography'
import { decryptStegano } from '../hooks/useCrypto'
import { loadImage } from '../api/imageApi'

export default function Landing() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const { dark, toggle } = useThemeStore()

  const [decodeState, setDecodeState] = useState('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [password, setPassword] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const previewUrlRef = useRef(null)
  const encryptedDataRef = useRef(null)

  const setPreview = (url) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreviewUrl(url)
  }

  const resetDecode = () => {
    setDecodeState('idle')
    setDecodeError('')
    setPassword('')
    encryptedDataRef.current = null
    setPreview(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (slug) navigate(`/${slug}`)
  }

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setDecodeError('Please drop an image file.')
      setDecodeState('error')
      return
    }
    setDecodeState('loading')
    setDecodeError('')
    setPassword('')
    try {
      const objectUrl = URL.createObjectURL(file)
      const img = await loadImage(objectUrl)
      setPreview(objectUrl)
      setDecodeState('scanning')
      const data = await extractNoteFromImage(img)
      if (data) {
        encryptedDataRef.current = data
        setDecodeState('found')
      } else {
        setDecodeState('not_found')
      }
    } catch {
      setDecodeError('This image cannot be processed. Try downloading it first and uploading the file directly.')
      setDecodeState('error')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) processImageFile(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processImageFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDecrypt = async (e) => {
    e.preventDefault()
    const data = encryptedDataRef.current
    if (!password || !data) return
    setDecodeState('decrypting')
    setDecodeError('')
    try {
      const text = await decryptStegano(data.ciphertext, password)
      navigate('/', { state: { decodedView: true, decodedText: text } })
    } catch {
      setDecodeError('Wrong password or damaged image.')
      setDecodeState('found')
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-notion-bg/80 backdrop-blur dark:bg-notion-bg-dark/80 dark:border-notion-border-dark">
        <nav className="mx-auto flex w-full max-w-notion items-center justify-between px-6 lg:px-12 py-4">
          <a href="/" className="text-base font-semibold tracking-tight">
            CaveNote
          </a>
          <button onClick={toggle} className="btn-notion p-2.5" title="Toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section id="open" className="scroll-mt-24 border-b dark:border-notion-border-dark">
          <div className="mx-auto grid w-full max-w-notion gap-12 px-6 py-14 lg:py-20 lg:grid-cols-2 lg:px-12 lg:gap-16">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-notion-border px-3 py-1 text-xs font-medium text-notion-muted dark:border-notion-border-dark dark:text-notion-muted-dark">
                <Lock className="h-3 w-3" />
                Zero-knowledge encrypted notes
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-none lg:text-notion-h1">
                Encrypted notes.
                <br />
                No accounts.
                <br />
                <span className="text-notion-muted dark:text-notion-muted-dark">Zero knowledge.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-snug text-notion-muted dark:text-notion-muted-dark">
                CaveNote encrypts everything in your browser with AES-256-GCM before anything leaves.
                The server only ever sees ciphertext. No accounts, no tracking, no compromises.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 max-w-full sm:max-w-md">
                <label htmlFor="note-name" className="mb-2 block text-xs font-medium text-notion-muted dark:text-notion-muted-dark">
                  Open a note by name
                </label>
                <div className="flex items-stretch rounded-lg border border-notion-border overflow-hidden focus-within:border-notion-text dark:border-notion-border-dark dark:focus-within:border-notion-text-dark transition-colors duration-150">
                  <input
                    id="note-name"
                    type="text"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base tracking-tight placeholder-notion-muted outline-none dark:placeholder-notion-muted-dark"
                    placeholder="Enter note name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-3 text-sm font-medium bg-notion-text text-notion-bg hover:bg-notion-text/90 dark:bg-notion-text-dark dark:text-notion-bg-dark dark:hover:bg-notion-text-dark/90 transition-colors whitespace-nowrap">
                    Open note
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-notion-muted dark:text-notion-muted-dark">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  AES-256-GCM
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  Zero knowledge
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Open by URL
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {/* Decode tool card */}
              <div id="decode" className="card-notion border border-notion-border dark:border-notion-border-dark overflow-hidden scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-notion-border px-6 py-4 dark:border-notion-border-dark">
                  <ImagePlus className="h-4 w-4 text-notion-muted dark:text-notion-muted-dark" />
                  <h2 className="text-sm font-semibold tracking-tight">Decode a hidden note</h2>
                  <span className="ml-auto text-[11px] text-notion-muted dark:text-notion-muted-dark">PNG recommended</span>
                </div>
                <div className="p-6">
                  {decodeState === 'idle' && (
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                        isDragging
                          ? 'border-notion-text dark:border-notion-text-dark bg-notion-hover dark:bg-notion-hover-dark'
                          : 'border-notion-border dark:border-notion-border-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <ImagePlus className="h-8 w-8 text-notion-muted dark:text-notion-muted-dark" />
                      <p className="mt-3 text-sm font-medium">Drag &amp; drop or click to upload</p>
                      <p className="mt-1 text-xs text-notion-muted dark:text-notion-muted-dark">an image file</p>
                      <p className="mt-3 text-xs text-notion-muted/70 dark:text-notion-muted-dark/70">
                        Only PNG images preserve steganographic data
                      </p>
                    </label>
                  )}

                  {(decodeState === 'loading' || decodeState === 'scanning') && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <Loader className="h-6 w-6 animate-spin text-notion-muted dark:text-notion-muted-dark" />
                      <p className="text-sm">
                        {decodeState === 'loading'
                          ? 'Loading image...'
                          : 'Scanning image for hidden note...'}
                      </p>
                    </div>
                  )}

                  {decodeState === 'found' && (
                    <div>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Uploaded image preview"
                          className="w-full max-h-56 object-cover rounded-lg border border-notion-border dark:border-notion-border-dark"
                        />
                      )}
                      <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                        Hidden note found! Enter the password to decrypt it.
                      </p>
                      <form onSubmit={handleDecrypt} className="mt-3 space-y-3">
                        <input
                          type="password"
                          className="input-notion"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoFocus
                        />
                        {decodeError && (
                          <p className="text-sm text-red-500">{decodeError}</p>
                        )}
                        <button type="submit" className="btn-notion-primary w-full">
                          Decrypt
                        </button>
                      </form>
                      <button onClick={resetDecode} className="btn-notion mt-2 w-full">
                        Choose another image
                      </button>
                    </div>
                  )}

                  {decodeState === 'decrypting' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <Loader className="h-6 w-6 animate-spin text-notion-muted dark:text-notion-muted-dark" />
                      <p className="text-sm">Decrypting...</p>
                    </div>
                  )}

                  {decodeState === 'not_found' && (
                    <div>
                      <div className="flex flex-col items-center text-center py-8">
                        <FileImage className="h-8 w-8 text-notion-muted dark:text-notion-muted-dark" />
                        <p className="mt-3 text-sm font-medium">No hidden note found in this image</p>
                        <p className="mt-1 text-xs text-notion-muted dark:text-notion-muted-dark">
                          JPEG compression may strip steganographic data — PNG images are recommended.
                        </p>
                      </div>
                      <button onClick={resetDecode} className="btn-notion-primary w-full">
                        Try another image
                      </button>
                    </div>
                  )}

                  {decodeState === 'error' && (
                    <div>
                      <div className="flex flex-col items-center text-center py-8">
                        <CircleAlert className="h-8 w-8 text-red-500" />
                        <p className="mt-3 text-sm text-red-500">{decodeError}</p>
                      </div>
                      <button onClick={resetDecode} className="btn-notion-primary w-full">
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 border-b dark:border-notion-border-dark">
          <div className="mx-auto w-full max-w-notion px-6 lg:px-12 py-notion-section">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight lg:text-notion-h2">
                Built for privacy, designed for speed
              </h2>
              <p className="mt-4 text-base leading-snug text-notion-muted dark:text-notion-muted-dark">
                Everything runs in your browser. CaveNote is a thin, open layer over cryptography
                — not another account you have to manage.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-notion-border p-6 feature-card transition-shadow dark:border-notion-border-dark">
                <Lock className="h-5 w-5 text-notion-muted dark:text-notion-muted-dark" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">Private by design</h3>
                <p className="mt-2 text-sm leading-relaxed text-notion-muted dark:text-notion-muted-dark">
                  AES-256-GCM encryption happens in your browser before anything reaches the server.
                </p>
              </div>
              <div className="rounded-lg border border-notion-border p-6 feature-card transition-shadow dark:border-notion-border-dark">
                <UserX className="h-5 w-5 text-notion-muted dark:text-notion-muted-dark" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">No accounts</h3>
                <p className="mt-2 text-sm leading-relaxed text-notion-muted dark:text-notion-muted-dark">
                  No sign-up, no email, no tracking. Notes live at a URL only you share.
                </p>
              </div>
              <div className="rounded-lg border border-notion-border p-6 feature-card transition-shadow dark:border-notion-border-dark">
                <ImagePlus className="h-5 w-5 text-notion-muted dark:text-notion-muted-dark" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">Hide in plain sight</h3>
                <p className="mt-2 text-sm leading-relaxed text-notion-muted dark:text-notion-muted-dark">
                  Encode a note inside a PNG and decode it anywhere, with just a password.
                </p>
              </div>
              <div className="rounded-lg border border-notion-border p-6 feature-card transition-shadow dark:border-notion-border-dark">
                <Link2 className="h-5 w-5 text-notion-muted dark:text-notion-muted-dark" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">Open by URL</h3>
                <p className="mt-2 text-sm leading-relaxed text-notion-muted dark:text-notion-muted-dark">
                  Every note is reachable at its own link. Zero setup, zero friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="scroll-mt-24 border-b dark:border-notion-border-dark">
          <div className="mx-auto w-full max-w-notion px-6 lg:px-12 py-notion-section text-center">
            <ShieldCheck className="mx-auto h-9 w-9 text-notion-muted dark:text-notion-muted-dark" />
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight lg:text-notion-h2">
              Your notes are unreadable to anyone but you
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-snug text-notion-muted dark:text-notion-muted-dark">
              Encryption keys are derived from your password in your browser and never leave your
              device. The server stores ciphertext only — even a database leak would reveal nothing.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-notion-border-dark">
        <div className="mx-auto w-full max-w-notion px-6 lg:px-12 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-base font-semibold tracking-tight">CaveNote</div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-notion-muted dark:text-notion-muted-dark">
                Encrypted notes for people who don't want to be the product.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-notion-muted dark:text-notion-muted-dark">Product</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><button onClick={() => scrollTo('open')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">Open a note</button></li>
                <li><button onClick={() => scrollTo('open')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">Decode an image</button></li>
                <li><button onClick={() => scrollTo('features')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-notion-muted dark:text-notion-muted-dark">Security</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><button onClick={() => scrollTo('security')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">End-to-end encryption</button></li>
                <li><button onClick={() => scrollTo('security')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">Zero knowledge</button></li>
                <li><button onClick={() => scrollTo('security')} className="cursor-pointer text-notion-muted hover:text-notion-text dark:text-notion-muted-dark dark:hover:text-notion-text-dark transition-colors">Open source</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-notion-muted dark:text-notion-muted-dark">Company</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-notion-muted dark:text-notion-muted-dark">About</span></li>
                <li><span className="text-notion-muted dark:text-notion-muted-dark">Contact</span></li>
                <li><span className="text-notion-muted dark:text-notion-muted-dark">Privacy</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-notion-border pt-6 sm:flex-row sm:items-center dark:border-notion-border-dark">
            <span className="text-sm text-notion-muted dark:text-notion-muted-dark">© 2026 CaveNote</span>
            <span className="text-sm text-notion-muted dark:text-notion-muted-dark">End-to-end encrypted.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
