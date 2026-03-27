import { apiClient } from './client'

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string
  owner: { id: string; email: string; username: string }
  member_count: number
  endpoint_count: number
  user_role: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  user: { id: string; email: string; username: string }
  role: string
  joined_at: string
}

export const workspacesApi = {
  list: () => apiClient.get<Workspace[]>('/workspaces/').then((r) => r.data),
  get: (id: string) => apiClient.get<Workspace>(`/workspaces/${id}/`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<Workspace>('/workspaces/', data).then((r) => r.data),
  update: (id: string, data: Partial<Workspace>) =>
    apiClient.patch<Workspace>(`/workspaces/${id}/`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/workspaces/${id}/`),
  members: (id: string) =>
    apiClient.get<WorkspaceMember[]>(`/workspaces/${id}/members/`).then((r) => r.data),
  invite: (id: string, email: string, role = 'member') =>
    apiClient.post(`/workspaces/${id}/invite/`, { email, role }).then((r) => r.data),
}
