export const PAYMENT_METHODS = {
  efectivo: 'Efectivo',
  tarjeta_sitio: 'Tarjeta en sitio',
  transferencia: 'Transferencia',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_STATUS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  reembolsado: 'Reembolsado',
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;
