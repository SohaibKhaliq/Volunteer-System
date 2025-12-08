# Volunteer Management Platform - Developer Guide

## Overview
This is a comprehensive volunteer management platform built with React 18, TypeScript, and a robust real-time infrastructure. The platform supports three primary user roles: Volunteers, Organizations, and Administrators.

## Tech Stack

### Core Framework
- **React 18.2** - UI framework with strict mode
- **TypeScript 5.0** - Type-safe development
- **Vite 4.4** - Fast build tool with HMR
- **React Router DOM 6.16** - Client-side routing

### State Management & Data Fetching
- **TanStack Query v4** (React Query) - Server state management, caching, and synchronization
- **Zustand 4.4** - Lightweight client state management
- **Socket.IO Client 4.8** - Real-time bidirectional communication

### UI & Styling
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **shadcn/ui** - Radix UI based component library
- **Lucide React** - Icon library
- **Sonner** - Beautiful toast notifications
- **Canvas Confetti** - Celebration animations

### Forms & Validation
- **React Hook Form 7.46** - Performant form library
- **Zod 3.22** - TypeScript-first schema validation
- **@hookform/resolvers** - Zod integration for React Hook Form

### Advanced Features
- **react-dropzone 14.3** - File upload with drag & drop
- **@zxing/library 0.21** - QR code scanning
- **Recharts 2.6** - Data visualization
- **date-fns 2.30** - Date manipulation
- **React Leaflet 4.2** - Interactive maps

## Project Structure

```
apps/app/src/
├── components/
│   ├── ui/              # Shadcn/ui base components
│   ├── atoms/           # Small reusable components
│   ├── molecules/       # Composite components
│   └── templates/       # Layout components
├── hooks/               # Custom React hooks
│   └── useSocket.ts     # Socket.IO hook
├── lib/
│   ├── api/            # API client modules
│   │   ├── publicApi.ts
│   │   ├── volunteerApi.ts
│   │   ├── organizationApi.ts
│   │   ├── adminApi.ts
│   │   └── index.ts
│   ├── axios.ts        # Axios instance
│   ├── routes.tsx      # Route configuration
│   └── store.ts        # Zustand store
├── pages/              # Route components
│   ├── admin/          # Admin panel pages
│   ├── organization/   # Organization panel pages
│   └── volunteer/      # Volunteer panel pages
└── providers/          # Context providers
    ├── app-provider.tsx
    ├── socket-provider.tsx
    └── theme-provider.tsx
```

## API Client Architecture

The API client is organized into four modules based on user roles and authentication requirements:

### 1. Public API (`publicApi.ts`)
No authentication required. Used for public-facing features.

```typescript
import { publicApi } from '@/lib/api';

// Get public organizations
const orgs = await publicApi.getPublicOrganizations({ city: 'Seattle' });

// Get organization detail by slug
const org = await publicApi.getPublicOrganization('red-cross-seattle');

// Submit survey (no auth)
await publicApi.submitSurveyResponse(surveyId, responses);
```

**Available Endpoints:**
- Health check
- Contact form
- Public organizations (list, detail, cities, countries, types)
- Public events
- Public opportunities
- Survey submissions
- Calendar feeds
- AI helpers (match, forecast)

### 2. Volunteer API (`volunteerApi.ts`)
Authenticated endpoints for volunteers.

```typescript
import { volunteerApi } from '@/lib/api';

// Browse opportunities
const opportunities = await volunteerApi.browseOpportunities({
  location: 'Seattle',
  skills: ['first-aid', 'teaching']
});

// Apply to opportunity
await volunteerApi.applyToOpportunity(opportunityId, 'I have 5 years experience...');

// Check in with QR code
await volunteerApi.qrCheckIn(qrCodeString);

// Get achievements
const achievements = await volunteerApi.getMyAchievements();
```

**Available Endpoints:**
- Dashboard & profile
- Opportunities (browse, bookmark)
- Applications (list, apply, withdraw)
- Attendance (check-in, check-out, QR scan)
- Hours tracking
- Organizations (join, leave)
- Achievements
- Calendar

### 3. Organization API (`organizationApi.ts`)
Authenticated endpoints for organization team members.

