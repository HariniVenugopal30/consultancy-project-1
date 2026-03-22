# Paint Store App (Local Development)

This project is configured to run locally with Next.js and MongoDB (Compass/local MongoDB server).

## Prerequisites

- Node.js 20+
- MongoDB running locally (default URI used here is `mongodb://127.0.0.1:27017/paintcalculator`)

## Environment Setup

Use `.env.local` with local values:

```env
NEXT_PUBLIC_API_BASE_URL=
MONGODB_URI=mongodb://127.0.0.1:27017/paintcalculator
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
ADMIN_DISPLAY_NAME=Shop Admin
ADMIN_USER_ID=offline-admin
```

`NEXT_PUBLIC_API_BASE_URL` is intentionally blank for local runs so frontend calls use local `/api/*` routes.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional Seed

```bash
npm run seed
```

## Health Check

After starting the app, verify API and DB connectivity at:

`http://localhost:3000/api/health`

## Add-on Project Integration

The add-on project (FastAPI Paint Matcher) has been fully integrated into the main `src` directory.

### Run Add-on Backend (FastAPI)

From [src/backend](src/backend):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Connect Admin Paint Mixer to Add-on API

Set this in [.env.local](.env.local):

```env
NEXT_PUBLIC_COLOR_MATCHER_API_URL=http://127.0.0.1:8000
```

Then run your main app from [project1](.):

```bash
npm run dev
```
