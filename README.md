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
