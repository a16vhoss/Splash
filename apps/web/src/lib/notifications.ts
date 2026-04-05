import { createClient } from '@supabase/supabase-js';

interface NotificationData {
  user_id: string;
  appointment_id?: string;
  tipo: 'reminder' | 'confirmation' | 'cancellation' | 'review_request';
  titulo: string;
  mensaje: string;
  leida?: boolean;
}

/**
 * Insert notifications using service role to bypass RLS.
 * This allows creating notifications for any user (e.g., admin notifying client).
 */
export async function insertNotifications(notifications: NotificationData[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('notifications').insert(
    notifications.map((n) => ({
      ...n,
      leida: n.leida ?? false,
    }))
  );

  if (error) {
    console.error('Error inserting notifications:', error);
  }

  return { error };
}
