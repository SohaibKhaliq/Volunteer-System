# Detailed Unused API Helpers & Backend Coverage Report

This report is generated as the first step towards wiring the full Volunteer Management System UI and ensuring frontend/back-end coverage.

What I analyzed

- apps/app/src/lib/api.ts — list of ~289 helpers (central frontend API client)
- all frontend source files under apps/app/src/\*\* — scanned for references to `api.<helper>` usage
- backend routes under apps/api/start/\*\* — scanned for server endpoints

Key findings

- Helpers with 0 references in the frontend: 83 (candidates for removal OR need UI wiring)
- Many helpers map clearly to backend routes and are safe to expose with UI pages (or used by tests/mocks);
  others are internal/admin-only and may intentionally be unused in the public frontend.

Top categories of unused helpers (examples)

- Admin / organization lifecycle: approveOrganization, suspendOrganization, archiveOrganization
- Admin user management helpers: getAdminOrganizations, getAdminUsers
- Calendar/organization specific: getOrganizationOpportunitiesCalendar, getOrganizationEvents, getOrganizationHours
- Shifts/scheduling: createShift, getShift, updateShiftAssignment
- Reporting & settings: getSystemSettings, updateSystemSettings, exportReport
- Volunteer-specific helpers that lack UI: getVolunteerProfile, getVolunteerHours

Caveats

- Tests may mock API helpers (so zero-references doesn't mean unused by tests). See apps/app/src/**tests** for examples.
- Some helpers are generic or low-level helpers used by server-to-server flows, not UI (e.g., retryScheduledJob).
- Frontend code may call axios endpoints directly (via axios) instead of `api.<helper>`, which won't show in a simple `api.` scan.

Next steps (recommended) — I will implement these unless you request a different priority:

1. Add server-driven feature flags. This ensures admin-only tools and sensitive features are gated correctly and server-authoritative (safer than role heuristics).
2. Show admin badges for (a) pending background checks — already added, (b) pending imports queue, (c) pending volunteer hour approvals, and (d) unread notifications.
3. Implement UIs for higher-impact unused helpers (pick priorities): approval flows (approveOrganizationHours), admin detail pages (admin users/orgs), shifts/scheduling helpers, and calendar filters.
4. Create a CSV/Markdown mapping listing each backend route and the corresponding frontend helper (or note missing helper). This will make next wiring steps straightforward.

If you'd like to proceed now, I will: generate the route -> helper map file (CSV), create server feature flags endpoint and a `useFeatures()` client hook, wire the AdminLayout to use server-driven flags, then add badges for imports/pending approvals/unread notifications.

---

Status: ready to proceed with server-driven feature flags and badges (confirm and I'll implement).
