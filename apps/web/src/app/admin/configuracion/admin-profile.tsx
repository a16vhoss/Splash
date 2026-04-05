'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AvatarUpload } from '@/components/avatar-upload';
import { useToast } from '@/components/toast';

interface AdminProfileProps {
  user: {
    id: string;
    nombre: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function AdminProfileSection({ user }: AdminProfileProps) {
  const supabase = createClient();
  const toast = useToast();
  const [nombre, setNombre] = useState(user.nombre ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nombre.trim()) return;
    setSaving(true);
    await supabase.from('users').update({ nombre: nombre.trim() }).eq('id', user.id);
    setEditing(false);
    setSaving(false);
    toast('Nombre actualizado');
  }

  return (
    <section className="rounded-card bg-card p-6 shadow-card">
      <h3 className="text-base font-semibold text-foreground mb-4">Mi perfil</h3>
      <div className="flex items-center gap-4">
        <AvatarUpload
          userId={user.id}
          currentUrl={user.avatar_url}
          nombre={user.nombre}
          size={72}
        />
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-input border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-input bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                {saving ? '...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(false); setNombre(user.nombre ?? ''); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-foreground">{user.nombre || 'Sin nombre'}</p>
              <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">
                Editar
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </section>
  );
}
