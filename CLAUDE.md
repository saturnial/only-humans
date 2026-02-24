# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Proof is a minimal social web app where only Orb-verified World ID humans can read or write. Each person can post one message per UTC day (max 200 characters). All posts appear in a global reverse-chronological feed. This is a technical demo prioritizing correctness and strong server-side enforcement.

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS
- **ORM/DB**: Prisma with SQLite (local) / PostgreSQL (production, determined by `DATABASE_URL` prefix)
- **Auth**: World ID IDKit (frontend) + World ID Cloud Verification API (backend) + JWT-signed HTTP-only cookies (7-day expiry)
- **Deployment target**: Vercel

## Build & Development Commands

```bash
npm install              # Install dependencies
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run linter
```

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_WORLD_APP_ID=    # Public app ID (exposed to frontend for IDKit)
WORLD_APP_ID=                # Private app ID (server-only verification)
WORLD_DEV_PORTAL_API_KEY=    # World Dev Portal API key
SESSION_SECRET=              # JWT signing secret
DATABASE_URL=                # file:./dev.db for SQLite, otherwise PostgreSQL URL
```

## Architecture

### Data Model

Two Prisma models:
- **User**: `nullifierHash` (unique), `verificationLevel`, `lastVerifiedAt` — represents an anonymous verified human
- **Post**: `content` (max 200 chars), `dayUtc` (YYYY-MM-DD string), `userId` — has `@@unique([userId, dayUtc])` constraint enforcing one post per user per day

### World ID Integration

Two incognito actions configured in World Dev Portal:
- `enter` — used for initial verification/gate entry
- `daily-post` — used for posting; action string is `daily-post:${YYYY-MM-DD}` where date is computed server-side via `new Date().toISOString().slice(0, 10)`

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/verify` | POST | No | Verify orb proof, upsert user, set session cookie |
| `/api/me/status` | GET | Yes | Return `dayUtc`, `hasPostedToday`, `canPostToday` |
| `/api/post` | POST | Yes | Validate content + verify daily proof + insert post |
| `/api/feed` | GET | Yes | Return last 100 posts, ordered by `createdAt` DESC |

### Page Structure

Single route `/`:
- **Unauthenticated**: Gate screen with "Verify to Enter" button (IDKit → `/api/auth/verify`)
- **Authenticated**: Composer (textarea + character counter + "Verify & Post") + Feed (reverse-chronological posts)

## Critical Security Rules

- **All** World ID proof verification must happen server-side via the Cloud API
- Never trust client-provided action strings, verification level, or posting limits — always compute server-side
- Enforce `verification_level === "orb"` on every verification
- The `@@unique([userId, dayUtc])` DB constraint is the final backstop for the one-post-per-day rule; a 409 response indicates a duplicate
- Session is a JWT in an HTTP-only cookie signed with `SESSION_SECRET`

## PRD Reference

The full product requirements document is at `promps/1_origin.md`.
