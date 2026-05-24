# CaveNote

Zero-knowledge encrypted notepad — client-side AES-GCM encryption, no registration required.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand
- **Backend:** Django 5 + Django REST Framework
- **Database:** Neon PostgreSQL (serverless)

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://user:pass@ep-cool-lake-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=your-django-secret-key
DEBUG=True
```

Run migrations and start server:

```bash
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. Neon PostgreSQL (Free Tier)

1. Go to https://neon.tech → Create account → New project
2. Copy the connection string from the dashboard
3. Paste into `DATABASE_URL` in `backend/.env`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes/<note_id>/` | Fetch encrypted note data |
| POST | `/api/notes/<note_id>/` | Create or update a note |
| DELETE | `/api/notes/<note_id>/` | Delete a note |

## Security

- AES-256-GCM encryption with 600,000 PBKDF2 iterations
- Zero-knowledge: server stores only encrypted base64 data
- Password never leaves the browser
- No user accounts, no email, no tracking

## Deployment

### Backend (Render)
```bash
# render.yaml handles this automatically
gunicorn backend.wsgi:application
```

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

## License

MIT
