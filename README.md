# Brighter Futures Tutoring — Parent Sign Up

Starter sign-up form for parents onboarding their child to private tutoring. On submit, the app creates a new parent and child record in the connected Neon (PostgreSQL) database.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Neon** (serverless Postgres) + **Drizzle ORM**
- **React Hook Form** + **Zod** (for form state and validation — to be wired in as we add fields)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   - Create a project and database at [Neon](https://console.neon.tech).
   - Copy `.env.example` to `.env` and set:
     - `DATABASE_URL` — Neon connection string
     - `SENDGRID_API_KEY` — for confirmation emails (from [SendGrid](https://sendgrid.com))
     - `SENDGRID_FROM_EMAIL` — verified sender address (e.g. `noreply@yourdomain.com`)

3. **Run migrations**

   If your database already has the `parents` / `students` tables (e.g. production), add the new columns with:

   ```bash
   psql "$DATABASE_URL" -f drizzle/0001_add_parent_new_columns.sql
   psql "$DATABASE_URL" -f drizzle/0002_add_students_new_columns.sql
   psql "$DATABASE_URL" -f drizzle/0003_add_parents_terms_text.sql
   ```

   Otherwise use Drizzle to generate/apply from schema:

   ```bash
   npm run db:generate   # generate migrations from schema
   npm run db:migrate    # apply migrations (requires DATABASE_URL)
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

The app is set up for [Vercel](https://vercel.com). The Neon serverless driver and Next.js API routes work with Vercel’s serverless runtime.

1. **Push your repo** to GitHub (or another Git provider Vercel supports).

2. **Import the project** in the [Vercel dashboard](https://vercel.com/new). Vercel will detect Next.js and use the existing `build` script.

3. **Set environment variables** in the project’s **Settings → Environment Variables**:
   - `DATABASE_URL` — your Neon connection string (add for Production, Preview, and Development if you use Vercel previews).
   - `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` — for sending the sign-up confirmation email.

4. **Run migrations** before or after the first deploy:
   - Either run `npm run db:migrate` locally with the same `DATABASE_URL` you added on Vercel.
   - Or run migrations from CI (e.g. GitHub Actions) after deploy using that env var.

5. **Deploy** — Vercel will build and deploy. The sign-up form will use the API route, which connects to Neon using `DATABASE_URL`.

Optional: you can connect [Neon’s Vercel integration](https://neon.tech/docs/guides/vercel) so that a database and `DATABASE_URL` are created automatically for the project.

## Project structure

```
├── app/
│   ├── api/submit/route.ts   # POST handler — creates parent + child in DB
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Sign-up form page
├── components/
│   └── ParentSignUpForm.tsx  # Client form component (fields added step by step)
├── lib/
│   ├── db.ts                 # Neon + Drizzle client
│   └── schema.ts             # parents & children tables
├── drizzle/                  # migrations (after db:generate)
├── drizzle.config.ts
├── package.json
└── README.md
```

## Database schema (current)

**parents** (existing table; new columns via `drizzle/0001_add_parent_new_columns.sql` and `drizzle/0003_add_parents_terms_text.sql`):

- Existing: `id`, `first_name`, `last_name`, `email` (unique), `contact_number`, `created_at`, `updated_at`, `session_rate`
- New (all nullable): `relationship`, `secondary_contact_number`, `address_line_1`, `address_line_2`, `town`, `post_code`, `emergency_first_name`, `emergency_last_name`, `emergency_relation`, `emergency_contact`, `terms`, `acknowledgement`, `terms_text`

Form → parent mapping: primary contact → `contact_number`; relationship to child → `relationship`; emergency contact fields → `emergency_*`; terms/acknowledgement checkboxes → `terms` / `acknowledgement` (timestamps); server snapshot of `content/terms-and-conditions.md` at submit → `terms_text`.

- **children**: `id`, `parent_id`, `first_name`, `last_name`, `date_of_birth`, `current_school`, `current_year_group`, plus optional SEN, exam board, medical/medication, collection/leave fields.

## Scripts

| Command         | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Next.js dev server      |
| `npm run build`| Production build              |
| `npm run start`| Start production server       |
| `npm run lint` | Run ESLint                    |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate`  | Apply migrations          |
| `npm run db:studio`   | Open Drizzle Studio      |
