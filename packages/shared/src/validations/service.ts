import { z } from 'zod';

export const serviceSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  descripcion: z.string().max(1000).optional().nullable(),
  precio: z.number().positive('El precio debe ser mayor a 0').max(99999),
  duracion_min: z.number().int().min(15, 'Minimo 15 minutos').max(480, 'Maximo 8 horas'),
  categoria: z.enum(['lavado', 'detailing', 'otro']).default('lavado'),
  es_complementario: z.boolean().default(false),
  activo: z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
