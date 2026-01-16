
export enum QueueStatus {
  BOOKED = 'BOOKED',         // Pre-registered (Booking confirmed, not yet at location)
  CHECKED_IN = 'CHECKED_IN', // Driver Arrived & Validated Booking
  AT_GATE = 'AT_GATE',       // Arrived at Security Gate
  VERIFIED = 'VERIFIED',     // Security Approved -> Waiting in Yard
  REJECTED = 'REJECTED',     // Security Rejected
  CALLED = 'CALLED',         // Admin Assigned Gate
  LOADING = 'LOADING',       // At Dock / Loading Started
  COMPLETED = 'COMPLETED',   // Loading Finished / Documents Received
  EXITED = 'EXITED',         // Security Checked Out
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum Gate {
  NONE = 'NONE',
  GATE_2 = 'GATE_2',
  GATE_4 = 'GATE_4'
}

export enum Priority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT'
}

export enum EntryType {
  WALK_IN = 'WALK_IN',
  BOOKING = 'BOOKING'
}

export interface DriverData {
  id: string;
  bookingCode?: string; // New: Unique 6-char code for lookup
  slotTime?: string;    // New: "08:00 - 10:00"
  slotDate?: string;    // New: "2023-10-25"
  
  name: string;
  licensePlate: string;
  company: string; 
  pic?: string;    
  phone: string;
  purpose: 'LOADING' | 'UNLOADING';
  doNumber: string; 
  documentFile?: string; 
  itemType?: string;
  notes?: string;
  entryType: EntryType;
  status: QueueStatus;
  gate: Gate;
  queueNumber?: string; 
  priority: Priority;
  checkInTime: number;      
  arrivedAtGateTime?: number; 
  verifiedTime?: number;    
  calledTime?: number;      
  loadingStartTime?: number;
  endTime?: number;         
  exitTime?: number;        
  verifiedBy?: string;
  calledBy?: string;
  exitVerifiedBy?: string;
  rejectionReason?: string;
  securityNotes?: string;
  adminNotes?: string;
  photoBeforeURLs?: string[];
  photoAfterURLs?: string[];
}

export interface SlotInfo {
  id: string;
  timeLabel: string; // "08:00 - 10:00"
  capacity: number;
  booked: number;
  isAvailable: boolean;
}

export interface Stats {
  totalCheckIn: number;
  waiting: number;
  loading: number;
  completed: number;
  avgDwellTime: number; 
}

// --- ADMIN & MASTER DATA TYPES ---

export interface RegularDriver {
  id: string;
  name: string;
  phone: string;
  vendor: string;
  license_plate: string;
  status: 'ACTIVE' | 'BLACKLIST';
  rating?: number;        // 1-5 Stars
  sim_expiry?: string;    // YYYY-MM-DD
  created_at?: string;
}

export interface SystemSetting {
  id: string;
  category: 'VENDOR_TYPE' | 'PIC_NAME' | 'ITEM_TYPE' | 'DOC_TYPE' | 'GATE_CONFIG';
  value: string;
  label: string;
  created_at?: string;
}

export interface GateConfig {
  id: string; // from system_settings.id
  name: string; // from system_settings.label
  capacity: number;
  status: 'OPEN' | 'MAINTENANCE' | 'CLOSED';
  type: 'GENERAL' | 'DOCK';
}

export interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'ADMIN' | 'SECURITY' | 'MANAGER';
  email?: string;
  phone?: string;
  pin_code?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface DivisionConfig {
  id: string; // The Login ID (e.g., SECURITY)
  name: string; // Display Name (e.g., Field Operations)
  password: string; // Shared Password
  role: 'ADMIN' | 'SECURITY' | 'MANAGER'; // Permission Level
  theme: 'emerald' | 'blue' | 'purple' | 'orange' | 'slate'; // Color Theme
}
