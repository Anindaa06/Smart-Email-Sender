# Smart Bulk Mailer

> A premium full-stack bulk email tool - compose once, send to everyone.

## Prerequisites

- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI
- Gmail account with 2FA enabled + App Password generated (Google Account -> Security -> App Passwords)

## Installation

```bash
git clone <your-repo-url>
cd smart-bulk-mailer
```

Backend setup:

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
```

Frontend setup:

```bash
cd ../frontend
npm install
```

## Environment Variables

Fill in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_bulk_mailer
JWT_SECRET=<generate a random 32+ char string>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<generate exactly 32 hex chars, e.g. run: openssl rand -hex 16>
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Running the App

```bash
# Terminal 1 - Start backend
cd backend && npm run dev

# Terminal 2 - Start frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

## Backend Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## Frontend Scripts

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## Features

- Secure register/login with JWT auth
- SMTP credential vault with AES-encrypted storage
- Multi-recipient bulk email sending with per-recipient result handling
- SMTP config auto-prefill after login
- Email preview modal and live compose preview panel
- Delivery logs dashboard with status filtering and pagination
- Dark/light theme toggle with persisted preference

## Security Notes

- Passwords are hashed with bcryptjs (salt rounds: 12)
- SMTP host/user/pass are encrypted server-side before storage
- API validation enforced via express-validator
- Rate-limiting on login/register endpoints
- Helmet and CORS protections enabled
- Error responses are sanitized and never return stack traces
