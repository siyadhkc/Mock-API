import { useEffect, useRef, useCallback } from 'react'
import type { RequestLog } from '../api/logs'

type LogHandler = (log: RequestLog) => void

export function useLogSocket(workspaceId: string | null, onLog: LogHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef(onLog)
  handlerRef.current = onLog

  const connect = useCallback(() => {
    if (!workspaceId) return
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/logs/${workspaceId}/`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const log: RequestLog = JSON.parse(e.data)
        handlerRef.current(log)
      } catch {}
    }

    ws.onclose = (e) => {
      if (e.code !== 1000) {
        // Reconnect after 3s unless intentional close
        setTimeout(connect, 3000)
      }
    }
  }, [workspaceId])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close(1000, 'unmount')
    }
  }, [connect])
}
