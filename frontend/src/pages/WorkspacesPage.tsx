import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Users, Zap, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { workspacesApi, type Workspace } from '../api/workspaces'
import { useWorkspaceStore } from '../store/workspace'
import { Button, Modal, Input, Textarea, EmptyState, Spinner, Badge } from '../components/ui'
import { relativeTime } from '../utils'

export default function WorkspacesPage() {
  const qc = useQueryClient()
  const { setActiveWorkspace } = useWorkspaceStore()
  const [showCreate, setShowCreate] = useState(false)
  const [inviteWs, setInviteWs] = useState<Workspace | null>(null)

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  })

  const deleteMut = useMutation({
    mutationFn: workspacesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspaces'] }); toast.success('Workspace deleted') },
  })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Workspaces</h1>
          <p className="text-sm text-slate-500 mt-0.5">Organise endpoints by team or project</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : workspaces.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="No workspaces yet"
          description="Create your first workspace to start building mock APIs."
          action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Create workspace</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              onSelect={() => setActiveWorkspace(ws)}
              onInvite={() => setInviteWs(ws)}
              onDelete={() => { if (confirm(`Delete "${ws.name}"?`)) deleteMut.mutate(ws.id) }}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      {inviteWs && <InviteModal workspace={inviteWs} onClose={() => setInviteWs(null)} />}
    </div>
  )
}

function WorkspaceCard({ workspace, onSelect, onInvite, onDelete }: {
  workspace: Workspace; onSelect: () => void; onInvite: () => void; onDelete: () => void
}) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-5 hover:border-accent/40 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">{workspace.name}</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">/{workspace.slug}</p>
        </div>
        <Badge variant={workspace.user_role === 'owner' ? 'info' : 'default'}>{workspace.user_role}</Badge>
      </div>

      {workspace.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{workspace.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1.5"><Zap size={11} /> {workspace.endpoint_count} endpoints</span>
        <span className="flex items-center gap-1.5"><Users size={11} /> {workspace.member_count} members</span>
        <span>{relativeTime(workspace.updated_at)}</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onSelect}>Open</Button>
        {['owner', 'admin'].includes(workspace.user_role) && (
          <Button size="sm" variant="outline" onClick={onInvite}><UserPlus size={13} /></Button>
        )}
        {workspace.user_role === 'owner' && (
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 size={13} className="text-red-500" /></Button>
        )}
      </div>
    </div>
  )
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; description: string }>()

  const mutation = useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspaces'] }); toast.success('Workspace created!'); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.name?.[0] ?? 'Failed to create workspace'),
  })

  return (
    <Modal open title="New workspace" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input label="Name" placeholder="My Project" error={errors.name?.message}
          {...register('name', { required: 'Required' })} />
        <Textarea label="Description (optional)" placeholder="What is this workspace for?" rows={3}
          {...register('description')} />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">Create</Button>
        </div>
      </form>
    </Modal>
  )
}

function InviteModal({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm<{ email: string; role: string }>({
    defaultValues: { role: 'member' },
  })

  const mutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      workspacesApi.invite(workspace.id, email, role),
    onSuccess: () => { toast.success('Invitation sent'); reset() },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to invite'),
  })

  const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ]

  return (
    <Modal open title={`Invite to ${workspace.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input label="Email address" type="email" placeholder="colleague@example.com" {...register('email', { required: true })} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</label>
          <select {...register('role')} className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Close</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">Send invite</Button>
        </div>
      </form>
    </Modal>
  )
}
