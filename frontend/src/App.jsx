import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useThemeStore } from './hooks/useTheme'
import Landing from './components/Landing'

const Editor = lazy(() => import('./components/Editor'))

function Home() {
  const location = useLocation()
  if (location.state?.decodedView) return <Editor />
  return <Landing />
}

function Spinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border border-notion-border border-t-notion-text dark:border-notion-border-dark dark:border-t-notion-text-dark" />
    </div>
  )
}

export default function App() {
  const { dark } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:noteName" element={<Editor />} />
        </Routes>
      </Suspense>
    </div>
  )
}
