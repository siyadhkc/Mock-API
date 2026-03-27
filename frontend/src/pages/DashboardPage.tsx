import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Zap, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { endpointsApi, type MockEndpoint } from '../api/endpoints'
import { useWorkspaceStore } from '../store/workspace'
import { Button, EmptyState, Spinner, Modal } from '../components/ui'
import { methodClass, relativeTime } from '../utils'
import EndpointFormModal from '../components/endpoint/EndpointFormModal'
import EndpointDetailDrawer from '../components/endpoint/EndpointDetailDrawer'

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editEndpoint, setEditEndpoint] = useState<MockEndpoint | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['endpoints', activeWorkspace?.id],
    queryFn: () => endpointsApi.list(activeWorkspace?.id),
    enabled: !!activeWorkspace,
  })

  const deleteMut = useMutation({
    mutationFn: endpointsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['endpoints'] }); toast.success('Deleted') },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      endpointsApi.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['endpoints'] }),
  })

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const filtered = endpoints.filter((e) => {
    const matchSearch = search
      ? e.path.toLowerCase().includes(search.toLowerCase()) || e.name.toLowerCase().includes(search.toLowerCase())
      : true
    const matchMethod = methodFilter === 'ALL' || e.method === methodFilter
    return matchSearch && matchMethod
  })

  if (!activeWorkspace) {
    return (
      <div className="p-8">
        <EmptyState
          icon="🗂️"
          title="No workspace selected"
          description="Select or create a workspace from the sidebar to get started."
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Endpoints</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeWorkspace.name} · {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus size={14} /> New endpoint
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search path or name..."
            className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
        </div>
        <div className="flex gap-1">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                methodFilter === m
                  ? 'bg-accent text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📡"
          title="No endpoints yet"
          description="Create your first mock endpoint to start intercepting requests."
          action={<Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> New endpoint</Button>}
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((ep) => (
            <EndpointRow
              key={ep.id}
              endpoint={ep}
              onEdit={() => setEditEndpoint(ep)}
              onDelete={() => { if (confirm('Delete this endpoint?')) deleteMut.mutate(ep.id) }}
              onToggle={() => toggleMut.mutate({ id: ep.id, is_active: !ep.is_active })}
              onClick={() => setDetailId(ep.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <EndpointFormModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowForm(false)}
        />
      )}
      {editEndpoint && (
        <EndpointFormModal
          workspaceId={activeWorkspace.id}
          endpoint={editEndpoint}
          onClose={() => setEditEndpoint(null)}
        />
      )}
      {detailId && (
        <EndpointDetailDrawer
          endpointId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}

function EndpointRow({ endpoint, onEdit, onDelete, onToggle, onClick }: {
  endpoint: MockEndpoint
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer group transition-all hover:border-accent/40 hover:bg-surface-raised ${
        endpoint.is_active ? 'border-surface-border bg-surface-raised' : 'border-surface-border/50 bg-surface opacity-60'
      }`}
      onClick={onClick}
    >
      <span className={methodClass(endpoint.method)}>{endpoint.method}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-slate-200 truncate">{endpoint.path}</span>
          {endpoint.name && <span className="text-xs text-slate-500 truncate">· {endpoint.name}</span>}
        </div>
        {endpoint.description && (
          <p className="text-xs text-slate-600 truncate mt-0.5">{endpoint.description}</p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Zap size={11} /> {endpoint.response_count} response{endpoint.response_count !== 1 ? 's' : ''}
        </span>
        <span>{relativeTime(endpoint.updated_at)}</span>
      </div>

      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-surface-elevated border border-surface-border rounded-lg shadow-xl z-10 w-36 overflow-hidden" onMouseLeave={() => setMenuOpen(false)}>
            <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-surface-border/50">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={() => { onToggle(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-surface-border/50">
              {endpoint.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
              {endpoint.is_active ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
