export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Splash. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="/autolavados" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Autolavados</a>
        </div>
      </div>
    </footer>
  );
}
