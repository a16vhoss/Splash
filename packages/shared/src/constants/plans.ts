export const SUBSCRIPTION_PLANS = [
  { id: 'basico', name: 'Basico', priceMXN: 499, maxEstaciones: 1, features: ['Servicios ilimitados', '1 estacion de lavado', 'Panel de administracion'] },
  { id: 'pro', name: 'Pro', priceMXN: 999, maxEstaciones: 5, features: ['Servicios ilimitados', 'Hasta 5 estaciones', 'Reportes avanzados', 'Panel de administracion'] },
  { id: 'premium', name: 'Premium', priceMXN: 1999, maxEstaciones: Infinity, features: ['Servicios ilimitados', 'Estaciones ilimitadas', 'Reportes avanzados', 'Soporte prioritario'] },
] as const;

export const TRIAL_DAYS = 14;
export const SLOT_DURATION_MIN = 30;
export const CANCELLATION_HOURS_LIMIT = 2;
export const REMINDER_HOURS_BEFORE = 2;
export const REVIEW_REQUEST_HOURS_AFTER = 1;
