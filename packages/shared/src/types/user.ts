import type { UserRole } from '../constants/enums';

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  avatar_url: string | null;
  role: UserRole;
  auth_provider: 'email' | 'google' | 'apple';
  activo: boolean;
  created_at: string;
  updated_at: string;
}
