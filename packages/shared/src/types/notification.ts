import type { NotifType } from '../constants/enums';

export interface Notification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  tipo: NotifType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  push_enviado: boolean;
  created_at: string;
}
