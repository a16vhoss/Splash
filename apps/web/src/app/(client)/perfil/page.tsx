
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PerfilPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { router.push('/login'); return; }
      supabase.from('users').select('*').eq('id', authUser.id).single()
        .then(({ data }) => {
          setUser(data);
          setLoading(false);
        });
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Mi Perfil</h1>

      {/* User info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white">
            {user?.nombre?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{user?.nombre}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2 mb-8">
        <Link href="/mis-citas" className="flex items-center justify-between p-4 rounded-card border border-border bg-white hover:bg-muted/30 transition-colors">
          <span className="text-sm font-semibold text-foreground">Mis Citas</span>
          <span className="text-muted-foreground">›</span>
        </Link>
        <div className="flex items-center justify-between p-4 rounded-card border border-border bg-white opacity-50">
          <span className="text-sm font-semibold text-foreground">Notificaciones</span>
          <span className="text-xs text-muted-foreground">Proximamente</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-card bg-destructive text-white font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
      >
        Cerrar sesion
      </button>
    </div>
  );
}
