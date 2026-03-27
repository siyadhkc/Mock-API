import { apiClient } from './client'

export interface RequestLog {
  id: string
  endpoint: string
  endpoint_path: string
  endpoint_method: string
  workspace_id: string
  matched_response: string | null
  method: string
  path: string
  query_params: Record<string, string>
  request_headers: Record<string, string>
  request_body: string
  status_code: number
  duration_ms: number
  ip_address: string
  created_at: string
}

export interface PaginatedLogs {
  count: number
  results: RequestLog[]
}

export const logsApi = {
  list: (params?: { workspace?: string; endpoint?: string; status_code?: number }) =>
    apiClient.get<PaginatedLogs>('/logs/', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<RequestLog>(`/logs/${id}/`).then((r) => r.data),
}
