# FRAP Backend (Node.js)

Node.js/Express API for the **Family Financial Activity Tracker** (Phase 1).

This backend tracks financial **activities**, not bank balances. It supports manual transactions, SMS-detected transactions, statement uploads, family goals, activity feeds, and learning data collection.

## Stack

- Node.js 18+
- Express 5
- PostgreSQL (`pg`)
- JWT authentication
- Zod validation
- Multer for document uploads

## Project layout

```
backend/
├── src/
│   ├── index.js           # App entry point
│   ├── config.js          # Environment config
│   ├── db/
│   │   ├── pool.js        # PostgreSQL connection pool
│   │   ├── migrate.js     # Schema migration runner
│   │   └── schema.sql     # Phase 1 database schema
│   ├── lib/               # Shared helpers
│   ├── middleware/        # Auth, validation, errors
│   └── routes/            # REST endpoints
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Local setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE frap;
CREATE USER frap WITH PASSWORD 'frap';
GRANT ALL PRIVILEGES ON DATABASE frap TO frap;
```

2. Install dependencies:

```bash
cd backend
npm install
```

3. Copy environment file and adjust if needed:

```bash
cp .env.example .env
```

4. Run database migration:

```bash
npm run db:migrate
```

5. Start the API:

```bash
npm run dev
```

API starts on `http://localhost:8080`.

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/actuator/health` | Health check |
| POST | `/api/v1/auth/register` | Register user + create family |
| POST | `/api/v1/auth/login` | Login and get JWT |
| GET | `/api/v1/families/{id}` | Family details and members |
| GET | `/api/v1/families/{id}/activities` | Activity feed |
| GET/POST | `/api/v1/families/{id}/transactions` | List / create transactions |
| GET/POST | `/api/v1/families/{id}/accounts` | List / discover accounts |
| GET/POST | `/api/v1/families/{id}/goals` | List / create goals |
| POST | `/api/v1/families/{id}/goals/{goalId}/contributions` | Contribute to goal |
| GET/POST | `/api/v1/families/{id}/documents` | List / upload statements |
| POST | `/api/v1/families/{id}/transactions/{id}/corrections` | Record user correction |
| POST | `/api/v1/learning/ai-feedback` | AI feedback |
| POST | `/api/v1/learning/suggestions` | User suggestions |

Protected routes require:

```
Authorization: Bearer <token>
```

## Render deployment

Set environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (Render sets automatically)
- `DOCUMENT_STORAGE_PATH` (persistent disk path if using Render disk)

Build command:

```bash
npm install
npm run db:migrate
```

Start command:

```bash
npm start
```

## Product rules (Phase 1)

- Tracks where money comes from and goes
- Discovers accounts (bank + last 4 digits) but does **not** calculate balances
- Stores uploaded statements for future processing
- Collects corrections, AI feedback, and suggestions from day one
