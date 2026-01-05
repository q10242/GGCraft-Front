<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { invitationService } from '@/services/invitations'
import { useQueryClient } from '@tanstack/vue-query'

const store = useNotificationStore()
const count = computed(() => store.unreadCount)
const open = ref(false)
const queryClient = useQueryClient()

const respondInvitation = async (item: any, action: 'accept' | 'reject') => {
  const payload = item?.payload || item
  if (!payload?.token || payload?.status && payload.status !== 'pending') return
  if (action === 'accept') {
    await invitationService.accept(payload.token)
  } else {
    await invitationService.reject(payload.token)
  }
  if (item?.id) {
    store.markAsRead(item.id)
    // 標記已處理以避免重複操作
    item.payload = { ...item.payload, status: action === 'accept' ? 'accepted' : 'rejected' }
  }
  if (payload.team_id) {
    queryClient.invalidateQueries({ queryKey: ['team', payload.team_id, 'invitations'] })
    queryClient.invalidateQueries({ queryKey: ['team', payload.team_id, 'members'] })
  }
}

const toggle = () => {
  open.value = !open.value
  if (open.value) {
    store.markAllAsRead()
  }
}

const formatTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch (e) {
    return iso
  }
}
</script>

<template>
  <div class="relative inline-flex">
    <button
      class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800"
      @click="toggle"
    >
      🔔
    </button>
    <span
      v-if="count > 0"
      class="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white"
    >
      {{ count }}
    </span>

    <div
      v-if="open"
      class="absolute right-0 top-10 z-10 w-80 rounded-lg border border-slate-200 bg-white shadow-lg"
    >
      <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <p class="text-sm font-semibold text-slate-800">通知</p>
        <div class="flex items-center gap-2">
          <button class="text-xs text-blue-600 hover:underline" @click="store.markAllAsRead()">全部已讀</button>
          <button class="text-xs text-slate-500 hover:underline" @click="store.clear()">清除</button>
        </div>
      </div>
      <div class="max-h-80 overflow-y-auto">
        <p v-if="!store.items.length" class="px-3 py-2 text-xs text-slate-500">目前沒有通知</p>
        <div
          v-for="(item, idx) in store.items"
          :key="idx"
          class="border-b border-slate-100 px-3 py-2 text-sm text-slate-800 last:border-b-0"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ item.title }}</p>
              <p class="font-semibold leading-snug">{{ item.message }}</p>
              <p class="text-[11px] text-slate-400">{{ formatTime(item.createdAt) }}</p>
            </div>
            <span v-if="!item.read" class="mt-1 h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div v-if="item.type === 'invitation.created'" class="mt-2 flex items-center gap-2 text-xs">
            <button
              class="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
              :disabled="item.payload?.status && item.payload.status !== 'pending'"
              @click="respondInvitation(item, 'accept')"
            >
              接受
            </button>
            <button
              class="rounded-md border border-slate-200 px-3 py-1 hover:border-slate-300"
              :disabled="item.payload?.status && item.payload.status !== 'pending'"
              @click="respondInvitation(item, 'reject')"
            >
              拒絕
            </button>
            <button class="text-xs text-slate-500 hover:underline" @click="store.markAsRead(item.id)">已讀</button>
          </div>
          <div v-else class="mt-2 text-xs text-slate-600">
            <button class="text-xs text-slate-500 hover:underline" @click="store.markAsRead(item.id)">已讀</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
