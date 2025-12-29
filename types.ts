export enum OutreachStatus {
  NEW = 'NEW',
  DRAFTED = 'DRAFTED',
  CALLED = 'CALLED',
  SENT_WHATSAPP = 'SENT_WHATSAPP',
  SENT_EMAIL = 'SENT_EMAIL',
  REPLIED = 'REPLIED',
  INTERESTED = 'INTERESTED',
  NOT_INTERESTED = 'NOT_INTERESTED'
}

export interface Business {
  id: string; // Unique ID (often place_id or generated)
  name: string;
  address: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  website?: string;
  phoneNumber?: string;
  email?: string;
  googleMapsUri?: string;
  snippet?: string; // A short description from the map result
  digitalGap?: string; // AI insight about what they are missing
}

export interface OutreachRecord {
  businessId: string;
  businessName: string;
  status: OutreachStatus;
  lastUpdated: number; // Timestamp
  pitchContent?: string;
  notes?: string;
  channel?: 'whatsapp' | 'email' | 'call';
  followUpDate?: string; // YYYY-MM-DD
  plan?: string;
}

export interface SearchFilters {
  radius: number; // in km
  hasWebsite?: boolean;
  minRating?: number;
}