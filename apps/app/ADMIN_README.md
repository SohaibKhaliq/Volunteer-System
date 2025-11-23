# Admin panel (shadcn-compatible)

This folder contains a lightweight admin UI scaffold for the project.

What I added

- Admin layout and routes (/admin)
- Pages: Users, Organizations, Events, Tasks, Compliance, Reports
- Simple fetches using existing `src/lib/api.ts` axios client and react-query
- Small UI components (Button, layout) following shadcn patterns

What I implemented just now

- Added a protected API endpoint GET /me (apps/api) — returns the authenticated user's profile + roles.
- Wired the frontend to fetch the current user from the new `/me` endpoint (apps/app/src/lib/api.ts and providers/app-provider.tsx).
- Admin routes are now role-protected: only users with `isAdmin` or `admin` role can access `/admin` (apps/app/src/components/templates/AdminLayout.tsx).
- Admin pages (Users, Organizations, Events, Tasks, Compliance) were updated to use the `src/components/ui` shadcn-style components (Table, Button) for a consistent UI.

Next steps to complete shadcn integration

1. Install the shadcn/ui tooling and dependencies:

```bash
pnpm add @shadcn/ui @radix-ui/react-* lucide-react
```

2. Run the shadcn generator to scaffold components:

```bash
npx shadcn-ui@latest add button dialog input select table
```

3. Replace the placeholder UI components in `src/components/ui` with the shadcn versions and adapt styles.

4. Role-based access control is implemented — make sure the API has admin users (see below) so the admin UI shows up.

How to run admin locally

1. Start the API server in `apps/api`:

```bash
cd apps/api
pnpm install
pnpm build
pnpm start
```

2. Start the frontend app in `apps/app`:
   Testing the admin flows locally

- Authenticate: the app auto-authenticates using a fingerprint and sets a token (see `src/lib/api.authenticate`).
- Make sure the user you authenticate as either has `isAdmin=true` in the users table OR a role named `admin` assigned (user roles are stored in `user_roles` pivot table).
- You can create an admin by updating the database directly (SQL) or by adding a role in the API and attaching it to the user.

I added a dev seed that creates a default admin user and attaches the `admin` role. Use the credentials below for local testing.

Dev seed (created during db seeding)

- Email: admin@local.test
- Password: password (the seeder stores a hashed password)
- Fingerprint: admin-local-fingerprint (you can set `localStorage.setItem('fingerprint', 'admin-local-fingerprint')` in the browser or call POST /login with { fingerprint } to get a token)

The seeder inserts the user and attaches the `admin` role to it via the `user_roles` pivot table.

```bash
cd apps/app
pnpm install
pnpm dev
```
