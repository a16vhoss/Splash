import { z } from 'zod';

export const reviewSchema = z.object({
  appointment_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Minimo 1 estrella').max(5, 'Maximo 5 estrellas'),
  comentario: z.string().max(1000).optional().nullable(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
