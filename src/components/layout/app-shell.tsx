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
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col border-b border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] shadow-sm md:w-60 md:border-b-0 md:border-l">
        <div className="border-b border-[var(--color-border)] p-5">
          <h1 className="bg-gradient-to-l from-indigo-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent">
            {labels.appShort}
          </h1>
          <p className="mt-1 truncate text-sm text-[var(--color-muted-foreground)]">
            {profile?.displayName}
          </p>
        </div>
        <nav className="flex flex-1 gap-1 overflow-x-auto p-3 md:flex-col">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            {labels.signOut}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
