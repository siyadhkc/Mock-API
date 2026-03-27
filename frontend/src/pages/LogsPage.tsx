import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Radio, ChevronRight } from 'lucide-react'
import { logsApi, type RequestLog } from '../api/logs'
import { useWorkspaceStore } from '../store/workspace'
import { useLogSocket } from '../hooks/useLogSocket'
import { methodClass, statusBg, relativeTime } from '../utils'
import { EmptyState, Spinner } from '../components/ui'

export default function LogsPage() {
  const { activeWorkspace } = useWorkspaceStore()
  const [liveLogs, setLiveLogs] = useState<RequestLog[]>([])
  const [selected, setSelected] = useState<RequestLog | null>(null)
  const [paused, setPaused] = useState(false)

  const { data: historical, isLoading } = useQuery({
    queryKey: ['logs', activeWorkspace?.id],
    queryFn: () => logsApi.list({ workspace: activeWorkspace?.id }),
    enabled: !!activeWorkspace,
  })

  const onLog = useCallback((log: RequestLog) => {
    if (!paused) setLiveLogs((prev) => [log, ...prev].slice(0, 200))
  }, [paused])

  useLogSocket(activeWorkspace?.id ?? null, onLog)

  const allLogs = [...liveLogs, ...(historical?.results ?? [])].reduce<RequestLog[]>((acc, log) => {
    if (!acc.find((l) => l.id === log.id)) acc.push(log)
    return acc
  }, [])

  if (!activeWorkspace) {
    return (
      <div className="p-8">
        <EmptyState icon="📡" title="No workspace selected" description="Select a workspace from the sidebar." />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Log list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-100">Live Logs</h1>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`} />
              {paused ? 'Paused' : 'Live'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveLogs.length > 0 && (
              <button onClick={() => setLiveLogs([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear
              </button>
            )}
            <button
              onClick={() => setPaused(!paused)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${paused ? 'border-accent text-accent' : 'border-surface-border text-slate-400 hover:border-slate-500'}`}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        {/* Log table */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : allLogs.length === 0 ? (
            <EmptyState
              icon={<Radio size={32} />}
              title="No requests yet"
              description="Hit a mock endpoint and logs will appear here in real time."
            />
          ) : (
            <div className="divide-y divide-surface-border">
              {allLogs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  selected={selected?.id === log.id}
                  onClick={() => setSelected(selected?.id === log.id ? null : log)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <LogDetailPanel log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function LogRow({ log, selected, onClick }: { log: RequestLog; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors hover:bg-surface-raised group ${selected ? 'bg-surface-raised border-l-2 border-accent' : ''}`}
    >
      <span className={methodClass(log.method)}>{log.method}</span>

      <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusBg(log.status_code)}`}>
        {log.status_code}
      </span>

      <span className="font-mono text-sm text-slate-300 flex-1 truncate">{log.endpoint_path}</span>

      <span className="text-xs text-slate-500 shrink-0">{log.duration_ms}ms</span>

      <span className="text-xs text-slate-600 shrink-0 w-20 text-right">{relativeTime(log.created_at)}</span>

      <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </div>
  )
}

function LogDetailPanel({ log, onClose }: { log: RequestLog; onClose: () => void }) {
  const [tab, setTab] = useState<'request' | 'response'>('request')

  return (
    <div className="w-96 border-l border-surface-border flex flex-col bg-surface-raised overflow-hidden shrink-0">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={methodClass(log.method)}>{log.method}</span>
          <span className="font-mono text-xs text-slate-400 truncate max-w-[180px]">{log.endpoint_path}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">&times;</button>
      </div>

      <div className="flex border-b border-surface-border">
        {(['request', 'response'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 ${tab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {tab === 'request' ? (
          <>
            <Section title="Query params" data={log.query_params} />
            <Section title="Headers" data={log.request_headers} />
            {log.request_body && (
              <div>
                <p className="text-slate-500 uppercase tracking-wider mb-2">Body</p>
                <pre className="font-mono text-slate-400 bg-surface rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {(() => { try { return JSON.stringify(JSON.parse(log.request_body), null, 2) } catch { return log.request_body } })()}
                </pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Kv label="IP" value={log.ip_address} />
              <Kv label="Duration" value={`${log.duration_ms}ms`} />
            </div>
          </>
        ) : (
          <>
            <Kv label="Status" value={String(log.status_code)} />
            <Kv label="Matched response" value={log.matched_response ?? 'none'} />
            <Kv label="Timestamp" value={new Date(log.created_at).toLocaleString()} />
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, data }: { title: string; data: Record<string, any> }) {
  const entries = Object.entries(data ?? {})
  if (entries.length === 0) return null
  return (
    <div>
      <p className="text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-slate-500 shrink-0 w-28 truncate">{k}</span>
            <span className="text-slate-300 font-mono truncate flex-1">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-lg px-3 py-2">
      <p className="text-slate-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-300 font-mono truncate">{value}</p>
    </div>
  )
}
