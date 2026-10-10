# CaveNote

**Zero-knowledge encrypted notepad.** Notes are AES-256-GCM encrypted in your
browser before anything leaves your device. No accounts, no email, no tracking —
every note lives at a URL only you share, and the server only ever sees
ciphertext.

## Features

- **Client-side encryption** — AES-256-GCM keys derived from your password with
  600,000 PBKDF2 iterations. The password never leaves the browser.
- **Open by URL** — any note is reachable at `/:noteName`. No registration.
- **Multiple pages per note** — a note can hold up to **5 separate pages**
  (tabs), each with its own content. Pages live in a single encrypted blob, so
  nothing about the underlying storage changes.
- **Offline support (PWA)** — notes are cached in IndexedDB and edits made while
  offline are queued and synced automatically when you reconnect.
- **Hide a note in plain sight** — [LSB steganography](#steganography) embeds an
  encrypted note inside a PNG. Anyone can decode it with the password.
- **Export** — download any note as `.txt` (client-side).
- **Dark/light theme, adjustable editor font size, bold toggle.**
- **PWA with offline asset caching** (`vite-plugin-pwa`).

## Tech Stack

| Layer     | Tech                                                                 |
|-----------|----------------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + Zustand + React Router              |
| Data      | Supabase (managed Postgres + PostgREST REST API), IndexedDB for caching |
| Crypto    | Web Crypto API — PBKDF2 (SHA-256) + AES-256-GCM, all in-browser      |
| PWA       | vite-plugin-pwa (workbox)                                            |
| Utilities | axios, lucide-react                                                  |

## How it works

### Encryption flow (`src/hooks/useCrypto.js`)

1. A random 16-byte salt and 12-byte IV are generated with `crypto.getRandomValues`.
2. The password is stretched with **PBKDF2 (600,000 iterations, SHA-256)** into a
   **256-bit AES key**.
3. Plaintext is encrypted with **AES-256-GCM**; ciphertext, IV, and salt are
   base64-encoded and stored. Nothing but that encrypted payload ever hits the
   network.
4. Decryption reverses the same steps. A wrong password or tampered data fails
   the GCM authentication tag and surfaces as *"Wrong password"*.

Steganographic notes use the same KDF but derive a domain-separated salt from
`cavenote-stegano-v1` so the image password can differ from the note password.

### Note documents (`src/utils/document.js`)

An encrypted note stores a small JSON document rather than a raw string:

```json
{
  "v": 1,
  "pages": [{ "id": "…", "content": "" }]
}
```

- `MAX_PAGES = 5`; a note always keeps at least one page.
- `parseDocument()` accepts this format and transparently wraps legacy
  plaintext (a raw string) into a single page, so old notes keep working
  unchanged.
- `sanitizeDocument()` drops whitespace-only pages before save so empty tabs
  never persist (an all-empty note saves as one empty page to keep the
  envelope valid).
- `useNote.js` holds the document plus an `activePageId`; `addPage`, `removePage`
  (with a delete-confirm modal), and tab selection are rendered by
  `PageTabs.jsx`. Tab labels derive from the first 12 characters of the page
  content, else "Empty page".

### Data flow (`src/api/noteApi.js`)

```
editor ──> encrypt() ──> saveNote() ──> Supabase upsert (encrypted_notes)
                  └───────> IndexedDB cache (always) ──> mark "pending" if offline

open ──> getNote() ──> cache hit + fresh? return
                  └──> else fetch from Supabase ──> cache
```

- Every save (and delete) is written to IndexedDB first, then pushed to Supabase.
- If the push fails (offline/network), the row stays marked **pending** (`synced = '0'`)
  in IndexedDB and `syncPendingNotes()` retries it on the next `online` event
  (see `App.jsx` and `useSync.js`).
- Reading a note tries the cache first, compares `updated_at` with the server,
  and only refetches when the cached copy is stale.

### Offline store (`src/db/noteStore.js`)

IndexedDB database `cavenote-db`, object store `notes` keyed by `note_path` with
a `synced` index (`'1'` = synced, `'0'` = pending). Also powers the
**Recent notes** list on the landing page and queues deletions while offline.

### Steganography (`src/utils/steganography.js`)

- Payload = 4-byte magic `CVNT` + 4-byte big-endian length + JSON body
  (`{ ciphertext }`), max 10 MB.
- Bits are written into the **LSB of the R, G, B channels** of fully opaque
  pixels (alpha = 255), skipping transparent pixels.
- Cover images come from, in order: Pexels (if `VITE_PEXELS_API_KEY` is set),
  Lorem Picsum, then bundled images in `src/assets/`. Generated PNGs are
  re-read and round-trip verified before download.

## Project structure

```
frontend/
├─ src/
│  ├─ App.jsx                 # Router (/, /:noteName) + theme + auto-sync
│  ├─ main.jsx                # Entry, PWA registration
│  ├─ api/
│  │  ├─ supabaseClient.js    # Supabase client (env-configured)
│  │  ├─ noteApi.js           # getNote / saveNote / deleteNote / syncPendingNotes
│  │  └─ imageApi.js          # Cover image loading (Pexels → Picsum → bundled)
│  ├─ db/
│  │  └─ noteStore.js         # IndexedDB cache + pending queue
│  ├─ hooks/
│  │  ├─ useCrypto.js         # PBKDF2 + AES-GCM (encrypt/decrypt/stegano)
│  │  ├─ useNote.js           # Editor state machine (lock/save/decrypt/delete)
│  │  ├─ useSync.js           # Zustand: global "syncing" flag
│  │  ├─ useTheme.js          # Zustand: dark mode (localStorage)
│  │  ├─ useFontSize.js       # Zustand: editor font size (localStorage)
│  │  └─ useOnline.js         # navigator.onLine hook
│  ├─ components/
│  │  ├─ Landing.jsx          # Home, note opener, stegano decode tool
│  │  ├─ Editor.jsx           # Note editor / decoded-view screens
│  │  ├─ TopBar.jsx           # Toolbar (save, download, stegano, theme, …)
│  │  ├─ PasswordModal.jsx    # Set / change / decrypt password modal
│  │  ├─ SteganoModal.jsx     # Generate PNG with hidden note
│  │  ├─ PageTabs.jsx         # Page tabs + delete-confirm modal
│  │  └─ DownloadButton.jsx   # Download note as .txt
│  └─ utils/
│     ├─ document.js          # Pages document (serialize/parse/sanitize)
│     ├─ steganography.js     # LSB embed/extract
│     ├─ download.js          # blob download (.txt export)
│     └─ randomId.js          # crypto-secure random ids
├─ public/                    # favicon, PWA icons, fonts
├─ .env.example               # Required/optional env vars
└─ vite.config.js             # Vite + PWA config, /api dev proxy
```

## Getting Started

Prerequisites: **Node.js ≥ 18** and a [Supabase](https://supabase.com) project.

### 1. Supabase setup (one time)

Open **SQL Editor → New query**, paste the schema below, and **Run**. This
creates the `encrypted_notes` table (which stores only ciphertext/iv/salt) with
an intentionally permissive RLS policy — confidentiality comes from the
client-side encryption, not the database.

> The README previously pointed at `supabase/schema.sql`; the file is no longer
> in the repo — the canonical schema lives here.

```sql
-- CaveNote: zero-knowledge encrypted notes on Supabase
-- Run this in the Supabase SQL editor (Dashboard > SQL > New query).
--
-- The backend is client-side: notes are AES-GCM encrypted in the browser,
-- so this table only ever stores ciphertext/iv/salt. Anyone may read/write
-- rows (RLS is intentionally permissive); confidentiality comes from the
-- encryption, not from the database.

create table if not exists public.encrypted_notes (
    id uuid primary key default gen_random_uuid(),
    note_path text not null unique,
    ciphertext text not null,
    iv text not null,
    salt text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.encrypted_notes enable row level security;

drop policy if exists "public access" on public.encrypted_notes;
create policy "public access"
    on public.encrypted_notes
    for all
    to anon, authenticated
    using (true)
    with check (true);

-- Keep updated_at fresh on upserts (PostgREST upserts with
-- resolution=merge-duplicates preserve created_at but would otherwise
-- leave updated_at stale).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_updated_at on public.encrypted_notes;
create trigger set_updated_at
    before update on public.encrypted_notes
    for each row
    execute function public.set_updated_at();
```

Then copy your credentials from **Project Settings → API** (Project URL and the
`anon` `public` key).

### 2. Frontend setup

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and configure it:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Optional: enables Pexels cover images for steganography.
# If left empty, the app falls back to Lorem Picsum, then to src/assets/.
VITE_PEXELS_API_KEY=""
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173. Create any note by visiting `http://localhost:5173/my-note-name`.

### Available scripts

| Command           | Description                       |
|-------------------|-----------------------------------|
| `npm run dev`     | Start the Vite dev server (:5173) |
| `npm run build`   | Production build to `dist/`       |
| `npm run preview` | Preview the production build      |

There is no test suite or linter configured yet — see
[Contributing](#contributing).

## Data model

Table `public.encrypted_notes`:

| Column       | Type        | Notes                                            |
|--------------|-------------|--------------------------------------------------|
| `id`         | uuid PK     | Auto-generated                                   |
| `note_path`  | text, unique| Public note identifier (the URL slug)            |
| `ciphertext` | text        | AES-GCM ciphertext, base64                       |
| `iv`         | text        | Initialization vector, base64                    |
| `salt`       | text        | PBKDF2 salt, base64                              |
| `created_at` | timestamptz | Auto, preserved on upsert                        |
| `updated_at` | timestamptz | Auto-updated by the `set_updated_at` trigger     |

## Security model

- **Zero-knowledge:** the Supabase database stores only base64 ciphertext
  (+ IV + salt). There is nothing sensitive to leak.
- **Keys never leave the browser:** the password is only used to derive the
  AES-GCM key in memory; it is never sent or stored. `PasswordModal.jsx`
  guarantees this by design (no API call ever includes the password).
- **No user accounts/emails/tracking.**
- **The anon key is public by design** and RLS is intentionally permissive —
  anyone may read/write any row. This is safe *only* because every stored field
  is ciphertext and a wrong password never decrypts. Do **not** tighten RLS to
  protect data — there is no data to protect.
- **GCM authentication:** any tampering with ciphertext is detected on decrypt.

### Threat model

CaveNote protects against a passive database or server compromise: an attacker
who dumps rows gets unreadable blobs. It does **not** protect against an active
attacker serving you a malicious copy of the app itself (that attacker could
exfiltrate your password). As with any client-side-encryption web app, trust the
deployed code.

## Deployment (Vercel or any static host)

The build output is a static SPA — deploy `dist/` anywhere that serves static
files (Vercel, Netlify, Cloudflare Pages, S3, nginx…). A `vercel.json` with an
SPA rewrite for `/(.*)` is included for Vercel.

```bash
cd frontend
npm run build
vercel --prod
```

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (optionally)
`VITE_PEXELS_API_KEY` as environment variables on your host, matching the
`.env` values. Because these are Vite-prefixed env vars, they are baked into the
bundle at build time — rebuild after changing them.

## Contributing

Contributions are welcome. The project has **no test suite or linter** yet, so
please:

1. **Be consistent** — match the existing code style: named-export React
   components, Zustand stores in `src/hooks/`, API/data logic separated from
   components in `src/api/` and `src/db/`, Tailwind `notion-*` theme tokens
   (`dark:` variants), no comments unless they add value.
2. **Run a build** to verify your changes compile cleanly:
   ```bash
   cd frontend && npm run build
   ```
3. **Test manually** — create/decrypt a note, save while offline, and confirm
   sync on reconnect (toggle DevTools → Network → Offline).
4. **Keep secrets out** — never commit `.env`, API keys, or real notes. Prefer
   `.env.example` for new env vars.
5. **Open a PR** with a short description and note if the change touches the
   encryption, sync, or steganography paths — those deserve extra review.

### Ideas / notes for future work

- Add a lint/format setup (ESLint + Prettier) and a test runner.
- `useNote.js` handles most editor state; consider extracting the modal flow
  into a reducer if it grows.
- Steganography currently scans whole images on the main thread; large images
  could be chunked/worker-ized.

## License

MIT