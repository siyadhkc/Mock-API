import React from 'react'
import { cn } from '../../utils'

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    ghost: 'text-slate-400 hover:text-white hover:bg-surface-elevated',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    outline: 'border border-surface-border text-slate-300 hover:border-accent hover:text-accent',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-5 py-2.5' }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  )
}

// ── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-surface-elevated border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors',
          error ? 'border-red-500' : 'border-surface-border',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-surface-elevated border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 font-mono resize-none',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors',
          error ? 'border-red-500' : 'border-surface-border',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full bg-surface-elevated border rounded-lg px-3 py-2 text-sm text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors',
          error ? 'border-red-500' : 'border-surface-border',
          className
        )}
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
)
Select.displayName = 'Select'

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={cn('relative w-full bg-surface-raised border border-surface-border rounded-xl shadow-2xl', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }
export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-elevated text-slate-400 border-surface-border',
    success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
    warning: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
    danger: 'bg-red-900/40 text-red-300 border-red-800/50',
    info: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
  }
  return (
    <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium', variants[variant])}>
      {children}
    </span>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="text-4xl text-slate-600">{icon}</div>
      <div>
        <p className="text-slate-300 font-medium">{title}</p>
        <p className="text-slate-500 text-sm mt-1">{description}</p>
      </div>
      {action}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return <div className={cn('border-2 border-surface-border border-t-accent rounded-full animate-spin', sizes[size])} />
}
