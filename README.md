# wysoko

Self-scoring web app for bouldering competitions. Competitors log in on their phones, tap the boulders they climbed and the results go straight into a live ranking.

Built for **KRAK'EM ALL 2026** at Avatar Kraków (20–22 November 2026, up to 1000 competitors), and designed to be reused for future events.

**Status:** in active development, launching at KRAK'EM ALL on 20 November 2026. The core flow (login, self-scoring, import) works; the ranking and the UI design are in progress.

## Features

- **Passwordless login** with a magic link sent by email
- **Self-scoring grid**: one tap cycles a boulder through zone → top → flash → none
- **Time windows**: results can only be entered during the competitor's heat and for 20 minutes after it ends
- **Family accounts**: one email can manage several competitors (e.g. a parent registering their kids), with a switcher on the competition page
- **Import from the registration system**: a CLI script loads the paid participants, their heats and categories from a Competit export
- **Ranking** split into ADULT / KIDS and women / men *(in progress)*

## Stack

Next.js (App Router, Server Actions) · TypeScript · Drizzle ORM · PostgreSQL on Neon · Better Auth · Resend · Tailwind CSS · shadcn/ui · Vercel

## Design decisions

- **The server never trusts the client.** Every Server Action validates its input and takes the user's identity from the session. Saving a result checks in a single query that the competitor belongs to the logged-in account and to the boulder's competition.
- **Server time decides.** Heat windows are checked against the server clock, so changing the time on a phone does not reopen a closed heat.
- **Idempotent import.** Participants are upserted by their registration ID, so the export can be re-imported as many times as needed. Changing a participant's email unlinks them from the old account.
- **Ranking in SQL.** Each competitor's best 20 boulders are picked with window functions in a single query instead of being computed in JavaScript.
- **Normalized data at write time.** Emails are lowercased and names are title-cased during import, so queries do not have to handle inconsistent input.

## Running locally

```bash
npm install
cp .env.example .env
npx drizzle-kit push
npx tsx src/db/seed.ts
npm run dev
```

Required environment variables:

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=
SEED_MY_EMAIL=
```

The seed creates a test competition with a heat that is currently running, so the grid can be tried right away. Set `SEED_MY_EMAIL` to your own address to get three test competitors on your account.

Importing participants:

```bash
npx tsx --conditions=react-server src/db/import-competit.ts path/to/export.tsv <competition-id>
```
