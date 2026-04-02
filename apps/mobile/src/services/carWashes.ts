import { supabase } from './supabase';
import type { CarWash } from '@splash/shared';

export async function fetchNearbyCarWashes(): Promise<CarWash[]> {
  const { data, error } = await supabase
    .from('car_washes')
    .select('*')
    .eq('activo', true)
    .order('rating_promedio', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CarWash[];
}

export async function fetchCarWashWithServices(id: string): Promise<{ carWash: CarWash; services: any[] }> {
  const [carWashResult, servicesResult] = await Promise.all([
    supabase.from('car_washes').select('*').eq('id', id).single(),
    supabase.from('services').select('*').eq('car_wash_id', id).eq('activo', true).order('orden'),
  ]);

  if (carWashResult.error) throw carWashResult.error;
  if (servicesResult.error) throw servicesResult.error;

  return {
    carWash: carWashResult.data as CarWash,
    services: servicesResult.data ?? [],
  };
}