```typescript
import { organizationApi } from '@/lib/api';

// Get dashboard stats
const stats = await organizationApi.getDashboardStats();

// Create opportunity
await organizationApi.createOpportunity({
  title: 'Food Bank Volunteer',
  date: '2024-03-15',
  slots: 10
});

// Bulk approve applications
await organizationApi.bulkUpdateApplications([1, 2, 3], 'approved');

// Export volunteers to CSV
const blob = await organizationApi.exportVolunteers();
saveAs(blob, 'volunteers.csv');

// Invite team member
await organizationApi.inviteTeamMember({
  email: 'john@example.com',
  role: 'manager'
});
```

**Available Endpoints:**
- Profile & settings
- Team management (invite, roles)
- Teams/departments
- Events
- Opportunities (CRUD, publish)
- Applications (list, bulk actions)
- Attendances (live view, manual check-in, QR codes)
- Volunteers (directory, export)
- Compliance (documents)
- Hours approval (pending, bulk approve)
- Analytics (trends, leaderboard)
- Communications (send, broadcast)
- Achievements (custom badges)
- Resources
- Import/Export (CSV)
- Reports (12 pre-built)

### 4. Admin API (`adminApi.ts`)
Authenticated endpoints for platform administrators.

```typescript
import { adminApi } from '@/lib/api';

// Get platform dashboard
const dashboard = await adminApi.getDashboard();

// Approve organization
await adminApi.approveOrganization(orgId);

// Suspend user
await adminApi.disableUser(userId, 'Violated terms of service');

// Get monitoring stats
const stats = await adminApi.getMonitoringStats();

// Create notification template
await adminApi.createNotificationTemplate({
  key: 'welcome_volunteer',
  subject: 'Welcome {{name}}!',
  body: 'Thanks for joining...'
});
```

**Available Endpoints:**
- Dashboard & analytics
- Organization management (approve, suspend, archive)
- User management (enable, disable, roles)
- Events, tasks, shifts
- Hours tracking
- Compliance & background checks
- Notification templates
- System settings & branding
- Backup & restore
- Invite send jobs
- Scheduled jobs
- Monitoring
- Communications
- Reports & exports
- Resources
- Audit logs
- Surveys
- Courses
- Assignments
- Achievements
- Roles & types
- Notifications
- Calendar

### Unified API (Backwards Compatible)

For backwards compatibility, all APIs are also available through the default export:

```typescript
import api from '@/lib/api';

// Works exactly like before
await api.login(credentials);
await api.getVolunteerDashboard();
await api.listOrganizationOpportunities();
```

## Real-Time System (Socket.IO)

### Socket.IO Provider

The Socket.IO connection is managed globally through `SocketProvider`:

```typescript
// Already integrated in apps/app/src/providers/index.tsx
import { SocketProvider } from '@/providers/socket-provider';

function App() {
  return (
    <SocketProvider>
      <YourApp />
    </SocketProvider>
  );
}
```

### Using Socket Context

```typescript
import { useSocketContext } from '@/providers/socket-provider';

function MyComponent() {
  const { socket, isConnected } = useSocketContext();

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Real-Time Events

The socket hook automatically handles these events and invalidates React Query caches:

| Event | Fired When | UI Updates |
|-------|-----------|------------|
| `new-application` | Volunteer applies to opportunity | Applications list refreshes + toast + sound |
| `application-status-change` | Application approved/rejected | Volunteer applications update + toast |
| `hours-approved` | Hours approved by organization | Hours list refreshes + confetti + toast |
| `hours-rejected` | Hours rejected | Hours list refreshes + toast with reason |
| `new-notification` | New notification created | Notification center refreshes + badge + sound |
| `live-checkin` | Volunteer checks in | Attendance page refreshes + toast |
| `achievement-earned` | Achievement unlocked | Achievements refresh + confetti + modal |
| `system-announcement` | Admin broadcasts message | Banner toast (10s duration) |

### Custom Socket Listeners

To add custom logic for socket events:

```typescript
import { useEffect } from 'react';
import { useSocketContext } from '@/providers/socket-provider';

function MyComponent() {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleCustomEvent = (data) => {
      console.log('Custom event:', data);
      // Your custom logic
    };

    socket.on('my-custom-event', handleCustomEvent);

    return () => {
      socket.off('my-custom-event', handleCustomEvent);
    };
  }, [socket]);
}
```

## Key Components

### QR Scanner

Mobile-first QR code scanner using device camera:

```typescript
import QRScanner from '@/components/molecules/qr-scanner';

