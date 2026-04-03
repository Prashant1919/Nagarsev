// ── Auth ──────────────────────────────────────
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  token: string;
  expiresAt: number;
}

// ── Schedule ──────────────────────────────────
export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type EventPriority = 'high' | 'medium' | 'low';

export interface ScheduleEvent {
  id: string;
  date: string;          // ISO date: YYYY-MM-DD
  time: string;          // HH:MM (24-hr)
  title: string;
  description: string;
  location: string;
  status: EventStatus;
  priority: EventPriority;
  attendees: string;     // comma-separated names
  createdAt: string;
  updatedAt: string;
}

// ── Records ───────────────────────────────────
export type RecordStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type RecordPriority = 'urgent' | 'high' | 'medium' | 'low';
export type RecordCategory =
  | 'road_repair'
  | 'water_supply'
  | 'drainage'
  | 'garbage'
  | 'street_light'
  | 'encroachment'
  | 'document'
  | 'grievance'
  | 'other';

export interface CitizenRecord {
  id: string;
  citizenName: string;
  contact: string;
  ward: string;
  area: string;
  category: RecordCategory;
  subject: string;
  description: string;
  status: RecordStatus;
  priority: RecordPriority;
  followUpDate: string;
  internalNotes: string;
  resolvedNote: string;
  createdAt: string;
  updatedAt: string;
}

// ── API Response ──────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
