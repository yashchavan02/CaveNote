# CaveNote

Zero-knowledge encrypted notepad — client-side AES-GCM encryption, no registration required.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand
- **Backend-as-a-service:** Supabase (managed Postgres + PostgREST REST API)
- **Encryption:** AES-256-GCM with 600,000 PBKDF2 iterations, all in the browser

## Quick Start

### 1. Supabase setup (one time)

1. Create a project at https://supabase.com
2. Open **SQL Editor** → New query → paste the contents of `supabase/schema.sql` → Run.
   This creates the `encrypted_notes` table (stores only ciphertext/iv/salt) with
   an intentionally permissive RLS policy — confidentiality comes from the
   client-side encryption, not the database.
3. Go to **Project Settings → API** and copy the Project URL and `anon` `public` key.

### 2. Frontend setup

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and configure:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:5173

## Data model

| Column       | Type      | Notes                         |
|--------------|-----------|-------------------------------|
| `note_path`  | text (unique) | Public note identifier (the URL slug) |
| `ciphertext` | text      | AES-GCM ciphertext, base64    |
| `iv`         | text      | Initialization vector, base64 |
| `salt`       | text      | PBKDF2 salt, base64           |
| `created_at` | timestamptz | Auto, preserved on upsert   |
| `updated_at` | timestamptz | Auto-updated by trigger      |

## Security

- AES-256-GCM encryption with 600,000 PBKDF2 iterations
- Zero-knowledge: Supabase stores only encrypted base64 data
- Password never leaves the browser
- No user accounts, no email, no tracking
- The Supabase anon key is public by design; RLS is permissive only because every stored field is ciphertext

## Deployment (Vercel or any static host)

```bash
cd frontend
npm run build
vercel --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on your host.

## Legacy Django backend (deprecated)

The previous Django + DRF backend lives in `backend/` for rollback/reference only.
It is no longer used — the frontend talks to Supabase directly.

## License

MIT
