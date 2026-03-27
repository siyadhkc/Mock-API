import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, Radio, FileText, Settings, LogOut, Plus, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useWorkspaceStore } from '../../store/workspace'
import { workspacesApi } from '../../api/workspaces'
import { authApi } from '../../api/auth'
import { cn } from '../../utils'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Endpoints' },
  { to: '/logs', icon: Radio, label: 'Live Logs' },
  { to: '/docs', icon: FileText, label: 'API Docs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, refreshToken } = useAuthStore()
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore()
  const [wsOpen, setWsOpen] = useState(false)

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  })

  async function handleLogout() {
    try { if (refreshToken) await authApi.logout(refreshToken) } catch {}
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 h-screen flex flex-col bg-surface-raised border-r border-surface-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold font-mono">M</span>
          </div>
          <span className="font-semibold text-slate-100 text-sm tracking-tight">MockAPI Pro</span>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="px-3 py-3 border-b border-surface-border relative">
        <button
          onClick={() => setWsOpen(!wsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-border/50 transition-colors text-left"
        >
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Workspace</p>
            <p className="text-sm text-slate-200 font-medium truncate">
              {activeWorkspace?.name ?? 'Select workspace'}
            </p>
          </div>
          <ChevronDown size={14} className={cn('text-slate-500 shrink-0 transition-transform', wsOpen && 'rotate-180')} />
        </button>

        {wsOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-surface-elevated border border-surface-border rounded-lg shadow-xl z-50 overflow-hidden">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws); setWsOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-surface-border/50 transition-colors',
                  activeWorkspace?.id === ws.id ? 'text-accent' : 'text-slate-300'
                )}
              >
                {ws.name}
              </button>
            ))}
            <Link
              to="/workspaces/new"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-accent hover:bg-surface-border/50 border-t border-surface-border transition-colors"
              onClick={() => setWsOpen(false)}
            >
              <Plus size={13} /> New workspace
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-elevated'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-surface-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-accent text-xs font-bold shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
