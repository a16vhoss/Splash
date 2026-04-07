'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  appointment_id: string | null;
}

interface NotificationBellProps {
  role?: string | null;
}

const typeIcons: Record<string, string> = {
  confirmation: '✓',
  cancellation: '✕',
  reminder: '⏰',
  review_request: '⭐',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function NotificationBell({ role }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-card border border-border shadow-modal z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">
                Marcar todas como leidas
              </button>
            )}
          </div>
          {loading && notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                  if (role === 'wash_admin') {
                    router.push('/admin/citas');
                  } else {
                    router.push('/mis-citas');
                  }
                }}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.leida ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{typeIcons[n.tipo] ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${!n.leida ? 'font-bold' : 'font-medium'} text-foreground truncate`}>
                        {n.titulo}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensaje}</p>
                  </div>
                  {!n.leida && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
