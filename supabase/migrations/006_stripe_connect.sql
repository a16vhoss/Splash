-- Phase 4: Stripe Connect for online payments

-- Stripe Connect account for car washes
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- Stripe payment reference on appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
