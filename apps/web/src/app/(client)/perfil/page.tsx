'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { DeleteAccount } from '@/components/delete-account';
import { AvatarUpload } from '@/components/avatar-upload';
import { useToast } from '@/components/toast';

export default function PerfilPage() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nombre, setNombre] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { router.push('/login'); return; }
      supabase.from('users').select('*').eq('id', authUser.id).single()
        .then(({ data }) => {
          setUser(data);
          setNombre(data?.nombre ?? '');
          setTelefono(data?.telefono ?? '');
          setLoading(false);
        });
    });
  }, []);

  async function handleSaveName() {
    if (!user || !nombre.trim()) return;
    setSavingName(true);
    await supabase.from('users').update({ nombre: nombre.trim() }).eq('id', user.id);
    setUser({ ...user, nombre: nombre.trim() });
    setEditingName(false);
    setSavingName(false);
    toast('Nombre actualizado');
  }

  async function handleSavePhone() {
    if (!user) return;
    setSavingPhone(true);
    await supabase.from('users').update({ telefono: telefono.trim() || null }).eq('id', user.id);
    setUser({ ...user, telefono: telefono.trim() || null });
    setEditingPhone(false);
    setSavingPhone(false);
    toast('Telefono actualizado');
  }

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

      {/* Avatar + Info */}
      <div className="flex items-center gap-4 mb-8">
        <AvatarUpload
          userId={user?.id}
          currentUrl={user?.avatar_url}
          nombre={user?.nombre}
          size={80}
          onUploaded={(url) => setUser({ ...user, avatar_url: url })}
        />
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-input border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="rounded-input bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                {savingName ? '...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditingName(false); setNombre(user?.nombre ?? ''); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground">{user?.nombre || 'Sin nombre'}</p>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-primary hover:underline"
              >
                Editar
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {editingPhone ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 5512345678"
                inputMode="tel"
                className="rounded-input border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                autoFocus
              />
              <button
                onClick={handleSavePhone}
                disabled={savingPhone}
                className="rounded-input bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                {savingPhone ? '...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditingPhone(false); setTelefono(user?.telefono ?? ''); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">{user?.telefono || 'Sin telefono'}</p>
              <button
                onClick={() => setEditingPhone(true)}
                className="text-xs text-primary hover:underline"
              >
                {user?.telefono ? 'Cambiar' : 'Agregar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2 mb-8">
        <Link href="/mis-citas" className="flex items-center justify-between p-4 rounded-card border border-border bg-white hover:bg-muted/30 transition-colors">
          <span className="text-sm font-semibold text-foreground">Mis Citas</span>
          <span className="text-muted-foreground">&rsaquo;</span>
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 mb-8 rounded-card bg-destructive text-white font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
      >
        Cerrar sesion
      </button>

      {/* Delete account */}
      <DeleteAccount />
    </div>
  );
}
