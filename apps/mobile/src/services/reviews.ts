import { supabase } from './supabase';

export interface SubmitReviewParams {
  appointment_id: string;
  car_wash_id: string;
  rating: number;
  comentario?: string;
}

export async function submitReview(params: SubmitReviewParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('reviews').insert({
    client_id: user.id,
    appointment_id: params.appointment_id,
    car_wash_id: params.car_wash_id,
    rating: params.rating,
    comentario: params.comentario ?? null,
  });

  if (error) throw error;
}
