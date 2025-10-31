export interface Pharmacy {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  rxVolume: number;
  contactPerson?: string;
  email: string | null;
  lastContact?: string;
  prescriptions?: Array<{ drug: string; count: number }>;
}

export interface PharmacyApiResponse {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  contactPerson?: string;
  email?: string;
  lastContact?: string;
  prescriptions?: Array<{ drug: string; count: number }>;
}

export enum RxVolumeTier {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNKNOWN = 'UNKNOWN',
}
