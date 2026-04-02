export interface Service {
  id: string;
  car_wash_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  orden: number;
  activo: boolean;
  created_at: string;
}
