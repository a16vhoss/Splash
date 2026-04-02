import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Ingresa tu password'),
});

export const updateProfileSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  telefono: z.string().regex(/^\+?[0-9]{10,15}$/, 'Telefono invalido').optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
