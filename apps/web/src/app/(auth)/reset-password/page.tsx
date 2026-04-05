'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // The auth callback already exchanged the code and set the session
    // Check if we have a valid session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('Error al actualizar la contraseña. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Splash</h1>
        </div>

        <div className="bg-white border border-border rounded-card shadow-sm p-8">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-slate-500">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Verificando enlace...</h2>
              <p className="text-sm text-slate-500">Si el enlace expiró, solicita uno nuevo desde el login.</p>
              <a href="/login" className="inline-block mt-4 text-sm text-primary font-semibold hover:underline">
                Volver al login
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Nueva contraseña</h2>
              <p className="text-sm text-slate-500 mb-6">Ingresa tu nueva contraseña</p>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirmar contraseña</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repite tu contraseña"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-card bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                  {loading ? 'Actualizando...' : 'ACTUALIZAR CONTRASEÑA'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Splash. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
