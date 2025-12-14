# Australian Compliance Features Implementation

## Overview
This document details the Australian-specific compliance features implemented for the volunteer management system, meeting requirements for WWCC, NPC, Centrelink reporting, and geolocation validation.

## ✅ Implemented Features

### 1. Working with Children Check (WWCC) Validation

**Service**: `ComplianceService.ts`

**State-Specific Regex Patterns**:
- **VIC (Victoria)**: `^\d{8}[A-Za-z]$` - 8 digits + check letter (e.g., 12345678A)
- **NSW (New South Wales)**: `^WWC\d{7}[EV]$` - WWC prefix + 7 digits + E/V (e.g., WWC1234567E)
- **QLD (Queensland - Blue Card)**: `^\d{5,7}\/\d{1,2}$` - 5-7 digits / 1-2 digits (e.g., 12345/1)
- **WA (Western Australia)**: `^\d{6,7}$` - 6-7 digits (e.g., 123456)
- **SA (South Australia)**: `^\d{7}$` - 7 digits
- **TAS (Tasmania)**: `^\d{8}$` - 8 digits
- **NT (Northern Territory)**: `^\d{6,8}$` - 6-8 digits
- **ACT (Australian Capital Territory)**: `^\d{8}$` - 8 digits

**Features**:
- Real-time WWCC number validation via API endpoint
- Format-specific error messages for each state
- Automatic formatting for display
- Validation integrated into compliance document creation

**API Endpoints**:
```
POST /compliance/validate-wwcc
Body: { wwccNumber: "12345678A", state: "VIC" }
Response: { valid: true, formatted: "1234 5678 A", state: "VIC" }
```

### 2. National Police Check (NPC) - Privacy Act Compliance

**Implementation**:
- ✅ Documents stored in **private directory** (`compliance/` with visibility: private)
- ✅ No PDF storage in public directories
- ✅ Metadata-based verification workflow
- ✅ Signed URL support for temporary document access
- ✅ Audit logging for all compliance operations

**Verification Workflow**:
1. Admin uploads NPC document to private storage
2. Document metadata stored in database
3. Admin reviews document via temporary signed URL
4. Admin toggles `verified` boolean
5. All actions logged for audit trail

### 3. Geolocation-Based Clock-in

**Service**: `GeolocationService.ts`

**Features**:
- ✅ Haversine formula for precise distance calculation
- ✅ 200m radius enforcement (Australian workplace safety standard)
- ✅ Coordinate validation (must be within Australia)
- ✅ Exception handling with reason tracking
- ✅ Accuracy level assessment (high/medium/low)
- ✅ Metadata storage for audit purposes

**Controller**: `AttendancesController.checkIn()` enhanced

**Check-in Flow**:
1. Volunteer sends coordinates on check-in
2. System validates coordinates format
3. Calculates distance to shift location using Haversine
4. If within 200m: Approve check-in
5. If outside 200m: Require exception reason
6. Store geolocation metadata for audit
7. Notify organization with distance info

**API Request**:
```json
POST /opportunities/:id/checkin
{
  "latitude": -33.8688,
  "longitude": 151.2093,
  "accuracy": 10,
  "exceptionReason": "Working from nearby location due to accessibility"
}
```

**Response**:
```json
{
  "message": "Checked in successfully",
  "attendance": { ... },
  "geolocationValid": true
}
```

### 4. Centrelink Mutual Obligation Reporting

**Service**: `CentrelinkService.ts`
**Controller**: `CentrelinkController.ts`

**Features**:
- ✅ Fortnight period calculation based on user start date
- ✅ SU462 form data generation
- ✅ CSV export with all required fields
- ✅ Hours tracking per fortnight
- ✅ Compliance validation

**Fortnight Tracking**:
- Each user has individual 14-day reporting periods
- Periods calculated from user's Centrelink start date
- System tracks: total hours, approved hours, pending hours, activities

**SU462 Export Includes**:
- **Part A**: Organization details (Name, ABN, Address, Phone, Supervisor contact)
- **Part B**: Volunteer details (Name, DOB, CRN)
- **Part C**: Activity period (Fortnight dates, period number)
- **Part D**: Hours summary (Total hours, activities count)
- **Part E**: Activity details (Date, description, hours for each)
- **Part F**: Declaration text ("Paid positions not being replaced...")

