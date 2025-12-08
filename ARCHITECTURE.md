# Architecture Plan: Volunteer Management System (VMS)

This architecture plan outlines the transformation of the existing "Eghata" platform into a comprehensive Volunteer Management System. It leverages the existing AdonisJS (Backend) and React/Shadcn (Frontend) stack, mapping current components to new requirements and identifying necessary additions.

## 1. Overview

The VMS is divided into four core modules:
1.  **Public Website:** Landing, Discovery, Auth.
2.  **Volunteer Panel:** Dashboard, Scheduling, Profile, Gamification.
3.  **Organization Panel:** Mgmt Dashboard, Events, Rostering, Attendance.
4.  **Super Admin Panel:** Oversight, Tenancy, System Health.

## 2. Module 1: Public Website (Landing & Discovery)

This module is the entry point for all users.

### Features & Implementation
*   **Landing Page:**
    *   *New:* Hero section with impact stats (e.g., "10k Hours Volunteered").
    *   *Existing:* Organization listing (`organizations.tsx`), Map view (`map.tsx`).
    *   *Action:* enhance `home.tsx` to include "Featured Organizations" and aggregated stats.
*   **Opportunity Search:**
    *   *Existing:* The `Events` model exists.
    *   *Gap:* Search filters for "Location", "Cause" (Categories), "Skill Type".
    *   *Action:* Update `EventsController.index` to support filtering by these fields. Add `Cause` and `Skills` fields/tables if missing.
*   **Auth:**
    *   *Existing:* `AuthController`, `login.tsx`, `register.tsx`.
    *   *Gap:* Distinguish roles (Volunteer vs Org) during registration.
    *   *Action:* Add "Role Selection" to `register.tsx`. Backend already supports `Role` model.

### Components (Frontend)
*   `src/pages/home.tsx`: Update with Hero and Stats.
*   `src/pages/events.tsx` (New): specialized search page for volunteering opportunities (distinct from generic "Help Requests").
*   `src/components/auth/register-form.tsx`: Add role selector.

### Backend Logic
*   `EventsController`: Add filter scopes for skills/causes.
*   `AuthController`: Assign `volunteer` or `organization_owner` role on signup.

## 3. Module 2: Volunteer Panel (User Dashboard)

For individual volunteers to manage their engagement.

### Features & Implementation
*   **Dashboard:**
    *   *New:* "Upcoming Shifts", "Total Hours", "Badges".
    *   *Action:* Create `src/pages/volunteer/dashboard.tsx`. Fetch data from `VolunteerHours` and `Assignment` (Applications).
*   **Scheduling:**
    *   *Existing:* `Calendar` component in Shadcn.
    *   *Action:* Implement `src/pages/volunteer/schedule.tsx` using `react-day-picker` (Shadcn) showing `Assignments` where `status = 'approved'`.
*   **Opportunity Management:**
    *   *Existing:* `Assignment` model links User to Task (Shift).
    *   *Action:* "Apply" button triggers `AssignmentsController.store`. "Withdraw" triggers `AssignmentsController.destroy`.
    *   *Gap:* Check-in/out logic.
    *   *Action:* Add `checkInTime` and `checkOutTime` to `Assignment` or `VolunteerHour`.
*   **Profile:**
    *   *Existing:* `profile.tsx`, `User` model.
    *   *Gap:* Resume upload, Skills tagging.
    *   *Action:* Add `resume_url` to `User` (or `ComplianceDocument`). Add `skills` Many-to-Many relationship.
*   **Gamification:**
    *   *New:* Printable certificates.
    *   *Action:* Create `CertificatesController` to generate PDF based on `VolunteerHours`.

### Components (Frontend)
*   `src/pages/volunteer/dashboard.tsx`: Main hub.
*   `src/pages/volunteer/my-shifts.tsx`: Calendar view.
*   `src/components/volunteer/skill-selector.tsx`: Component to tag skills.

### Backend Logic
*   `UsersController`: Handle profile updates (resume, skills).
*   `AssignmentsController`: Handle applying/withdrawing.
*   `VolunteerHoursController`: Calculate totals/impact.

## 4. Module 3: Organization Panel (Management)

For organizations to manage events and volunteers.

### Features & Implementation
*   **Organization Profile:**
    *   *Existing:* `Organization` model, `organization/profile.tsx`.
    *   *Action:* Ensure fields for branding/mission exist.
*   **Event/Shift Management:**
    *   *Existing:* `Event` and `Task` (Shift) models. `organization/events.tsx`.
    *   *Action:* Enhance UI to create `Task` (Shift) with `capacity` and `startAt`/`endAt` (Morning/Evening).
