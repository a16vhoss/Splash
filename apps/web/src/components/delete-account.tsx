'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DeleteAccount({ isAdmin }: { isAdmin?: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (confirmText !== 'ELIMINAR') return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al eliminar cuenta');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      setError('Error al eliminar cuenta');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card border border-red-200 bg-red-50/50 p-6">
      <h3 className="text-base font-semibold text-red-700 mb-1">Eliminar cuenta</h3>
      <p className="text-sm text-red-600/80 mb-4">
        {isAdmin
          ? 'Se eliminarán permanentemente tu cuenta, todos tus negocios, citas, servicios, reseñas y toda la información asociada. Esta acción no se puede deshacer.'
          : 'Se eliminarán permanentemente tu cuenta, tus citas, reseñas y toda tu información. Esta acción no se puede deshacer.'}
      </p>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-card bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-700">
            Escribe <span className="font-bold">ELIMINAR</span> para confirmar:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            className="w-full max-w-xs rounded-input border border-red-300 bg-white px-3 py-2 text-sm text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/30"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== 'ELIMINAR' || loading}
              className="rounded-card bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : 'Confirmar eliminación'}
            </button>
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setConfirmText(''); setError(null); }}
              className="rounded-card border border-border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