**API Endpoints**:
```
GET /centrelink/fortnight/:userId - Get current fortnight summary
GET /centrelink/su462/:userId?period=5 - Generate SU462 data
GET /centrelink/su462/:userId/csv - Export as CSV file
```

### 5. Automated Expiry Checking

**Command**: `CheckComplianceExpiry.ts`

**Features**:
- ✅ Daily scheduled task (`node ace compliance:check-expiry`)
- ✅ Checks documents expiring within 30 days
- ✅ Automatic status updates (pending → expiring → expired)
- ✅ User notifications for expiring documents
- ✅ Background check overdue tracking (14+ days)
- ✅ Different priority levels (urgent/high/medium)

**Scheduler Setup**:
Add to crontab or process manager:
```bash
# Daily at 2 AM
0 2 * * * cd /path/to/app && node ace compliance:check-expiry
```

**Notification Types**:
- `compliance.expiring` - Document expires within 30 days
- `compliance.expired` - Document has expired
- `background_check.overdue` - Check pending > 14 days

### 6. Australian Validation Helpers

**Mobile Phone Validation**:
```typescript
ComplianceService.validateAustralianMobile("0412345678")
// Returns: { valid: true }
```
Pattern: `04XX XXX XXX` or `+61 4XX XXX XXX`

**ABN Validation**:
```typescript
ComplianceService.validateABN("12 345 678 901")
// Returns: { valid: true } (includes checksum validation)
```
Pattern: 11 digits with modulo 89 checksum

**Coordinate Validation**:
```typescript
GeolocationService.isWithinAustralia(-33.8688, 151.2093)
// Returns: true (within Australia bounding box)
```
Bounds: lat -44 to -10, lon 113 to 154

### 7. Australian Test Data Seeder

**File**: `AustralianSeeder.ts`

**Seeds**:
- 3 Organizations in Sydney, Melbourne, Brisbane
- 20 Volunteers with Australian names (Matilda, Lachlan, etc.)
- Australian mobile numbers (04XX format)
- WWCC compliance docs for all AU states
- Mixed compliance statuses (verified/pending/expiring soon)
- Police check documents
- Opportunities with geolocation enabled
- All major city coordinates (Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Darwin, Canberra)

**Run Seeder**:
```bash
node ace db:seed -f database/seeders/AustralianSeeder.ts
```

## 🗄️ Database Schema Updates Required

### ComplianceDocument Model Enhancement
Current model supports:
- `docType` - Type of document (wwcc, police_check, etc.)
- `status` - Document status
- `issuedAt` - Issue date
- `expiresAt` - Expiry date
- `metadata` - JSON field for WWCC number, state, etc.

**Recommended additions**:
```typescript
// Add to metadata JSON field:
{
  wwcc: {
    number: string,
    state: string,
    formatted: string
  },
  verified: boolean,
  verifiedBy: number?, // User ID of admin
  verifiedAt: DateTime?,
  file: {
    originalName: string,
    storedName: string,
    path: string
  }
}
```

### User Model Enhancement
**Optional additions** for Centrelink:
- `centrelinkCRN` - Customer Reference Number
- `centrelinkStartDate` - Start date for fortnight calculation
- `dateOfBirth` - Required for SU462 form

### Organization Model
Already has required fields:
- `abn` - Australian Business Number
- `address`, `phone`, `email`
- `contactName`, `contactEmail`, `contactPhone` for supervisor

## 📱 Frontend Integration Required

### 1. Compliance Management UI
**Pages to enhance**: `apps/app/src/pages/admin/compliance.tsx`

**Features needed**:
- WWCC validation form with state selector
- Real-time validation feedback
- Document upload with Privacy Act notice
- Verification workflow UI
- Expiry status badges (verified/expiring/expired)
- Filter by state and status

### 2. Geolocation Check-in UI
**Component needed**: New or enhance existing check-in

**Features**:
```typescript
// Capture location
navigator.geolocation.getCurrentPosition((position) => {
  const { latitude, longitude, accuracy } = position.coords
  
  // Send to API
  api.checkInToOpportunity(opportunityId, {
    latitude,
    longitude,
    accuracy
  })
})
```

**UI Elements**:
- Location permission request
- Distance indicator (within range / outside range)
- Exception reason textarea (if outside range)
- Accuracy indicator (GPS/WiFi/Cell)
- Map showing shift location and user location

