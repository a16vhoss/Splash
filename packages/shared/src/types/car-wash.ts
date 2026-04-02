import type { SubStatus } from '../constants/enums';

export interface CarWash {
  id: string;
  owner_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string | null;
  logo_url: string | null;
  cover_url: string | null;
  rating_promedio: number;
  total_reviews: number;
  num_estaciones: number;
  activo: boolean;
  verificado: boolean;
  stripe_customer_id: string | null;
  subscription_status: SubStatus;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}
