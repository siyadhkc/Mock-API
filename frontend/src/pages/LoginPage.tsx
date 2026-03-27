import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { Button, Input } from '../components/ui'

interface LoginForm { email: string; password: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    try {
      const tokens = await authApi.login(data.email, data.password)
      setTokens(tokens.access, tokens.refresh)
      const user = await authApi.me()
      setUser(user)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c2333_1px,transparent_1px),linear-gradient(to_bottom,#1c2333_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-4">
            <span className="text-white text-xl font-bold font-mono">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">MockAPI Pro</h1>
          <p className="text-slate-500 text-sm mt-1">Self-hostable mock API server</p>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-7 shadow-2xl">
          <h2 className="text-base font-semibold text-slate-200 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Required' })}
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
