export const UserRole = {
  CLIENT: 'client',
  WASH_ADMIN: 'wash_admin',
  SUPER_ADMIN: 'super_admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AppointmentStatus = {
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RATED: 'rated',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const NotifType = {
  REMINDER: 'reminder',
  CONFIRMATION: 'confirmation',
  CANCELLATION: 'cancellation',
  REVIEW_REQUEST: 'review_request',
} as const;
export type NotifType = (typeof NotifType)[keyof typeof NotifType];

export const SubStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
} as const;
export type SubStatus = (typeof SubStatus)[keyof typeof SubStatus];
