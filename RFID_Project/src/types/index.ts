export enum Role {
  ADMIN = 'Admin',
  ENGINEER = 'Engineer',
  STAFF = 'Staff',
  VISITOR = 'Visitor',
  SECURITY = 'Security',
}

export interface Character {
  id: number;
  name: string;
  role: Role;
  rfidCode: string;
  avatar: string;
  position?: { x: number; y: number };
  isRegistered?: boolean;
  isSystem?: boolean;
  lastKnownZone?: string;
  pin?: string; // For setting/updating PIN (hashed on backend)
}

export interface Door {
  id: number;
  name: string;
  requiredRoles: Role[];
  position: { x: number; y: number };
  orientation: 'horizontal' | 'vertical';
  size: number;
}

export interface LogMetadata {
  userAgent?: string;
  sessionId?: string;
  location?: string;
  deviceId?: string;
  item?: string;
}

export interface LogMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'access_granted' | 'access_denied' | 'system_alert';
  timestamp: string; // ISO string from backend, or local time string
  user?: number;
  metadata?: {
    zone?: string;
    device?: string;
    details?: any;
    userAgent?: string;
    sessionId?: string;
    item?: string;
  };
}

export interface AlertRule {
  id: number;
  name: string;
  type: 'error_rate' | 'unauthorized_access' | 'keyword_match';
  threshold?: number;
  interval?: number;
  keyword?: string;
  action: 'notify';
  active: boolean;
  lastTriggered?: number;
}

export interface Wall {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Room {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum ObjectType {
  COMPUTER = 'Computer',
  COFFEE_MACHINE = 'Coffee Machine',
}

export interface InteractableObject {
  id: number;
  name: string;
  type: ObjectType;
  position: { x: number; y: number };
  requiredRoles: Role[];
}
