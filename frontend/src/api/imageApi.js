import axios from 'axios'

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || ''
const PEXELS_BASE = 'https://api.pexels.com/v1/search'

// Bundled fallback cover images — drop any PNG/JPG/WEBP files into src/assets/.
const bundledCovers = Object.values(
  import.meta.glob('../assets/*.{png,jpg,jpeg,webp}', {
    eager: true,
    import: 'default',
    query: '?url',
  })
)

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

async function fetchPexelsUrl(query) {
  const { data } = await axios.get(PEXELS_BASE, {
    headers: { Authorization: PEXELS_API_KEY },
    params: {
      query,
      per_page: 20,
      page: Math.floor(Math.random() * 5) + 1,
      orientation: 'landscape',
    },
  })
  const photos = data.photos || []
  if (!photos.length) return null
  const photo = photos[Math.floor(Math.random() * photos.length)]
  return photo.src.large2x || photo.src.large || photo.src.medium
}

function fetchPicsumUrl() {
  const seed = Math.random().toString(36).substring(2, 10)
  return `https://picsum.photos/seed/${seed}/800/600`
}

function pickBundledCover() {
  if (!bundledCovers.length) return null
  return bundledCovers[Math.floor(Math.random() * bundledCovers.length)]
}

// Returns a loaded cover image, trying each source in order:
// 1. Pexels (if an API key is configured)
// 2. Picsum (network, no key needed)
// 3. Bundled default image from src/assets/ (offline, always works)
export async function loadRandomImage(query = 'nature landscape') {
  const candidates = []
  if (PEXELS_API_KEY) {
    try {
      const url = await fetchPexelsUrl(query)
      if (url) candidates.push(url)
    } catch {
      // Pexels unreachable or rate-limited — fall through
    }
  }
  candidates.push(fetchPicsumUrl())
  for (const url of bundledCovers) candidates.push(url)

  let lastError = null
  for (const url of candidates) {
    try {
      return await loadImage(url)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('No cover image available')
}
