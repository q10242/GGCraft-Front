import Pusher, { type Channel } from 'pusher-js'

export type PusherClient = Pusher

export function createSocket(token?: string): { client: Pusher; subscribe: (channel: string) => Channel } {
  const host = import.meta.env.VITE_WEBSOCKETS_HOST || 'localhost'
  const port = Number(import.meta.env.VITE_WEBSOCKETS_PORT || 6001)
  const key = import.meta.env.VITE_WEBSOCKETS_KEY || 'local'
  const scheme = import.meta.env.VITE_WEBSOCKETS_SCHEME || 'http'
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
  const authEndpoint = apiBase.endsWith('/api') ? `${apiBase}/broadcasting/auth` : `${apiBase}/api/broadcasting/auth`

  const client = new Pusher(key, {
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    cluster: 'mt1',
    authEndpoint,
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })

  return {
    client,
    subscribe: (channel: string) => client.subscribe(channel),
  }
}
