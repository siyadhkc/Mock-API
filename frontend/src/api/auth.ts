import { apiClient } from './client'
import axios from 'axios'

export interface AuthTokens {
  access: string
  refresh: string
}

export interface User {
  id: string
  email: string
  username: string
  avatar_url: string
  created_at: string
}

export const authApi = {
  login: (email: string, password: string) =>
    axios.post<AuthTokens>('/api/auth/login/', { email, password }).then((r) => r.data),

  register: (email: string, username: string, password: string, password2: string) =>
    axios
      .post<User>('/api/auth/register/', { email, username, password, password2 })
      .then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me/').then((r) => r.data),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }).then((r) => r.data),

  updateMe: (data: Partial<User>) =>
    apiClient.patch<User>('/auth/me/', data).then((r) => r.data),
}
