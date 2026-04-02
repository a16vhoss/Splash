import type { SubStatus } from '../constants/enums';

export interface Subscription {
  id: string;
  car_wash_id: string;
  stripe_subscription_id: string;
  plan: string;
  status: SubStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  created_at: string;
}
