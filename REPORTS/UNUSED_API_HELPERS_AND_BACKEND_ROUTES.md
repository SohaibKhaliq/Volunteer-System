# Repo Report — Unused frontend API helpers and backend route coverage

Generated: automatic scan of the repository's frontend API client (apps/app/src/lib/api.ts) and a lightweight check for frontend references across the app sources.

Summary

- Frontend API client helpers inspected: ~289 (helpers defined in `apps/app/src/lib/api.ts`).
- Helpers with zero frontend references (candidate `unused`): 83

IMPORTANT: "Zero references" in this report means "no direct references to api.<helperName> inside the app frontend source (apps/app/src)". Tests may mock helpers (mockedApi) or code may call the backend endpoints directly (rare). This is a conservative scan — please review entries before deleting.

=== Unused frontend API helpers (candidate list) ===

acceptInvite
addOrganizationVolunteerForOrg
aiForecast
aiMatch
approveOrganization
approveOrganizationHours
archiveOrganization
broadcastOrganizationMessage
bulkUpdateUsers
cancelOrganizationInvite
checkInToOpportunity
checkOutFromOpportunity
createBackgroundCheck
createShift
deleteAchievement
deleteAttendance
deleteOrganizationAchievement
deleteShiftAssignment
deleteSurvey
disableUser
enableUser
exportReport
getAdminOrganizations
getAdminUsers
getAttendanceSummary
getAuditLog
getCourse
getNotificationTemplate
getOpportunity
getOpportunityApplications
getOpportunityAttendances
getOrganizationCommunication
getOrganizationCommunications
getOrganizationCompliance
getOrganizationEvents
getOrganizationHours
getOrganizationInvites
getOrganizationOpportunitiesCalendar
getOrganizationSettings
getOrganizationTasks
getOrganizationTeam
getPublicOrganizationOpportunity
getResource
getShift
getSystemSettings
getVolunteerAchievements
getVolunteerAttendance
getVolunteerHours
getVolunteerHoursForOrganization
getVolunteerOpportunityDetail
getVolunteerProfile
getVolunteerStats
getVolunteerTrends
importVolunteers
importOpportunities
listOrganizationResources
qrCheckIn
reactivateOrganization
rejectInvite
removeOrganizationVolunteer
resendOrganizationInvite
resetNotificationTemplate
returnAssignment
sendOrganizationMessage
suspendOrganization
updateAchievement
updateAttendance
updateBranding
updateHour
updateOrganizationAchievement
updateOrganizationSettings
updateOrganizationVolunteerForOrg

Notes about the list

- This is a high-confidence scan for the frontend codebase only (apps/app/src). The tool looked for direct occurrences of `api.<helperName>` — if the helper is only referenced by tests (mockedApi) or used by other packages (e.g., server-side scripts), this report will show it as unused. Please confirm before removing or refactoring.

Backend coverage (quick scan)

- I performed a light pass looking for obvious backend routes that do not appear to have any client helper in `apps/app/src/lib/api.ts`. Many backend routes are implemented inside `apps/api/start/*.ts` and are already mirrored by helpers in the frontend client.
- A deeper, programmatic mapping (controller→route→client-helper) is possible and recommended. If you want I can produce a second, more exact report that:
  1. Parses backend route tables from `apps/api/start/*.ts` (and nested groups / prefixes)
  2. Extracts normalized endpoints (method + path)
  3. Matches each endpoint against frontend client helpers (exact match to axios strings and helper names)
  4. Produces a CSV or Markdown mapping: route → backend handler → frontend helper (present/missing)

Next steps / suggestions

- Review the list above and confirm which helpers are safe to remove or consolidate.
- If you want a higher-fidelity backend coverage report I can generate a second file which will:
  - Map backend route (method + path) → controller handler → frontend helper if present
  - Mark routes that have no frontend helper (these may be legitimate server-only endpoints or missing client APIs)

If you want the full backend→frontend mapping (recommended), I can run that next and produce a complete CSV for easier triage.