### 3. Centrelink Reporting UI
**New page**: `apps/app/src/pages/centrelink-reporting.tsx`

**Features**:
- Current fortnight display
- Hours summary (total/approved/pending)
- Activity list
- SU462 export button (CSV download)
- Historical fortnights navigation
- Progress indicator (hours vs requirement)

### 4. WWCC Validation Component
```tsx
<WWCCValidator
  onValidate={(number, state) => {
    api.validateWWCC({ wwccNumber: number, state })
  }}
/>
```

## 🔒 Security & Privacy

### Privacy Act Compliance Checklist
- ✅ Sensitive documents in private storage
- ✅ Access control via authentication
- ✅ Audit logging for all access
- ✅ No PII in public URLs
- ✅ Secure metadata storage
- ✅ Temporary signed URLs for document viewing
- ✅ Retention policy support (via expiry dates)

### Geolocation Privacy
- ✅ Location only captured during check-in (not tracked continuously)
- ✅ Coordinates stored in metadata (not exposed publicly)
- ✅ User consent required (browser permission)
- ✅ Exception handling for privacy concerns
- ✅ Accuracy level stored for context

## 📋 Testing

### WWCC Validation Tests
```bash
# Victoria
curl -X POST /compliance/validate-wwcc \
  -d '{"wwccNumber":"12345678A","state":"VIC"}'

# NSW
curl -X POST /compliance/validate-wwcc \
  -d '{"wwccNumber":"WWC1234567E","state":"NSW"}'

# Queensland Blue Card
curl -X POST /compliance/validate-wwcc \
  -d '{"wwccNumber":"12345/1","state":"QLD"}'
```

### Geolocation Tests
```bash
# Sydney coordinates
curl -X POST /opportunities/1/checkin \
  -d '{"latitude":-33.8688,"longitude":151.2093,"accuracy":10}'

# Outside radius (should require exception)
curl -X POST /opportunities/1/checkin \
  -d '{"latitude":-33.9000,"longitude":151.2093,"exceptionReason":"Working nearby"}'
```

### Centrelink Reports
```bash
# Current fortnight
curl /centrelink/fortnight/1

# SU462 export
curl /centrelink/su462/1/csv > su462_report.csv
```

### Compliance Expiry Check
```bash
# Run scheduler manually
node ace compliance:check-expiry
```

## 🚀 Next Steps

### Immediate (Week 1)
1. ✅ All services implemented
2. ✅ Controllers updated with validation
3. ✅ Routes added
4. ✅ Seeder created
5. ⏳ Frontend integration (compliance UI)
6. ⏳ Geolocation check-in UI

### Phase 2 (Week 2)
- [ ] Recurring shifts service
- [ ] Conflict detection for overlapping shifts
- [ ] Enhanced rostering UI
- [ ] Real-time messaging (AdonisJS Transmit)
- [ ] Document library with read & acknowledge

### Phase 3 (Week 3)
- [ ] Complete frontend for all AU features
- [ ] Mobile app geolocation (Capacitor)
- [ ] Push notifications for compliance
- [ ] Advanced reporting dashboards
- [ ] Compliance analytics

## 📚 References

- **WWCC**: Each state has different formats and requirements
- **Privacy Act 1988**: Governs handling of personal information
- **Centrelink SU462**: Mutual obligation reporting form
- **Australian Business Number**: 11-digit identifier with checksum
- **Workplace Safety**: 200m geofence is standard for attendance verification

## 🎯 Success Criteria

✅ WWCC validation for all 8 states/territories
✅ Privacy Act compliant document storage
✅ Geolocation check-in within 200m
✅ Centrelink SU462 export in correct format
✅ Automated expiry notifications
✅ Australian mobile/ABN validation
✅ Realistic test data with AU locations
✅ Audit logging for compliance operations

## 🏗️ Architecture Notes

- **AdonisJS v5**: Current implementation (v6 migration is separate project)
- **Lucid ORM**: Used for all database operations
- **Luxon**: Date/time handling (DateTime)
- **Drive**: File storage with private visibility
- **Commands**: Schedulable tasks for automation
- **Notifications**: Real-time alerts via database + Socket.IO

All features maintain backward compatibility and follow existing codebase patterns.
