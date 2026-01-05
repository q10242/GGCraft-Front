import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createSocket, type PusherClient } from '@/plugins/echo'
import { useAuthStore } from './auth'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  payload?: any
  createdAt: string
  read: boolean
}

const STORAGE_KEY = 'ggcraft.notifications'
const MAX_ITEMS = 50

const makeId = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const loadFromStorage = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as any[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      id: item.id || makeId(),
      type: item.type || 'info',
      title: item.title || '通知',
      message: item.message || '',
      payload: item.payload,
      createdAt: item.createdAt || new Date().toISOString(),
      read: Boolean(item.read),
    }))
  } catch (e) {
    console.warn('無法載入通知快取', e)
    return []
  }
}

const persist = (items: NotificationItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>(loadFromStorage())
  const auth = useAuthStore()
  let client: PusherClient | null = null
  let channel: ReturnType<PusherClient['subscribe']> | null = null

  const unreadCount = computed(() => items.value.filter((item) => !item.read).length)

  const add = (item: NotificationItem) => {
    const exists = items.value.find(
      (current) => current.type === item.type && current.payload?.id && current.payload.id === item.payload?.id,
    )
    if (exists) return

    items.value = [item, ...items.value].slice(0, MAX_ITEMS)
    persist(items.value)
  }

  const addInvitationCreated = (event: any) => {
    add({
      id: makeId(),
      type: 'invitation.created',
      title: '隊伍邀請',
      message: `「${event.team?.name || event.team_id}」邀請你加入`,
      payload: event,
      createdAt: new Date().toISOString(),
      read: false,
    })
  }

  const addInvitationResponded = (event: any) => {
    add({
      id: makeId(),
      type: 'invitation.responded',
      title: '邀請更新',
      message: `${event.user?.name || '成員'} 對邀請的回覆：${event.status}`,
      payload: event,
      createdAt: new Date().toISOString(),
      read: false,
    })
  }

  const markAsRead = (id: string) => {
    items.value = items.value.map((item) => (item.id === id ? { ...item, read: true } : item))
    persist(items.value)
  }

  const markAllAsRead = () => {
    items.value = items.value.map((item) => ({ ...item, read: true }))
    persist(items.value)
  }

  const clear = () => {
    items.value = []
    persist(items.value)
  }

  const disconnect = () => {
    if (channel && client) {
      client.unsubscribe(channel.name)
      channel = null
    }
    if (client) {
      client.disconnect()
      client = null
    }
  }

  const connect = () => {
    if (!auth.token || !auth.user?.id) return
    disconnect()
    const socket = createSocket(auth.token)
    client = socket.client
    channel = socket.subscribe(`private-users.${auth.user.id}`)
    channel.bind('team.invitation.created', addInvitationCreated)
    channel.bind('team.invitation.responded', addInvitationResponded)
  }

  return {
    items,
    unreadCount,
    connect,
    disconnect,
    clear,
    markAsRead,
    markAllAsRead,
  }
})