function CheckInPage() {
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScan = async (code: string) => {
    try {
      await volunteerApi.qrCheckIn(code);
      toast.success('Checked in successfully!');
      setScannerOpen(false);
    } catch (error) {
      toast.error('Invalid QR code');
    }
  };

  return (
    <>
      <Button onClick={() => setScannerOpen(true)}>
        Scan QR Code
      </Button>
      
      <QRScanner
        isOpen={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />
    </>
  );
}
```

**Features:**
- Auto camera selection (prefers back camera on mobile)
- Real-time scanning with visual feedback
- Sound notification on successful scan
- Error handling for camera access
- Responsive design

### File Upload

Drag & drop file upload with progress tracking:

```typescript
import FileUpload from '@/components/molecules/file-upload';

function ComplianceUpload() {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    await organizationApi.uploadDocument(formData);
    toast.success('Documents uploaded!');
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept={{
        'application/pdf': ['.pdf'],
        'image/*': ['.png', '.jpg', '.jpeg']
      }}
      maxSize={10 * 1024 * 1024} // 10MB
      maxFiles={5}
      multiple
      showPreview
    />
  );
}
```

**Features:**
- Drag & drop support
- File type validation
- Size limits
- Progress bar
- File preview with icons
- Remove uploaded files
- Mobile-friendly

## React Query Usage

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';

function MyOpportunities() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['volunteer', 'opportunities'],
    queryFn: () => volunteerApi.browseOpportunities(),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <OpportunitiesList opportunities={data} />;
}
```

### Mutation with Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';

function BookmarkButton({ opportunityId }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: volunteerApi.bookmarkOpportunity,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'bookmarks'] });
      toast.success('Bookmark added!');
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate(opportunityId)}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Saving...' : 'Bookmark'}
    </Button>
  );
}
```

### Pagination

```typescript
import { useQuery } from '@tanstack/react-query';

function PaginatedList() {
  const [page, setPage] = useState(1);
  
  const { data } = useQuery({
    queryKey: ['volunteers', page],
    queryFn: () => organizationApi.listVolunteers({ page, perPage: 20 }),
    keepPreviousData: true, // Prevent UI flicker
  });

  return (
    <>
      <List items={data?.items} />
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

## Form Handling

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  date: z.string(),
  slots: z.number().min(1).max(100),
});

type FormData = z.infer<typeof schema>;

function CreateOpportunityForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: organizationApi.createOpportunity,
    onSuccess: () => {
      toast.success('Opportunity created!');
      navigate('/organization/opportunities');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('title')}
        error={errors.title?.message}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

## Best Practices

### 1. API Calls
- Always use the modular API clients (publicApi, volunteerApi, etc.)
- Use React Query for data fetching (don't call API directly in components)
- Handle loading and error states
- Use toast notifications for user feedback

### 2. Real-Time Updates
- Socket.IO automatically invalidates React Query caches
- Don't manually poll for updates - let Socket.IO handle it
- Use optimistic updates for better UX

### 3. Forms
- Always use Zod for validation
- Use React Hook Form for performance
- Handle server-side validation errors
- Show loading state during submission

### 4. File Uploads
- Use FileUpload component for consistency
- Show progress feedback
- Validate file types and sizes
- Handle upload errors gracefully

### 5. Accessibility
- Use semantic HTML
- Include ARIA labels
- Support keyboard navigation
- Test with screen readers

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server (app + API socket server)
pnpm run dev

# Lint code
pnpm run lint

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Environment Variables

Create `.env` file in `apps/app/`:

```env
VITE_API_URL=http://localhost:3333
VITE_SOCKET_URL=http://localhost:3333
```

## Deployment

### Build

```bash
cd apps/app
pnpm run build
```

Outputs to `apps/app/dist/`

### Environment

Set these in production:
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.IO server URL (usually same as API)

## Troubleshooting

### Socket.IO Not Connecting
- Check `VITE_SOCKET_URL` is correct
- Verify auth token in localStorage
- Check browser console for errors
- Ensure backend Socket.IO server is running

### React Query Cache Not Updating
- Check queryKey matches between query and invalidation
- Verify mutation onSuccess is called
- Use React Query DevTools to debug

### File Upload Not Working
- Check file size limits
- Verify accepted file types
- Check network tab for upload errors
- Ensure backend handles multipart/form-data

### QR Scanner Not Working
- Check camera permissions
- Ensure HTTPS in production (required for camera)
- Test on different devices
- Check browser compatibility

## Support

For issues or questions:
1. Check the code comments
2. Review the IMPLEMENTATION_SUMMARY.md
3. Check the backend API documentation
4. Review Socket.IO server logs

## License

See LICENSE file in repository root.
