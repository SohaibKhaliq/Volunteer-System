export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  volunteerStatus?: string | null;
  isActive?: boolean; // derived on frontend if not provided
  isDisabled?: number; // 0 or 1 from DB
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles?: { id: number; name: string; description?: string }[];
  participationCount?: number;
  complianceStatus?: 'compliant' | 'pending' | 'expired';
}
