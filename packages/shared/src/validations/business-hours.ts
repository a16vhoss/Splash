import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const businessHoursSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_apertura: z.string().regex(timeRegex, 'Formato HH:mm'),
  hora_cierre: z.string().regex(timeRegex, 'Formato HH:mm'),
  cerrado: z.boolean(),
}).refine(
  (data) => data.cerrado || data.hora_cierre > data.hora_apertura,
  { message: 'La hora de cierre debe ser mayor a la de apertura', path: ['hora_cierre'] }
);

export const weekScheduleSchema = z.array(businessHoursSchema).length(7);

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
