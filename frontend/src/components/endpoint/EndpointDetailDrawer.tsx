import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, Sparkles, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { endpointsApi, type MockResponse, type ResponseRule } from '../../api/endpoints'
import { Button, Badge, Spinner, Textarea, Input, Select } from '../ui'
import { methodClass, statusBg, copyToClipboard } from '../../utils'
import ResponseFormPanel from './ResponseFormPanel'

interface Props {
  endpointId: string
  onClose: () => void
}

export default function EndpointDetailDrawer({ endpointId, onClose }: Props) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'responses' | 'logs'>('responses')
  const [addingResponse, setAddingResponse] = useState(false)
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)

  const { data: endpoint, isLoading } = useQuery({
    queryKey: ['endpoint', endpointId],
    queryFn: () => endpointsApi.get(endpointId),
  })

  const deleteResponseMut = useMutation({
    mutationFn: endpointsApi.deleteResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoint', endpointId] })
      toast.success('Response deleted')
    },
  })

  if (isLoading || !endpoint) {
    return (
      <div className="fixed inset-0 z-40 flex">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative ml-auto w-full max-w-2xl bg-surface-raised h-full flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  const mockUrl = `${window.location.origin}/mock/${endpoint.workspace ? '' : 'WORKSPACE_SLUG'}${endpoint.path}`

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-surface-raised h-full flex flex-col border-l border-surface-border overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center gap-3">
          <span className={methodClass(endpoint.method)}>{endpoint.method}</span>
          <span className="font-mono text-sm text-slate-200 flex-1 truncate">{endpoint.path}</span>
          <div className={`w-2 h-2 rounded-full ${endpoint.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Mock URL bar */}
        <div className="px-6 py-3 border-b border-surface-border bg-surface">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Mock URL</span>
            <code className="flex-1 text-xs font-mono text-accent bg-accent/10 px-3 py-1.5 rounded-lg truncate">
              {mockUrl}
            </code>
            <button
              onClick={() => { copyToClipboard(mockUrl); toast.success('Copied!') }}
              className="text-slate-500 hover:text-accent transition-colors"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border px-6">
          {(['responses', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === 'responses' && (
            <>
              {(endpoint.responses ?? []).map((resp) => (
                <ResponseCard
                  key={resp.id}
                  response={resp}
                  expanded={expandedResponse === resp.id}
                  onToggle={() => setExpandedResponse(expandedResponse === resp.id ? null : resp.id)}
                  onDelete={() => { if (confirm('Delete response?')) deleteResponseMut.mutate(resp.id) }}
                  endpointId={endpointId}
                />
              ))}

              {(endpoint.responses ?? []).length === 0 && !addingResponse && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No responses yet. Add one to start serving mock data.
                </div>
              )}

              {addingResponse ? (
                <ResponseFormPanel
                  endpointId={endpointId}
                  onDone={() => setAddingResponse(false)}
                />
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddingResponse(true)} className="w-full mt-2">
                  <Plus size={13} /> Add response
                </Button>
              )}
            </>
          )}

          {activeTab === 'logs' && (
            <div className="text-sm text-slate-500 text-center py-10">
              Open the Live Logs tab in the sidebar to see real-time request logs for this endpoint.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResponseCard({ response, expanded, onToggle, onDelete, endpointId }: {
  response: MockResponse; expanded: boolean
  onToggle: () => void; onDelete: () => void; endpointId: string
}) {
  const qc = useQueryClient()
  const [aiKey, setAiKey] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAI, setShowAI] = useState(false)

  const aiMut = useMutation({
    mutationFn: () => endpointsApi.generateAI(endpointId, aiKey, aiPrompt),
    onSuccess: () => {
      toast.success('AI generation started — refresh shortly')
      qc.invalidateQueries({ queryKey: ['endpoint', endpointId] })
      setShowAI(false)
    },
    onError: () => toast.error('AI generation failed'),
  })

  const bodyPreview = response.body.length > 120 ? response.body.slice(0, 120) + '…' : response.body

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      {/* Response header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-elevated transition-colors"
        onClick={onToggle}
      >
        <span className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${statusBg(response.status_code)}`}>
          {response.status_code}
        </span>
        <span className="text-sm text-slate-300 flex-1">{response.name}</span>
        {response.is_default && <Badge variant="info">default</Badge>}
        {response.is_ai_generated && <Badge variant="success">AI</Badge>}
        {response.rules.length > 0 && <Badge>{response.rules.length} rule{response.rules.length !== 1 ? 's' : ''}</Badge>}
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={12} />
        </button>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-surface-border px-4 py-4 space-y-4 bg-surface">
          {/* Rules */}
          {response.rules.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Match rules (AND)</p>
              <div className="space-y-1">
                {response.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono bg-surface-elevated px-3 py-1.5 rounded-lg">
                    <span className="text-blue-400">{rule.source}</span>
                    <span className="text-slate-500">.</span>
                    <span className="text-slate-300">{rule.field}</span>
                    <span className="text-yellow-400">{rule.operator}</span>
                    {rule.value && <span className="text-emerald-400">"{rule.value}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wider text-slate-500">Response body</p>
              <span className="text-xs text-slate-600">{response.body_type}</span>
            </div>
            <pre className="text-xs text-slate-400 font-mono bg-surface-elevated px-3 py-2.5 rounded-lg overflow-x-auto max-h-40">
              {bodyPreview}
            </pre>
          </div>

          {/* AI generation */}
          <div>
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent transition-colors"
            >
              <Sparkles size={11} /> Generate AI response
            </button>
            {showAI && (
              <div className="mt-3 space-y-3">
                <Input label="Anthropic API key (BYOK)" type="password" placeholder="sk-ant-..." value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
                <Input label="Prompt hint (optional)" placeholder="Include pagination, 10 users..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                <Button size="sm" loading={aiMut.isPending} onClick={() => aiMut.mutate()} disabled={!aiKey}>
                  <Sparkles size={12} /> Generate
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
