'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/notification-bell';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        supabase.from('users').select('role, nombre').eq('id', user.id).single()
          .then(({ data }) => {
            setRole(data?.role ?? null);
            setUser((prev: any) => ({ ...prev, nombre: data?.nombre }));
          });
      }
    });
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push('/');
    router.refresh();
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-extrabold text-primary tracking-tight">
          Splash
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/autolavados" className={`text-sm font-semibold transition-colors ${isActive('/autolavados') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Autolavados
          </Link>
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {(user.nombre ?? user.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="max-w-[120px] truncate">{user.nombre ?? user.email}</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-card border border-border shadow-modal py-1 z-50">
                  <Link href="/mis-citas" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setDropdownOpen(false)}>Mis Citas</Link>
                  <Link href="/perfil" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setDropdownOpen(false)}>Mi Perfil</Link>
                  {(role === 'wash_admin' || role === 'super_admin') && (
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-primary font-semibold hover:bg-muted" onClick={() => setDropdownOpen(false)}>Panel Admin</Link>
                  )}
                  <hr className="my-1 border-border" />
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">Cerrar sesion</button>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link href="/login" className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Iniciar sesion
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
          <Link href="/autolavados" className="block text-sm font-semibold text-foreground" onClick={() => setMenuOpen(false)}>Autolavados</Link>
          <Link href="/autolavados" className="block text-sm font-semibold text-foreground" onClick={() => setMenuOpen(false)}>Autolavados</Link>
          {user ? (
            <>
              <Link href="/mis-citas" className="block text-sm font-semibold text-foreground" onClick={() => setMenuOpen(false)}>Mis Citas</Link>
              <Link href="/perfil" className="block text-sm font-semibold text-foreground" onClick={() => setMenuOpen(false)}>Mi Perfil</Link>
              <button onClick={handleLogout} className="block text-sm font-semibold text-destructive">Cerrar sesion</button>
            </>
          ) : (
            <Link href="/login" className="block text-sm font-semibold text-primary" onClick={() => setMenuOpen(false)}>Iniciar sesion</Link>
          )}
        </div>
      )}
    </nav>
  );
}
