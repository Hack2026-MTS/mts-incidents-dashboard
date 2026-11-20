import type { SSEMessage } from '../types/incident'

export type SSECallback = (msg: SSEMessage) => void

export class SSEService {
  private eventSource: EventSource | null = null
  private listeners: SSECallback[] = []
  private statusListeners: ((connected: boolean) => void)[] = []
  private reconnectTimer: any = null
  private isConnected = false

  public connect(url = '/api/events') {
    if (this.eventSource) {
      this.eventSource.close()
    }

    try {
      this.eventSource = new EventSource(url)

      this.eventSource.onopen = () => {
        this.isConnected = true
        this.notifyStatus(true)
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data)
          this.listeners.forEach((cb) => cb(data))
        } catch (e) {
          console.error('[SSE] Failed to parse message', e)
        }
      }

      this.eventSource.onerror = () => {
        this.isConnected = false
        this.notifyStatus(false)
        if (this.eventSource) {
          this.eventSource.close()
          this.eventSource = null
        }
        // Auto reconnect after 3s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.connect(url)
          }, 3000)
        }
      }
    } catch (e) {
      this.isConnected = false
      this.notifyStatus(false)
    }
  }

  public subscribe(cb: SSECallback): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  public onStatusChange(cb: (connected: boolean) => void): () => void {
    this.statusListeners.push(cb)
    cb(this.isConnected)
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== cb)
    }
  }

  private notifyStatus(status: boolean) {
    this.statusListeners.forEach((cb) => cb(status))
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

export const sseService = new SSEService()
