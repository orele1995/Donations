import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Repeat,
  History,
  Settings,
  LogOut,
  Users,
} from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: labels.dashboard },
  { to: '/reports', icon: FileText, label: labels.reports },
  { to: '/fixed-donations', icon: Repeat, label: labels.fixedDonations },
  { to: '/audit', icon: History, label: labels.auditLog },
  { to: '/settings', icon: Settings, label: labels.settings },
  { to: '/members', icon: Users, label: labels.members },
]

export function AppShell() {
  const { profile, signOut, isDemo } = useAuth()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-teal-900 text-white md:w-64 md:border-b-0 md:border-l">
        <div className="p-4">
          <h1 className="text-lg font-bold">{labels.appShort}</h1>
          <p className="mt-1 truncate text-sm text-teal-100">
            {profile?.displayName}
            {isDemo && ' (הדגמה)'}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-800',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden p-4 md:block">
          <Button variant="outline" size="sm" className="w-full border-teal-600 text-white hover:bg-teal-800" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
            {labels.signOut}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
