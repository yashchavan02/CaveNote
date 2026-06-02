import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../hooks/useTheme'

export default function Landing() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const { dark, toggle } = useThemeStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (slug) navigate(`/${slug}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <nav>
        <div className="mx-auto flex w-full max-w-notion items-center justify-between px-6 lg:px-12 py-5">
          <span className="text-base font-semibold tracking-tight">CaveNote</span>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-notion p-2.5">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 flex-col lg:justify-center">
        <div className="mx-auto w-full max-w-notion px-6 lg:px-12">
          <section className="pt-10 sm:pt-16 pb-10 lg:pt-0 lg:pb-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-notion-hero font-bold tracking-tight leading-none">
                Encrypted notes.<br />No accounts.
              </h1>
              <p className="mt-5 text-base sm:text-lg lg:text-xl text-notion-muted dark:text-notion-muted-dark max-w-xl leading-snug">
                CaveNote encrypts everything in your browser with AES-256-GCM.
                The server stores only encrypted garbage. Zero knowledge, zero compromises.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 max-w-full sm:max-w-md">
                <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden focus-within:border-notion-text dark:border-gray-600 dark:focus-within:border-notion-text-dark transition-colors duration-150">
                  <input
                    type="text"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base tracking-tight placeholder-notion-muted outline-none dark:placeholder-notion-muted-dark"
                    placeholder="Enter note name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="px-4 sm:px-5 py-3 text-sm font-medium bg-notion-text text-notion-bg hover:bg-notion-text/90 dark:bg-notion-text-dark dark:text-notion-bg-dark dark:hover:bg-notion-text-dark/90 transition-colors whitespace-nowrap">
                    Open note
                  </button>
                </div>
              </form>
            </div>
          </section>


        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-notion items-center justify-between px-6 lg:px-12 py-6">
          <span className="text-sm">CaveNote</span>
          <span className="text-sm text-notion-muted dark:text-notion-muted-dark">End-to-end encrypted.</span>
        </div>
      </footer>
    </div>
  )
}
