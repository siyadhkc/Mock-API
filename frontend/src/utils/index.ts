import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function statusColor(code: number): string {
  if (code >= 500) return 'text-red-400'
  if (code >= 400) return 'text-yellow-400'
  if (code >= 300) return 'text-blue-400'
  return 'text-emerald-400'
}

export function statusBg(code: number): string {
  if (code >= 500) return 'bg-red-900/40 text-red-300'
  if (code >= 400) return 'bg-yellow-900/40 text-yellow-300'
  if (code >= 300) return 'bg-blue-900/40 text-blue-300'
  return 'bg-emerald-900/40 text-emerald-300'
}

export function methodClass(method: string): string {
  const map: Record<string, string> = {
    GET: 'method-GET', POST: 'method-POST', PUT: 'method-PUT',
    PATCH: 'method-PATCH', DELETE: 'method-DELETE',
  }
  return `method-badge ${map[method] ?? 'method-badge'}`
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}
