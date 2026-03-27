import axios from 'axios'

export const apiClient = axios.create({ baseURL: '/api' })

function getTokens() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return { access: null, refresh: null }
    const s = JSON.parse(raw)
    return { access: s?.state?.accessToken ?? null, refresh: s?.state?.refreshToken ?? null }
  } catch {
    return { access: null, refresh: null }
  }
}

function setAccessToken(token: string) {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return
    const s = JSON.parse(raw)
    s.state = { ...s.state, accessToken: token }
    localStorage.setItem('auth-storage', JSON.stringify(s))
  } catch {}
}

apiClient.interceptors.request.use((config) => {
  const { access } = getTokens()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { refresh } = getTokens()
        if (!refresh) throw new Error('no refresh token')
        const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
        setAccessToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return apiClient(original)
      } catch {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
