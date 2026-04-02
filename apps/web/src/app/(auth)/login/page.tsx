'use client';

import { useState } from 'react';
import { loginAction, registerAction } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const action = mode === 'login' ? loginAction : registerAction;
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-primary mb-4">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Splash</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Panel de administracion' : 'Registra tu autolavado'}
          </p>
        </div>

        {/* Toggle tabs */}
        <div className="flex mb-6 bg-muted rounded-card p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-[6px] transition-colors duration-200 ${
              mode === 'login' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-[6px] transition-colors duration-200 ${
              mode === 'register' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Registrar negocio
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-border rounded-card shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">Tu nombre</label>
                  <input id="nombre" name="nombre" type="text" required placeholder="Carlos Lopez"
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nombre_negocio" className="block text-sm font-medium text-slate-700">Nombre del autolavado</label>
                  <input id="nombre_negocio" name="nombre_negocio" type="text" required placeholder="AutoSpa Premium"
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="direccion" className="block text-sm font-medium text-slate-700">Direccion del negocio</label>
                  <input id="direccion" name="direccion" type="text" required placeholder="Av. Reforma 222, CDMX"
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com"
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
                placeholder={mode === 'register' ? 'Minimo 8 caracteres' : '••••••••'}
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>

            {error && (
              <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-card bg-primary text-white font-semibold uppercase tracking-wider text-sm transition-opacity disabled:opacity-60 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
              {loading
                ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...')
                : (mode === 'login' ? 'INGRESAR' : 'REGISTRAR MI NEGOCIO')
              }
            </button>

            {mode === 'register' && (
              <p className="text-xs text-center text-muted-foreground">
                Trial gratuito de 14 dias. Sin tarjeta de credito.
              </p>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Splash. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
