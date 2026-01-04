<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { tournamentService } from '@/services/tournaments'

const route = useRoute()
const queryClient = useQueryClient()
const id = route.params.id as string

const teamsQuery = useQuery({
  queryKey: ['tournament', id, 'teams'],
  queryFn: () => tournamentService.listTeams(id),
})

const updateStatus = useMutation({
  mutationFn: (payload: { team_id: number; status: string }) =>
    tournamentService.updateTeamStatus(id, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id, 'teams'] }),
})
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="參賽名單審核"
      subtitle="審核隊伍申請，標註 approved / waitlisted / rejected 並支援 remove 或 invite 操作。"
      eyebrow="Tournaments"
    />

    <SectionCard>
      <LoadingState v-if="teamsQuery.isLoading" message="載入名單..." />
      <p v-else-if="teamsQuery.error" class="text-sm text-red-600">無法取得名單。</p>
      <EmptyState
        v-else-if="!teamsQuery.data?.data?.length"
        title="尚無報名隊伍"
        description="等待隊伍提交報名。"
      />
      <div v-else class="overflow-hidden rounded-lg border border-slate-200">
        <div class="grid grid-cols-[2fr,1fr,1fr,1fr] bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
          <span>隊伍名稱</span>
          <span>狀態</span>
          <span>報名時間</span>
          <span>操作</span>
        </div>
        <div v-for="team in teamsQuery.data.data" :key="team.id" class="grid grid-cols-[2fr,1fr,1fr,1fr] items-center border-t border-slate-100 px-4 py-3 text-sm text-slate-800">
          <span class="font-semibold">{{ team.name }}</span>
          <span class="text-xs uppercase tracking-[0.1em] text-slate-500">{{ team.status || 'pending' }}</span>
          <span class="text-xs text-slate-500">{{ team.applied_at || '—' }}</span>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-slate-300"
              @click="updateStatus.mutate({ team_id: team.id, status: 'approved' })"
            >
              通過
            </button>
            <button
              class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-slate-300"
              @click="updateStatus.mutate({ team_id: team.id, status: 'waitlisted' })"
            >
              候補
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  </section>
</template>
