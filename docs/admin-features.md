# Admin features & UX design notes

This document outlines the Admin panel features and recommended UI/UX patterns for volunteer & organization management, events, compliance, and analytics.

High-level feature mapping

- User and Role Management
  - Searchable users list
  - Edit, deactivate, remove volunteers
  - Assign roles and permissions
  - View profile, participation history, compliance status
  - Auto-detection of inactivity; send re-engagement campaigns
- Event and Task Oversight
  - Create/update/delete events
  - Recurring events (rrule) support
  - Task templates, assign volunteers manually and via AI-match
  - Resource assignment (equipment/supervisors/volunteers)
- Organization Oversight
  - Approve / deactivate organizations
  - Org-level metrics and activity feed
  - AI-powered performance score (no-shows, event success predictions)
- Compliance and Verification
  - Add/verify documents (WWCC, police checks, certifications)
  - Expiry tracking, automatic reminders via scheduled tasks
  - Audit exports for regulatory reporting
- Reporting & Analytics
  - Dashboard visualizations: volunteers, events, compliance trends
  - Export CSV/PDF
  - AI forecasting helper for volunteer demand and no-show risk

UI design & shadcn integration

- Use shadcn components for consistent design primitives (Buttons, inputs, modals, tables, badges)
- Admin layout: left-side nav, topbar with global actions, main content area
- Pages should have table + details drawer + actions toolbar

Backend & AI notes

- AI endpoints are implemented as stubs. They should be replaced with real models or external services.
- Schedule commands are provided to detect inactive users and send compliance reminders; wire these to a job runner or cron in production.
