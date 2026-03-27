import { apiClient } from './client'

export interface ResponseRule {
  id?: string
  source: 'body' | 'query' | 'header' | 'path'
  field: string
  operator: string
  value: string
}

export interface MockResponse {
  id: string
  endpoint: string
  name: string
  status_code: number
  headers: Record<string, string>
  body: string
  body_type: 'json' | 'xml' | 'text' | 'html'
  latency_ms: number
  latency_jitter_ms: number
  is_ai_generated: boolean
  is_default: boolean
  priority: number
  rules: ResponseRule[]
  created_at: string
  updated_at: string
}

export interface MockEndpoint {
  id: string
  workspace: string
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'
  description: string
  is_active: boolean
  response_count: number
  responses?: MockResponse[]
  created_at: string
  updated_at: string
}

export const endpointsApi = {
  list: (workspaceId?: string) =>
    apiClient
      .get<MockEndpoint[]>('/endpoints/mock-endpoints/', {
        params: workspaceId ? { workspace: workspaceId } : {},
      })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<MockEndpoint>(`/endpoints/mock-endpoints/${id}/`).then((r) => r.data),

  create: (data: Partial<MockEndpoint>) =>
    apiClient.post<MockEndpoint>('/endpoints/mock-endpoints/', data).then((r) => r.data),

  update: (id: string, data: Partial<MockEndpoint>) =>
    apiClient.patch<MockEndpoint>(`/endpoints/mock-endpoints/${id}/`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/endpoints/mock-endpoints/${id}/`),

  generateAI: (id: string, apiKey: string, prompt?: string) =>
    apiClient
      .post(`/endpoints/mock-endpoints/${id}/generate-ai/`, { api_key: apiKey, prompt })
      .then((r) => r.data),

  createResponse: (data: Partial<MockResponse>) =>
    apiClient.post<MockResponse>('/endpoints/mock-responses/', data).then((r) => r.data),

  updateResponse: (id: string, data: Partial<MockResponse>) =>
    apiClient
      .patch<MockResponse>(`/endpoints/mock-responses/${id}/`, data)
      .then((r) => r.data),

  deleteResponse: (id: string) => apiClient.delete(`/endpoints/mock-responses/${id}/`),
}
