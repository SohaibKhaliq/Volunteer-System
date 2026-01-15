# Testing Context & Credentials

Use this file to store the credentials and context needed for testing the application flows.

## Admin
**Email:** admin@gmail.com
**Password:** 12345678
**Notes:**

## Volunteer
**Email:** volunteer@gmail.com
**Password:** 12345678
**Notes:**

## Organization
**Email:** organization@gmail.com
**Password:** 12345678
**Notes:**

## Project Overview

**Local Aid** is a volunteering management platform designed to connect volunteers with organizations and manage emergency aid requests. It facilitates the entire lifecycle of volunteering, from recruitment and compliance to shift management and reporting.

### Core Architecture
-   **Backend**: AdonisJS (Node.js) using Lucid ORM for PostgreSQL.
-   **Frontend**: React (Vite) with Shadcn UI and React Query.
-   **Authentication**: Token-based/Session auth via `AuthController`.

### Key Features & Workflows

#### 1. Volunteer Management (`VolunteerController.ts`)
-   **Dashboard**: Displays total hours, events attended, pending applications, and upcoming events.
-   **Profile**: manage profile details and "Organization Statuses" (e.g., membership roles).
-   **Avatar Upload**: Volunteers can upload profile pictures (stored locally in `public/uploads`).
-   **Opportunities**:
    -   **Browse**: Publicly viewable list of opportunities with filters (Search, City, Date, Org).
    -   **Apply**: Volunteers can apply for opportunities. Checks overlap with capacity and **Compliance Requirements** before allowing application.
    -   **Withdraw**: Volunteers can withdraw applications.
    -   **History**: View past applications and current status.
-   **Attendance/Hours**: Track check-ins and total approved hours.

#### 2. Organization Management (`OrganizationsController.ts`, `OrganizationDashboardController.ts`)
-   **Dashboard**: Overview of events, active volunteers, and pending approvals.
-   **Compliance**: Organizations can view the compliance status of their volunteers.
    -   *New Feature*: `OrganizationCompliance.tsx` allows uploading org-level docs and viewing stats of volunteer compliance (Background Check, WWCC, etc.).
-   **Events & Shifts**: Create and manage events.
-   **Volunteers**: Manage memberships (Add/Remove volunteers).

#### 3. Compliance System (`ComplianceController.ts`)
-   **Concept**: Users upload documents to prove eligibility (e.g., WWCC, Police Check).
-   **Volunteer Flow**:
    -   Navigate to `/volunteer/compliance`.
    -   Upload Document (Type: WWCC, Police Check, etc.).
    -   Status: 'Pending' -> 'Approved'/'Rejected'.
-   **Admin/Org Flow**:
    -   Admins view and verify documents at `/admin/compliance`.
    -   Orgs can see which volunteers meet requirements at `/organization/compliance`.
-   **Validation**: Some docs (WWCC) have specific validation logic.

#### 4. Admin Panel (`AdminController.ts`)
-   **Super Admin**: Restricted access to platform-wide management.
-   **User Management**: List, disable, enable users.
-   **Organization Management**: Approve new org registrations, suspend/archive orgs.
-   **Analytics**: System-wide growth charts (Users, Orgs, Hours).
-   **Audit Logs**: detailed history of sensitive actions (e.g., 'user_disabled', 'organization_approved').

#### 5. Emergency Aid (`HelpRequestsController.ts`)
-   **Public Facing**: Users can submit help requests.
-   **Admin Management**: Admins view and assign volunteers to emergency requests (`/admin/emergency-requests`).

### Advanced Features

#### 8. Communications (`CommunicationsController.ts`)
-   **Organization-Wide**: Org admins can send emails or in-app notifications to their volunteers.
-   **Targeting**: Filter recipients by status (e.g., Active only).
-   **Broadcasts**: Send mass announcements to all members.

#### 9. Surveys & Feedback (`SurveysController.ts`)
-   **Creation**: Admins create surveys with various question types (Rating, Text, Multiple Choice).
-   **Distribution**: Notifications sent to volunteers when a survey is "Open".
-   **Analysis**: Export survey responses to CSV for analysis.

#### 10. Data Operations (`ImportController.ts`, `ExportController.ts`)
-   **Bulk Import**:
    -   **Volunteers**: Import via CSV (email, name, role).
    -   **Opportunities**: Import via CSV (title, date, capacity).
-   **Export**: System-wide or Org-specific exports of hours and volunteer data.

#### 11. Welfare Reporting (`CentrelinkController.ts`)
-   **Context**: Specific for Australian volunteers receiving benefits.
-   **Functionality**: Automatically calculates hours per fortnight and generates the **SU462** form data or CSV export for Centrelink reporting.

#### 12. Gamification (`AchievementsController.ts`)
-   Awards (Badges/Certificates) given to volunteers based on hours contributed or events attended.

### Data Models & Relationships
-   **User**: Central entity. Can have multiple Roles.
-   **Organization**: Owns Events, Opportunities, Resources.
-   **Opportunity**: A specific volunteering opening. Linked to an Organization.
-   **Application**: Link between User and Opportunity.
-   **ComplianceDocument**: Belong to a User. Checked against **ComplianceRequirement** (defined by Org) during application.
-   **Survey**: Owne by Org/Admin. Has **SurveyResponses** linked to Users.

### UI Structure (`apps/app/src/lib/routes.tsx`)
-   **Public**: `/`, `/login`, `/register`, `/map`, `/opportunities`
-   **Volunteer**: `/volunteer/*` (Dashboard, Profile, My Opportunities, Compliance, Centrelink)
-   **Organization**: `/organization/*` (Dashboard, Events, Volunteers, Compliance, Communications, Surveys)
-   **Admin**: `/admin/*` (Users, Orgs, Reports, Logs, Imports)

### Recent Updates
-   **Volunteer Compliance Page**: Added to allow volunteers to self-manage documents.
-   **Organization Compliance**: Refined to show stats.
-   **Testing Context**: Established credentials for main roles.
