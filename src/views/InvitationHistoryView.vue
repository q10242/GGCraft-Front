<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { teamService } from '@/services/teams'
import api from '@/services/api'

const route = useRoute()
const queryClient = useQueryClient()
const teamId = route.params.id as string

const tournamentsQuery = useQuery({
  queryKey: ['team', teamId, 'tournaments'],
  queryFn: () => teamService.tournaments(teamId),
})

const invitationsQuery = useQuery({
  queryKey: ['team', teamId, 'invitations'],
  queryFn: async () => {
    const { data } = await api.get(`/teams/${teamId}/invitations`)
    return data
  },
})

const acceptMutation = useMutation({
  mutationFn: (invitationId: number) => api.post(`/invitations/${invitationId}/accept`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['team', teamId, 'invitations'] })
  },
})

const tournaments = computed(() => tournamentsQuery.data?.value?.data ?? [])
const invitations = computed(() => invitationsQuery.data?.value?.data ?? [])
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="參賽與邀請紀錄"
      subtitle="查看隊伍參與過的賽事與官方邀請函，並可回覆邀請。"
      eyebrow="History"
    />

    <SectionCard title="參與賽事" description="api/teams/{id}/tournaments 取得參賽紀錄。">
      <LoadingState v-if="tournamentsQuery.isLoading.value" message="載入參賽紀錄..." />
      <p v-else-if="tournamentsQuery.error?.value" class="text-sm text-red-600">無法取得紀錄。</p>
      <EmptyState v-else-if="!tournaments.length" title="尚無參賽紀錄" />
      <ul v-else class="space-y-2 text-sm text-slate-800">
        <li
          v-for="tournament in tournaments"
          :key="tournament.id"
          class="rounded-md border border-slate-200 px-3 py-2"
        >
          <p class="font-semibold text-slate-900">{{ tournament.name }}</p>
          <p class="text-xs text-slate-500">狀態：{{ tournament.status }}</p>
        </li>
      </ul>
    </SectionCard>

    <SectionCard
      title="官方邀請"
      description="api/invitations/accept (或相應端點) 處理官方邀請。"
    >
      <LoadingState v-if="invitationsQuery.isLoading.value" message="載入邀請..." />
      <p v-else-if="invitationsQuery.error?.value" class="text-sm text-red-600">無法取得邀請。</p>
      <EmptyState v-else-if="!invitations.length" title="沒有待處理邀請" />
      <ul v-else class="space-y-2 text-sm text-slate-800">
        <li
          v-for="invitation in invitations"
          :key="invitation.id"
          class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
        >
          <div>
            <p class="font-semibold">{{ invitation.tournament_name || '邀請' }}</p>
            <p class="text-xs text-slate-500">狀態：{{ invitation.status }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="acceptMutation.isPending.value"
              @click="acceptMutation.mutate(invitation.id)"
            >
              接受
            </button>
          </div>
        </li>
      </ul>
    </SectionCard>
  </section>
</template>
