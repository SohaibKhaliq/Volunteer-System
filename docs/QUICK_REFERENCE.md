# Quick Reference Guide - Common Tasks

## Table of Contents
- [Real-Time Features](#real-time-features)
- [API Calls](#api-calls)
- [File Uploads](#file-uploads)
- [QR Code Scanning](#qr-code-scanning)
- [Forms](#forms)
- [Data Fetching](#data-fetching)
- [Notifications](#notifications)

---

## Real-Time Features

### Add a new Socket.IO event

1. **Add event handler in `useSocket.ts`**:
```typescript
socket.on('my-custom-event', (data: any) => {
  console.log('[Socket.IO] My custom event:', data);
  toast.success('Something happened!');
  
  // Invalidate relevant queries
  queryClient.invalidateQueries({ queryKey: ['my', 'data'] });
});
```

### Notification mapping (server -> client)

The backend posts Notification model changes to the socket server's internal endpoint which emits a single `notification` event. The client `useSocket` hook will parse the incoming payload's `type` and dispatch to the appropriate UI behaviour (toasts, confetti, and React Query invalidations).

Common server notification types and client behaviour:
- `new_application` → same as `new-application` handler (toast + invalidate `['organization','applications']`)
- `application_accepted` / `application_rejected` → application status notification for volunteers (toast + invalidate `['volunteer','applications']`)
- `hours_approved` / `hours_rejected` → hours notifications (toast + invalidate `['volunteer','hours']` and `['hours']`)
- `volunteer_checked_in` → live check-in (toast + invalidate `['organization','attendances']` and `['admin','monitoring']`)
- `achievement_earned` → confetti + invalidate `['volunteer','achievements']`

If you add a new notification type on the API, update `useSocket` to handle it or ensure the frontend notification bell picks it up via the generic handler.

2. **Listen in component** (if needed):
```typescript
import { useSocketContext } from '@/providers/socket-provider';

function MyComponent() {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      // Custom logic
    };

    socket.on('my-event', handler);
    return () => socket.off('my-event', handler);
  }, [socket]);
}
```

---

## API Calls

### Fetch data (GET)
```typescript
import { useQuery } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => volunteerApi.browseOpportunities({ location: 'Seattle' }),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <List items={data} />;
}
```

### Create/Update data (POST/PUT)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import organizationApi from '@/lib/api/organizationApi';
import { toast } from 'sonner';

function CreateOpportunity() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: organizationApi.createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create opportunity');
    },
  });

  const handleSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

### Fetch with pagination
```typescript
function PaginatedList() {
  const [page, setPage] = useState(1);
  
  const { data } = useQuery({
    queryKey: ['items', page],
    queryFn: () => api.list('items', { page, perPage: 20 }),
    keepPreviousData: true, // Prevent flickering
  });

  return (
    <>
      <Items data={data?.items} />
      <Pagination page={page} total={data?.totalPages} onChange={setPage} />
    </>
  );
}
```

---

## File Uploads

### Single file upload
```typescript
import FileUpload from '@/components/molecules/file-upload';

function UploadDocument() {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    formData.append('file', files[0]);
    
    await organizationApi.uploadDocument(formData);
    toast.success('Document uploaded!');
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept={{ 'application/pdf': ['.pdf'] }}
      maxSize={5 * 1024 * 1024} // 5MB
      multiple={false}
    />
  );
}
```

### Multiple file upload with preview
```typescript
function UploadImages() {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    await api.uploadImages(formData);
    toast.success(`${files.length} images uploaded!`);
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
      maxSize={10 * 1024 * 1024}
      maxFiles={10}
      multiple
      showPreview
    />
  );
}
```

---

## QR Code Scanning

### Basic QR scanner
```typescript
import QRScanner from '@/components/molecules/qr-scanner';

function CheckIn() {
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
        <Camera className="mr-2" />
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

---

## Forms

### Form with validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Too short'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Input {...register('title')} />
        {errors.title && <span>{errors.title.message}</span>}
      </div>
      
      <div>
        <Input type="email" {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Form with mutation
```typescript
function CreateForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  
  const mutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      toast.success('Created!');
      form.reset();
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

---

## Data Fetching

### Dependent queries
```typescript
function UserProfile({ userId }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
  });

  // Second query depends on first
  const { data: hours } = useQuery({
    queryKey: ['hours', userId],
    queryFn: () => api.getUserHours(userId),
    enabled: !!user, // Only run if user exists
  });

  return <div>...</div>;
}
```

### Parallel queries
```typescript
function Dashboard() {
  const queries = useQueries({
    queries: [
      { queryKey: ['stats'], queryFn: api.getStats },
      { queryKey: ['recent'], queryFn: api.getRecent },
      { queryKey: ['alerts'], queryFn: api.getAlerts },
    ],
  });

  const [stats, recent, alerts] = queries;
  
  if (queries.some(q => q.isLoading)) return <Spinner />;
  
  return (
    <>
      <Stats data={stats.data} />
      <Recent data={recent.data} />
      <Alerts data={alerts.data} />
    </>
  );
}
```

### Infinite scroll
```typescript
function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 1 }) => api.list({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length + 1 : undefined,
  });

  return (
    <>
      {data?.pages.map(page => 
        page.items.map(item => <Item key={item.id} {...item} />)
      )}
      
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </>
  );
}
```

---

## Notifications

### Show toast
```typescript
import { toast } from 'sonner';

// Success
toast.success('Operation successful!');

// Error
toast.error('Something went wrong', {
  description: 'Please try again later',
});

// Info
toast.info('New message', {
  description: 'You have 3 unread messages',
});

// Warning
toast.warning('Low stock', {
  description: 'Only 2 items remaining',
});

// Custom duration
toast.success('Saved!', {
  duration: 3000, // 3 seconds
});

// With action
toast.success('Email sent!', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```

### Show confetti
```typescript
import confetti from 'canvas-confetti';

// Basic confetti
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
});

// Celebration
confetti({
  particleCount: 200,
  spread: 100,
  origin: { y: 0.5 },
  colors: ['#FFD700', '#FFA500', '#FF6347'],
});

// Cannon from side
confetti({
  particleCount: 50,
  angle: 60,
  spread: 55,
  origin: { x: 0 },
});
```

---

## Common Patterns

### Loading skeleton
```typescript
function MyComponent() {
  const { data, isLoading } = useQuery(...);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  return <div>{/* actual content */}</div>;
}
```

### Error boundary
```typescript
import ErrorBoundary from '@/components/atoms/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Dialog/Modal
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function MyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {/* content */}
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Select dropdown
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function MySelect() {
  const [value, setValue] = useState('');

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

---

## Troubleshooting

### Query not updating
- Check queryKey matches between query and invalidation
- Use React Query DevTools to inspect cache
- Verify mutation onSuccess is called

### Socket not connecting
- Check VITE_SOCKET_URL environment variable
- Verify token in localStorage
- Check browser console for errors

### File upload failing
- Check file size limits
- Verify accepted file types
- Check network tab for upload errors
- Ensure backend handles multipart/form-data

### Form validation not working
- Ensure Zod schema is correct
- Check zodResolver is imported
- Verify error messages are displayed

---

## Useful Commands

```bash
# Start development server
pnpm run dev

# Lint code
pnpm run lint

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3333
VITE_SOCKET_URL=http://localhost:3333
```
