export enum RequestTypes {
  Rescue = 'rescue',
  MedicalAssistance = 'medical_assistance',
  Food = 'food',
  Shelter = 'shelter',
  Other = 'other'
}

export interface HelpRequest {
  id: number;
  caseId: string;
  urgencyScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  name: string;
  phone: string;
  types: Array<{ type: RequestTypes }>;
  description: string;
  source: string;
  createdAt: string;
  status: string;
  contactMethod?: string;
  isVerified?: boolean;
  email?: string;
  metaData?: any;
  location?: {
    lat: number;
    lng: number;
  };
}
