'use client';

import { useState } from 'react';
import { loginAction, registerAction, registerClientAction } from './actions';
import { createClient } from '@/lib/supabase/client';

type Screen = 'role-select' | 'login' | 'register-select' | 'register' | 'forgot-password';
type Role = 'admin' | 'client';

export default function LoginPage() {
  const [screen, setScreen] = useState<Screen>('role-select');
  const [role, setRole] = useState<Role>('client');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goTo(next: Screen) {
    setScreen(next);
    setError(null);
    setSuccess(null);
  }

  function selectLoginRole(r: Role) {
    setRole(r);
    setScreen('login');
    setError(null);
  }

  function selectRegisterRole(r: Role) {
    setRole(r);
    setScreen('register');
    setError(null);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const action = role === 'admin' ? registerAction : registerClientAction;
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    if (!email) {
      setError('Email requerido');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    });

    if (error) {
      setError('Error al enviar el correo. Intenta de nuevo.');
    } else {
      setSuccess('Te enviamos un enlace a tu correo. Revisa tu bandeja de entrada.');
    }
    setLoading(false);
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Splash</h1>
        </div>

        {/* ===== PANTALLA 1: Selección de rol para LOGIN ===== */}
        {screen === 'role-select' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-8">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-1">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 text-center mb-6">¿Cómo deseas ingresar?</p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => selectLoginRole('admin')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-card border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-slate-900">Administrador de negocio</span>
                  <span className="block text-xs text-slate-500">Gestiona tu autolavado</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => selectLoginRole('client')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-card border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-slate-900">Cliente</span>
                  <span className="block text-xs text-slate-500">Agenda tu lavado</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-sm text-center text-slate-500">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => goTo('register-select')} className="text-primary font-semibold hover:underline">
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ===== PANTALLA 2: Formulario de LOGIN ===== */}
        {screen === 'login' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-8">
            <button type="button" onClick={() => goTo('role-select')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 -mt-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>

            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {role === 'admin' ? 'Ingreso administrador' : 'Ingreso cliente'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <button type="button" onClick={() => goTo('forgot-password')} className="text-xs text-primary hover:underline font-medium">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className={inputClass} />
              </div>

              {error && (
                <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 rounded-card bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
            </form>

            <p className="mt-5 text-sm text-center text-slate-500">
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => goTo('register-select')} className="text-primary font-semibold hover:underline">
                Regístrate aquí
              </button>
            </p>
          </div>
        )}

        {/* ===== PANTALLA 3: Selección de rol para REGISTRO ===== */}
        {screen === 'register-select' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-8">
            <button type="button" onClick={() => goTo('role-select')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 -mt-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>

            <h2 className="text-lg font-semibold text-slate-900 text-center mb-1">Crear cuenta</h2>
            <p className="text-sm text-slate-500 text-center mb-6">¿Qué tipo de cuenta necesitas?</p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => selectRegisterRole('admin')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-card border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-slate-900">Registrar mi negocio</span>
                  <span className="block text-xs text-slate-500">14 días de prueba gratis</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => selectRegisterRole('client')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-card border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-slate-900">Soy cliente</span>
                  <span className="block text-xs text-slate-500">Agenda lavados fácilmente</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-sm text-center text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => goTo('role-select')} className="text-primary font-semibold hover:underline">
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ===== PANTALLA 4: Formulario de REGISTRO ===== */}
        {screen === 'register' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-8">
            <button type="button" onClick={() => goTo('register-select')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 -mt-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>

            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {role === 'admin' ? 'Registrar mi negocio' : 'Crear cuenta de cliente'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {role === 'admin' ? 'Completa los datos de tu autolavado' : 'Completa tus datos para comenzar'}
            </p>

            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">Tu nombre</label>
                <input id="nombre" name="nombre" type="text" required placeholder="Carlos López" className={inputClass} />
              </div>

              {role === 'admin' && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="nombre_negocio" className="block text-sm font-medium text-slate-700">Nombre del autolavado</label>
                    <input id="nombre_negocio" name="nombre_negocio" type="text" required placeholder="AutoSpa Premium" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="direccion" className="block text-sm font-medium text-slate-700">Dirección del negocio</label>
                    <input id="direccion" name="direccion" type="text" required placeholder="Av. Reforma 222, CDMX" className={inputClass} />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required placeholder="Mínimo 8 caracteres" className={inputClass} />
              </div>

              {error && (
                <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 rounded-card bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                {loading ? 'Creando cuenta...' : (role === 'admin' ? 'REGISTRAR MI NEGOCIO' : 'CREAR MI CUENTA')}
              </button>

              {role === 'admin' && (
                <p className="text-xs text-center text-muted-foreground">
                  Trial gratuito de 14 días. Sin tarjeta de crédito.
                </p>
              )}
            </form>

            <p className="mt-5 text-sm text-center text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => goTo('role-select')} className="text-primary font-semibold hover:underline">
                Inicia sesión
              </button>
            </p>
          </div>
        )}

        {/* ===== PANTALLA 5: Olvidé mi contraseña ===== */}
        {screen === 'forgot-password' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-8">
            <button type="button" onClick={() => goTo('login')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 -mt-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver al login
            </button>

            <h2 className="text-lg font-semibold text-slate-900 mb-1">Recuperar contraseña</h2>
            <p className="text-sm text-slate-500 mb-6">Te enviaremos un enlace para restablecer tu contraseña</p>

            <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" className={inputClass} />
              </div>

              {error && (
                <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-input bg-green-50 border border-green-200 px-3 py-2">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 rounded-card bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                {loading ? 'Enviando...' : 'ENVIAR ENLACE'}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Splash. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
