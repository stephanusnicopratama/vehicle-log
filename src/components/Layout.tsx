import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-slate-800 text-white'
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200',
  ].join(' ')

export function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-24 pt-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Vehicle Log
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Catat kendaraan &amp; pajak
        </h1>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-around gap-1 px-2 py-2">
          <NavLink to="/" end className={linkClass}>
            Beranda
          </NavLink>
          <NavLink to="/vehicles" className={linkClass}>
            Kendaraan
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            Pengaturan
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
