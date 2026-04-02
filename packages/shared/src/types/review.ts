export interface Review {
  id: string;
  appointment_id: string;
  client_id: string;
  car_wash_id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
}
