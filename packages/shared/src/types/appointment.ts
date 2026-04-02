import type { AppointmentStatus } from '../constants/enums';

export interface Appointment {
  id: string;
  client_id: string;
  car_wash_id: string;
  service_id: string;
  estacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: AppointmentStatus;
  precio_cobrado: number;
  notas_cliente: string | null;
  notas_admin: string | null;
  cancelado_por: string | null;
  motivo_cancelacion: string | null;
  recordatorio_enviado: boolean;
  created_at: string;
  updated_at: string;
}
