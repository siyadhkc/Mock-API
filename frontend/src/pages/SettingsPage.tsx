import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api/auth'
import { Button, Input } from '../components/ui'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'api'>('profile')

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-surface-border">
        {(['profile', 'api'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'api' ? 'API Keys' : 'Profile'}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileSection />}
      {tab === 'api' && <ApiKeySection />}
    </div>
  )
}

function ProfileSection() {
  const { user, setUser } = useAuthStore()
  const { register, handleSubmit } = useForm({ defaultValues: { username: user?.username ?? '' } })

  const mutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (u) => { setUser(u); toast.success('Profile updated') },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-6">
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Profile</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Email" value={user?.email} disabled className="opacity-60 cursor-not-allowed" />
          <Input label="Username" {...register('username')} />
          <Button type="submit" loading={mutation.isPending} size="sm">Save changes</Button>
        </form>
      </div>

      <div className="bg-surface-raised border border-red-900/40 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Danger zone</h2>
        <p className="text-xs text-slate-500 mb-4">Once deleted, your account and all data cannot be recovered.</p>
        <Button variant="danger" size="sm" onClick={() => toast.error('Contact your admin to delete your account.')}>
          Delete account
        </Button>
      </div>
    </div>
  )
}

function ApiKeySection() {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  function saveKey() {
    if (!key.startsWith('sk-ant-')) { toast.error('Invalid Anthropic API key format'); return }
    sessionStorage.setItem('anthropic_api_key', key)
    setSaved(true)
    toast.success('API key saved for this session')
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Anthropic API key (BYOK)</h2>
        <p className="text-xs text-slate-500 mb-4">
          MockAPI Pro uses your own Anthropic key to generate AI mock responses. Keys are never stored server-side — they are used only for the duration of the generation request.
        </p>
        <div className="flex gap-3">
          <Input
            type="password"
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false) }}
            className="flex-1"
          />
          <Button size="sm" onClick={saveKey} variant={saved ? 'outline' : 'primary'}>
            {saved ? '✓ Saved' : 'Save key'}
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Stored in sessionStorage only. Cleared on tab close.</p>
      </div>

      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Log retention</h2>
        <p className="text-xs text-slate-500">
          Request logs are retained for 30 days by default. Configure via the <code className="text-accent font-mono">LOG_RETENTION_DAYS</code> environment variable on the server.
        </p>
      </div>
    </div>
  )
}
