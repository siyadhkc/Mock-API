import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
