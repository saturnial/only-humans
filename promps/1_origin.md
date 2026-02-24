# Daily Proof — Product Requirements Document (PRD)

## 1. Overview

Daily Proof is a minimal social web application demonstrating World ID as critical infrastructure.

Core properties:

- Closed network: only verified humans can read or write.
- Orb-verified humans only.
- Each human can post **one message per UTC day**.
- Posts are limited to **200 characters**.
- All posts appear in a global reverse-chronological feed.

This is a technical demo prioritizing correctness, clarity, and strong server-side enforcement.

---

## 2. Core Principles

1. World ID verification is mandatory for access.
2. Posting is limited to once per UTC day per verified human.
3. All proof verification must occur server-side.
4. Client-side logic must not be trusted for:
   - Action strings
   - Verification level
   - Posting limits
5. Database constraints act as a backstop for posting limits.

---

## 3. Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local development)
- Postgres (production via `DATABASE_URL`)
- World ID IDKit (web)
- World ID Cloud Verification API
- JWT-signed HTTP-only cookies for sessions

---

## 4. Environment Variables

Required:

NEXT_PUBLIC_WORLD_APP_ID=
WORLD_APP_ID=
WORLD_DEV_PORTAL_API_KEY=
SESSION_SECRET=
DATABASE_URL=

Behavior:
- If `DATABASE_URL` uses `file:` → SQLite
- Otherwise → Postgres

---

## 5. World ID Configuration

App name: `daily-proof`

Incognito actions (created in World Dev Portal):

1. `enter`
   - Max verifications per user: Unique

2. `daily-post`
   - Max verifications per user: Unique

### Action Strings Used in App

Enter action:

enter

Daily posting action:

daily-post:${YYYY-MM-DD}

UTC day computed via:

```ts
new Date().toISOString().slice(0, 10)

Verification Requirement

Orb-only enforcement:

verification_level === "orb"


⸻

6. Data Model (Prisma)

User

Purpose: represent a verified anonymous human.

Fields:
	•	id (uuid, primary key)
	•	createdAt (DateTime, default now)
	•	nullifierHash (string, unique)
	•	verificationLevel (string)
	•	lastVerifiedAt (DateTime)
	•	posts (relation)

Constraints:
	•	nullifierHash UNIQUE

⸻

Post

Fields:
	•	id (uuid, primary key)
	•	content (string, max 200 characters)
	•	dayUtc (string, YYYY-MM-DD)
	•	createdAt (DateTime, default now)
	•	userId (foreign key → User)

Constraints:
	•	@@unique([userId, dayUtc])

Posts persist indefinitely.

⸻

7. Session Model

Authentication is session-based using JWT cookies.
	•	JWT signed with SESSION_SECRET
	•	Stored in HTTP-only cookie
	•	Expires in 7 days

JWT payload:

{
  userId: string,
  iat: number,
  exp: number
}

All protected routes and APIs require a valid session cookie.

⸻

8. Application Routes

/

If not authenticated:
	•	Show Gate screen

If authenticated:
	•	Show Composer + Feed

⸻

9. API Endpoints

All endpoints return JSON.

⸻

9.1 POST /api/auth/verify

Purpose: Verify orb-human and enter the network.

Request body:

{
  proof,
  merkle_root,
  nullifier_hash,
  verification_level
}

Server behavior:
	1.	Verify proof using World Cloud API with action "enter".
	2.	Reject if verification fails.
	3.	Reject if verification_level !== "orb".
	4.	Upsert User by nullifierHash.
	5.	Set JWT session cookie.
	6.	Return { ok: true }.

Error responses:
	•	401 → verification failed
	•	403 → not orb verified

⸻

9.2 GET /api/me/status

Auth required.

Returns:

{
  dayUtc,
  hasPostedToday,
  canPostToday
}

Server behavior:
	•	Compute dayUtc using UTC.
	•	Query Post where userId and dayUtc.

⸻

9.3 POST /api/post

Auth required.

Request body:

{
  content,
  proof,
  merkle_root,
  nullifier_hash,
  verification_level
}

Server flow:
	1.	Validate session.
	2.	Compute:

today = YYYY-MM-DD (UTC)
expectedAction = `daily-post:${today}`


	3.	Validate content:
	•	Trim whitespace
	•	Length between 1 and 200
	4.	Verify proof using World Cloud API with expectedAction.
	5.	Reject if verification_level !== "orb".
	6.	Attempt to insert Post.
	7.	If unique constraint fails → return 409.
	8.	Return { ok: true, postId }.

Important:
	•	Do not trust any client-provided action.
	•	Always compute action server-side.

Error codes:
	•	400 → invalid content
	•	401 → verification failed
	•	403 → not orb verified
	•	409 → already posted today

⸻

9.4 GET /api/feed

Auth required.

Returns:
	•	Last 100 posts
	•	Ordered by createdAt DESC

⸻

10. User Experience Requirements

Gate Screen
	•	Centered layout
	•	Copy: “Verify with World ID (Orb Required) to enter Daily Proof.”
	•	Button: “Verify to Enter”

On success:
	•	Set session cookie
	•	Redirect to /

⸻

Composer
	•	Textarea
	•	Character counter (0/200)
	•	“Verify & Post” button

Pre-check behavior:
	•	Call /api/me/status
	•	If canPostToday === false, show:
“You already posted today (UTC). Come back tomorrow.”
	•	Otherwise, open IDKit.

⸻

Feed
	•	Reverse chronological order
	•	Display:
	•	Post content
	•	UTC timestamp
	•	Day (YYYY-MM-DD)
	•	No usernames
	•	No likes
	•	No replies

⸻

11. Security Requirements
	•	All World ID proof verification must occur server-side.
	•	Never trust client-provided:
	•	Action strings
	•	Verification level
	•	Posting limits
	•	Enforce content limits server-side.
	•	Enforce DB uniqueness constraint.
	•	Use HTTP-only cookies.
	•	Sign JWT with SESSION_SECRET.

⸻

12. Non-Goals (v1)
	•	User profiles
	•	Usernames
	•	Likes
	•	Replies
	•	Moderation
	•	Search
	•	Following
	•	Pagination beyond 100 posts

These may be implemented in later versions.

⸻

13. Definition of Done
	•	Non-verified users cannot view or post.
	•	Orb-verified users can verify to enter and view feed.
	•	Orb-verified users can post exactly once per UTC day.
	•	Users can post again after UTC day rollover.
	•	Server-side verification prevents client bypass.
	•	App deploys successfully to Vercel.

