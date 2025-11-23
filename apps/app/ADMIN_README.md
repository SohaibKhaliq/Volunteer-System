# Admin panel (shadcn-compatible)

This folder contains a lightweight admin UI scaffold for the project.

What I added

- Admin layout and routes (/admin)
- Pages: Users, Organizations, Events, Tasks, Compliance, Reports
- Simple fetches using existing `src/lib/api.ts` axios client and react-query
- Small UI components (Button, layout) following shadcn patterns

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

4. Add role-based access control into the admin routes (show/hide pages based on user roles), and wire authentication.

How to run admin locally

1. Start the API server in `apps/api`:

```bash
cd apps/api
pnpm install
pnpm build
pnpm start
```

2. Start the frontend app in `apps/app`:

```bash
cd apps/app
pnpm install
pnpm dev
```
