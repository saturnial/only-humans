# OnlyHumans

A social app where only Orb-verified World ID humans can read or write. Each person can post one message per UTC day (max 200 characters). All posts appear in a global reverse-chronological feed.

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma** with SQLite (local) / PostgreSQL (production)
- **World ID** IDKit v4 for proof-of-personhood
- **JWT** session cookies for auth

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

You'll need credentials from the [World ID Developer Portal](https://developer.worldcoin.org).

3. Set up the database and start the dev server:

```bash
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## How It Works

1. **Verify** — Users prove they're a unique human via World ID Orb verification
2. **Post** — Each verified human can write one message per UTC day (max 200 chars), backed by a second World ID proof
3. **Read** — All posts appear in a shared reverse-chronological feed

## Deployment

Built for Vercel. Set your environment variables in the Vercel dashboard and use a PostgreSQL database URL for `DATABASE_URL` in production.
