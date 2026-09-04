# Supabase setup for Avicenna

The app runs in **demo mode** (local sample data) until `js/config.js` has a project URL and anon key. Setting up the real backend takes about ten minutes.

## 1. Create the project
1. [supabase.com](https://supabase.com) → New project. Region: **London (eu-west-2)**.
2. Project Settings → API: copy the **Project URL** and the **anon public** key into `js/config.js`. The anon key is designed to be public; row-level security does the protecting.

## 2. Run the migrations
SQL editor → paste and run each file in order:

| file | what it does |
|---|---|
| `migrations/0001_schema.sql` | tables and enums |
| `migrations/0002_auth.sql` | invite-only sign-in trigger |
| `migrations/0003_rls.sql` | row-level security, storage buckets and their policies |
| `migrations/0004_functions.sql` | booking/like RPCs, directory and feed views |
| `migrations/0005_round2.sql` | calendar token, scholarship years and documents, staff inbox counts |
| `seed.sql` (optional) | a demo cohort, events, curriculum, project |

Or with the CLI: `supabase link --project-ref <ref> && supabase db push`.

## 3. Auth: 6-digit code + magic link
Authentication → Providers → Email: enable **Email**, leave **Confirm email** on.
Authentication → Email Templates → **Magic Link**: replace the body so it carries both the code and the link:

```html
<h2>Your Avicenna sign-in code</h2>
<p style="font-size:32px;letter-spacing:8px;font-weight:600">{{ .Token }}</p>
<p>Enter this code in the app. It expires in 10 minutes.</p>
<p>On a computer you can also <a href="{{ .ConfirmationURL }}">sign in with this link</a>.</p>
```

Why the code: a magic link tapped from iOS Mail opens Safari, not the installed home-screen app. The code keeps scholars inside the app they installed.

Authentication → URL Configuration: set **Site URL** to where the app is hosted and add it to **Redirect URLs** (e.g. `https://scholars.avicennafoundation.org.uk/`).

Optional: Authentication → Rate Limits → lower the OTP limits; Settings → Auth → set OTP expiry to 600 seconds.

## 4. Invite scholars
Access is invite-only. Add a row per person to `scholars` with at least `email`, `full_name`, `cohort`, `university`, `subject`, `role`. Anyone whose email is not in that table gets an error at sign-in ("This email address is not on the Avicenna scholars list"). The first successful sign-in links the row to the auth user.

Bulk load from a CSV with Table editor → Import, or:

```sql
insert into scholars (email, full_name, university, subject, year_of_study, cohort, role) values
  ('a.rahman@student.manchester.ac.uk', 'Aisha Rahman', 'University of Manchester', 'Medicine', 2, '2024', 'scholar');
```

Coaches, mentors, the chaplain and staff are rows too, with `role` set accordingly. Assign `coach_id` and `mentor_id` on each scholar.

## 5. Roles and what they can do
| role | can |
|---|---|
| scholar | read everything scoped to them and their cohort, RSVP, book coaching, message coach/mentor, post, apply for the Adam Hub |
| alumni | same as scholar without a cohort feed of their own |
| coach | open/complete sessions, read and reply to their scholars' threads |
| mentor | read and reply to threads, log meetings |
| chaplain | read and update chaplaincy requests (the only role that can) |
| staff | write events, announcements, opportunities, journal, modules, resources; approve Adam Hub requests; **cannot** read chaplaincy requests |

## 6. Storage
Buckets are created by the migrations: `avatars` (public), `hub-images`, `journal`, `resources`, `project-deliverables`, `scholar-documents` (private; the app uses signed URLs). Upload curriculum PDFs and recordings to `resources/` and point `resources.storage_path` at them.

## 7. Calendar feed (Edge Function)
Scholars can subscribe to a personal calendar from Profile → "Subscribe in your calendar". It is served by the `calendar` Edge Function using a per-scholar token (`scholars.calendar_token`, created by `0005_round2.sql`).

```sh
supabase functions deploy calendar --no-verify-jwt
supabase secrets set APP_URL=https://scholars.avicennafoundation.org.uk/
```
The token is the credential, so the function is deployed without JWT verification; a scholar can reset their token from the same sheet. Validate the output locally with `node tools/ics-check.mjs`.

## 8. Staff console
Anyone with `role = 'staff'` sees a Staff pill in the header and the console at `#/staff`: inbox (Adam Hub requests, opportunity interest, scholarship documents), events, announcements, opportunities, journal, people (including scholarship years and funding status) and coaching slots. Chaplaincy requests are never shown to staff.

## 9. Realtime (optional, for live message threads)
Database → Replication → enable `messages` for realtime.

## Confidentiality note
Chaplaincy requests are readable only by the requesting scholar and users with `role = 'chaplain'`. Staff are excluded by policy, and the free-text note is wiped when a request is closed. The project's **service role key** bypasses RLS entirely, so keep it out of the app and out of shared hands.
