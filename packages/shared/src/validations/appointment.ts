import { z } from 'zod';

export const createAppointmentSchema = z.object({
  car_wash_id: z.string().uuid(),
  service_id: z.string().uuid(),
  fecha: z.string().date(),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  notas_cliente: z.string().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  motivo_cancelacion: z.string().min(1, 'Motivo requerido').max(500),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
