# Database Seeders Documentation

This directory contains production-ready TypeScript seeders for the AdonisJS volunteer management system.

## Overview

All seeders follow these standards:
- ✅ Production-ready TypeScript for AdonisJS
- ✅ MySQL database with raw SQL queries only (no ORM)
- ✅ At least 50 unique records each (configurable)
- ✅ Safe to re-run with ON DUPLICATE KEY UPDATE
- ✅ Transactional with proper error handling
- ✅ Realistic Australian data (addresses, phone numbers, postcodes)
- ✅ No dummy/placeholder data

## Running Seeders

### Run all seeders in order:
```bash
node ace db:seed
```

### Run a specific seeder:
```bash
node ace db:seed -f ./database/seeders/UserSeeder.ts
```

## Seeder Order

The `MainSeeder.ts` runs all seeders in the correct dependency order:

1. **UserSeeder** - Base users (volunteers)
2. **OrganizationSeeder** - Non-profit organizations
3. **RoleSeeder** - System roles (RBAC)
4. **PermissionSeeder** - Permission definitions
5. **RolePermissionSeeder** - Role-permission mappings
6. **UserRoleSeeder** - User-role assignments
7. **TeamSeeder** - Teams within organizations
8. **OrganizationVolunteerSeeder** - Links volunteers to organizations
9. **OrganizationInviteSeeder** - Organization invitations
10. **OpportunitySeeder** - Volunteer opportunities
11. **EventSeeder** - Community events
12. **ApplicationSeeder** - Applications to opportunities
13. **CourseSeeder** - Training courses
14. **CourseEnrollmentSeeder** - Course enrollments
15. **TaskSeeder** - Event tasks
16. **AssignmentSeeder** - Task assignments to volunteers
17. **ResourceSeeder** - Equipment and supplies
18. **ResourceAssignmentSeeder** - Resource allocations
19. **ShiftSeeder** - Shift schedules
20. **ShiftTaskSeeder** - Tasks within shifts
21. **ShiftAssignmentSeeder** - Volunteer shift assignments
22. **VolunteerHourSeeder** - Volunteer hours tracking
23. **AttendanceSeeder** - Check-in/check-out records
24. **SurveySeeder** - Survey definitions
25. **SurveyResponseSeeder** - Survey responses
26. **BackgroundCheckSeeder** - Background verification
27. **ComplianceDocumentSeeder** - Compliance documents
28. **ComplianceRequirementSeeder** - Compliance requirements
29. **AchievementSeeder** - Gamification achievements
30. **UserAchievementSeeder** - User achievement progress
31. **GamificationBadgeSeeder** - Badge definitions
32. **UserBadgeSeeder** - User badge awards
33. **DocumentSeeder** - General documents
34. **DocumentAcknowledgmentSeeder** - Document acknowledgments
35. **CommunicationSeeder** - Communication records
36. **CommunicationLogSeeder** - Communication logs
37. **EngagementCampaignSeeder** - Engagement campaigns
38. **OrganizationTeamMemberSeeder** - Team membership
39. **AuditLogSeeder** - System audit trail
40. **TypeSeeder** - Help request/offer types
41. **HelpRequestSeeder** - Community help requests
42. **OfferSeeder** - Volunteer offers
43. **CarpoolingAdSeeder** - Carpooling ads
44. **ContactSubmissionSeeder** - Contact submissions
45. **SystemSettingSeeder** - System settings
46. **ApiTokenSeeder** - API tokens
47. **NotificationSeeder** - User notifications

**Total: 47 comprehensive seeders**

## Seeder Details

