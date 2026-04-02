export type { User } from './user';
export type { CarWash } from './car-wash';
export type { Service } from './service';
export type { Appointment } from './appointment';
export type { Review } from './review';
export type { Notification } from './notification';
export type { Subscription } from './subscription';

export interface BusinessHours {
  id: string;
  car_wash_id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  cerrado: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  estaciones_libres: number;
}