*   **Volunteer Rostering:**
    *   *Existing:* `organization/volunteers.tsx`.
    *   *Action:* Use Shadcn `DataTable` to list `Assignments` for an event. Add "Approve/Reject" actions.
*   **Attendance (QR Code):**
    *   *New:* Generate QR for `Event` or `Task`.
    *   *Action:* Create `QRCodeGenerator` service. Frontend displays QR. Volunteer scans -> API endpoint `AttendanceController.checkIn`.
*   **Communication:**
    *   *Existing:* `CommunicationsController`, `organization/communications.tsx`.
    *   *Action:* Ensure "Blast Email" feature works by filtering Volunteers by Event.

### Components (Frontend)
*   `src/pages/organization/event-manager.tsx`: CRUD for Events + Shifts.
*   `src/components/organization/roster-table.tsx`: DataTable for applicants.
*   `src/components/organization/qr-code-modal.tsx`: Display check-in QR.

### Backend Logic
*   `EventsController` / `TasksController`: Manage Shifts.
*   `AssignmentsController`: Bulk update status (Applied -> Approved).
*   `AttendanceController` (New): Handle QR scan logic (Geo + Time verification).

## 5. Module 4: Super Admin Panel (Oversight)

For platform administrators.

### Features & Implementation
*   **Tenancy (Org Approval):**
    *   *Existing:* `Organization.isApproved` field. `admin/organizations.tsx`.
    *   *Action:* Interface to list pending Orgs and Approve/Reject.
*   **Global Settings:**
    *   *Existing:* `SystemSettingsController`, `admin/settings.tsx`.
    *   *Action:* Manage `Skills` and `Causes` taxonomies here.
*   **User Management:**
    *   *Existing:* `admin/users.tsx`.
    *   *Action:* Add "Ban" (toggle `isDisabled`).
*   **System Health:**
    *   *Existing:* `MonitoringController`, `admin/monitoring.tsx`.
    *   *Action:* Display logs and DB health status.

## 6. Database Schema & Models

We will use the existing schema with the following modifications/confirmations:

### Key Tables

1.  **Users** (`users`)
    *   `id`, `email`, `password`, `is_disabled` (Ban), `role_id`.
    *   *Add:* `skills` (pivot), `resume_url`.
2.  **Organizations** (`organizations`)
    *   `id`, `user_id` (Owner), `name`, `is_approved`, `mission_statement`, `logo_url`.
3.  **Events** (`events`)
    *   `id`, `organization_id`, `title`, `description`.
    *   *Relation:* One-to-Many `Tasks` (Shifts).
4.  **Shifts** (Mapped to `tasks` table)
    *   `id`, `event_id`, `title` (e.g. "Morning Shift"), `start_at`, `end_at`, `capacity`.
5.  **Applications** (Mapped to `assignments` table)
    *   `id`, `user_id`, `task_id`, `status` (pending, approved, rejected, checked_in, attended).
    *   *Add:* `check_in_time`, `check_out_time`, `attendance_verified` (bool).
6.  **VolunteerHours** (`volunteer_hours`)
    *   `id`, `user_id`, `organization_id`, `hours_logged`, `verified`.

### Relationships
*   **One-to-Many:** Org -> Events
*   **One-to-Many:** Event -> Shifts (Tasks)
*   **One-to-Many:** Shift -> Applications (Assignments)
*   **Many-to-Many:** Users <-> Skills

## 7. Adonis Components (Backend)

### Controllers
*   `AuthController`: Login/Register.
*   `EventsController`: Public search & Org CRUD.
*   `TasksController`: Shift management.
*   `AssignmentsController`: Application logic (Apply, Approve, Reject).
*   `AttendanceController` (New): QR Check-in.
*   `VolunteerHoursController`: Stats & History.
*   `OrganizationsController`: Profile & Admin approval.
*   `SystemSettingsController`: Global configs.
*   `MonitoringController`: Health checks.

### Ace Commands
*   `node ace cron:reminders`: Send email reminders 24h before shift (Using `Assignments` with `start_at`).
*   `node ace cron:cleanup`: Archive old events.

## 8. Shadcn Components (Frontend)

*   **Data Table:** Volunteer Roster, Admin User Lists.
*   **Calendar:** Volunteer Schedule, Org Event Calendar.
*   **Dialog/Sheet:** Event Details, Application Forms.
*   **Card:** Event Listings, Dashboard Stats.
*   **Toaster:** Success/Error notifications (e.g., "Application Submitted").
*   **Form:** React Hook Form + Zod for all inputs.
*   **Badge:** Status indicators (Approved/Pending).