### UserSeeder.ts
- **Records**: 50 unique Australian volunteers
- **Features**:
  - Realistic Australian names (multicultural)
  - Unique emails (@volunteers.au.org)
  - Unique Australian mobile numbers (+61 4xx xxx xxx)
  - Real Australian addresses with matching city/state/postcode
  - Covers all 8 states/territories (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
  - Profile metadata with full address details
  - Default password: `12345678` (hashed)

### OrganizationSeeder.ts
- **Records**: 50 Australian non-profit organizations
- **Features**:
  - Diverse organization types (Environmental, Health, Education, etc.)
  - Realistic contact details and websites
  - Unique slugs for URL-friendly identification
  - Australian cities across all states
  - Public profiles enabled

### TeamSeeder.ts
- **Records**: 50 teams
- **Features**:
  - Diverse team types (Event Planning, Fundraising, etc.)
  - Team leaders assigned from user pool
  - Linked to organizations

### OrganizationVolunteerSeeder.ts
- **Records**: 150 volunteer-organization relationships
- **Features**:
  - Unique pairs (no duplicate relationships)
  - Roles: Volunteer, Team Leader, Coordinator, Manager
  - Status tracking: Active, Inactive, Pending
  - Hours tracking (0-200 hours)
  - Ratings (3.0-5.0)
  - Skills tracking (First Aid, IT, Cooking, etc.)

### OpportunitySeeder.ts
- **Records**: 50 volunteer opportunities
- **Features**:
  - Various types: event, shift, recurring
  - Future dates (upcoming opportunities)
  - Realistic Australian locations
  - Capacities (5-50 volunteers)
  - Published status
  - Unique slugs

### EventSeeder.ts
- **Records**: 50 community events
- **Features**:
  - Diverse event types (BBQ, Fun Run, Festival, etc.)
  - Scheduled across next 120 days
  - Realistic durations (2-8 hours)
  - Linked to organizations
  - Published status

### ApplicationSeeder.ts
- **Records**: 100 volunteer applications
- **Features**:
  - Unique user-opportunity pairs
  - Status distribution: 50% accepted, 30% applied, 10% rejected, 10% withdrawn
  - Application dates within last 30 days
  - Response tracking for processed applications

### CourseSeeder.ts
- **Records**: 50 training courses
- **Features**:
  - Realistic course titles (First Aid, Leadership, etc.)
  - Named instructors
  - Scheduled across next 60 days
  - Course durations (1-3 days)
  - Capacity tracking (15-35 participants)

### CourseEnrollmentSeeder.ts
- **Records**: 100 course enrollments
- **Features**:
  - Unique user-course pairs
  - Status distribution: 40% enrolled, 40% completed, 10% dropped, 10% waitlisted
  - Completion tracking

### TaskSeeder.ts
- **Records**: 100 event tasks
- **Features**:
  - Common task types (Setup, Registration, Cleanup, etc.)
  - Required skills tracking
  - Slot counts (1-5 volunteers per task)
  - Scheduled within event timeframes
  - Linked to events

### VolunteerHourSeeder.ts
- **Records**: 200 volunteer hour records
- **Features**:
  - Hours logged in last 90 days
  - Realistic hour amounts (1-8 hours per entry)
  - Status distribution: 70% approved, 20% pending, 10% rejected
  - Linked to events and users

### AttendanceSeeder.ts
- **Records**: 150 attendance records
- **Features**:
  - Check-in/check-out tracking
  - Multiple methods: manual, QR code, biometric
  - Metadata (device ID, IP address)
  - Most records have check-out times (90%)
  - Last 60 days of attendance

### NotificationSeeder.ts
- **Records**: 100 notifications
- **Features**:
  - Various types (system, application, reminder, etc.)
  - Priority levels (low, normal, high, urgent)
  - 70% marked as read
  - Action URLs for relevant notifications
  - Email delivery tracking
  - Last 30 days of notifications

## Configuration

Each seeder has a `RECORD_COUNT` constant at the top that can be modified:

```typescript
const RECORD_COUNT = 50 // Change this number
```

## Data Characteristics

### Australian Data Accuracy
- **Phone Numbers**: Valid Australian mobile format (+61 4XX XXX XXX)
- **Postcodes**: Match their corresponding cities/states
- **Addresses**: Real street names in correct cities
- **Cities**: Major Australian cities across all states/territories

### Realistic Relationships
- Organizations owned by users
- Teams belong to organizations with team leaders
- Opportunities and Events linked to organizations
- Applications link users to opportunities
- Tasks belong to events
- Volunteer hours track event participation
- Notifications target specific users

### Data Integrity
- No duplicate emails, phones, or slugs
- Unique constraints respected (user-org, user-opportunity, user-course pairs)
- Foreign key relationships maintained
- Timestamps properly set (created_at, updated_at, joined_at, etc.)

## Error Handling

All seeders include:
- Transaction support with rollback on failure
- Existence checks (skip if dependencies missing)
- Detailed error logging
- Success confirmation messages

## Example Success Output

```
Starting database seeding...
UserSeeder: upserted 50 users
OrganizationSeeder: upserted 50 organizations
TeamSeeder: upserted 50 teams
OrganizationVolunteerSeeder: upserted 150 organization-volunteer relationships
OpportunitySeeder: upserted 50 opportunities
EventSeeder: upserted 50 events
ApplicationSeeder: upserted 100 applications
CourseSeeder: upserted 50 courses
CourseEnrollmentSeeder: upserted 100 course enrollments
TaskSeeder: inserted 100 tasks
VolunteerHourSeeder: inserted 200 volunteer hour records
AttendanceSeeder: inserted 150 attendance records
NotificationSeeder: inserted 100 notifications
Database seeding completed successfully!
```

## Notes

- All seeders use raw SQL with parameterized queries for security
- ON DUPLICATE KEY UPDATE allows safe re-running
- Dates are generated relative to current time
- Random distribution ensures variety in test data
- All passwords are hashed using AdonisJS Hash service

## Customization

To add more data types or modify existing data:

1. Update the data arrays in each seeder
2. Modify the `RECORD_COUNT` constant
3. Adjust status distributions in the weight functions
4. Change date ranges by modifying the random offsets

## Dependencies

Seeders automatically check for required dependencies and skip if not found:
- OrganizationVolunteerSeeder requires Users and Organizations
- OpportunitySeeder requires Organizations
- EventSeeder requires Organizations
- ApplicationSeeder requires Users and Opportunities
- etc.
