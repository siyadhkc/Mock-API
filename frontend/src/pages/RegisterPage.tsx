import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { Button, Input } from '../components/ui'

interface RegisterForm {
  email: string; username: string
  password: string; password2: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    try {
      await authApi.register(data.email, data.username, data.password, data.password2)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      const detail = err?.response?.data
      if (typeof detail === 'object') {
        Object.values(detail).flat().forEach((m: any) => toast.error(String(m)))
      } else {
        toast.error('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c2333_1px,transparent_1px),linear-gradient(to_bottom,#1c2333_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-4">
            <span className="text-white text-xl font-bold font-mono">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">MockAPI Pro</h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Required' })} />
            <Input label="Username" placeholder="yourname"
              error={errors.username?.message}
              {...register('username', { required: 'Required' })} />
            <Input label="Password" type="password" placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
            <Input label="Confirm password" type="password" placeholder="••••••••"
              error={errors.password2?.message}
              {...register('password2', {
                required: 'Required',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })} />
            <Button type="submit" loading={loading} className="w-full mt-2">Create account</Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
