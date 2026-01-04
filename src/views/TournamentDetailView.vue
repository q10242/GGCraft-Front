<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { tournamentService } from '@/services/tournaments'

const route = useRoute()
const id = route.params.id as string

const { data, isLoading, error } = useQuery({
  queryKey: ['tournament', id],
  queryFn: () => tournamentService.detail(id),
  placeholderData: {
    id,
    name: '示例賽事',
    status: 'draft',
    description: '填入賽事說明、規則與報名時間。',
    registration_start: '2025-01-01',
    registration_end: '2025-01-10',
    box_format: 'Bo3',
    registered_teams_count: 4,
    team_limit: 16,
  },
})
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="賽事詳情"
      subtitle="顯示賽事時程、規則、隊伍數量等詳細資訊。"
      eyebrow="Tournaments"
    >
      <template #actions>
        <RouterLink
          :to="`/tournaments/${id}/edit`"
          class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300"
        >
          編輯
        </RouterLink>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" message="載入賽事..." />
    <p v-else-if="error" class="text-sm text-red-600">無法取得賽事資料。</p>

    <div v-else-if="data" class="space-y-6">
      <SectionCard :title="data.name" :description="data.description">
        <div class="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
          <p><span class="font-semibold">狀態：</span>{{ data.status }}</p>
          <p><span class="font-semibold">賽制：</span>{{ data.box_format || '未設定' }}</p>
          <p><span class="font-semibold">報名開始：</span>{{ data.registration_start || '未設定' }}</p>
          <p><span class="font-semibold">報名截止：</span>{{ data.registration_end || '未設定' }}</p>
          <p><span class="font-semibold">隊伍：</span>{{ data.registered_teams_count || 0 }} / {{ data.team_limit || '?' }}</p>
        </div>
      </SectionCard>

      <div class="grid gap-4 md:grid-cols-2">
        <SectionCard title="操作" description="依狀態顯示可用動作。">
          <div class="flex flex-wrap gap-2">
            <RouterLink
              :to="`/tournaments/${id}/join`"
              class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              報名
            </RouterLink>
            <RouterLink
              :to="`/tournaments/${id}/teams`"
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300"
            >
              參賽名單
            </RouterLink>
            <RouterLink
              :to="`/tournaments/${id}/schedule`"
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300"
            >
              排程
            </RouterLink>
            <RouterLink
              :to="`/tournaments/${id}/bracket`"
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300"
            >
              Bracket
            </RouterLink>
          </div>
        </SectionCard>

        <SectionCard title="隊伍數量" description="報名數與上限。">
          <p class="text-sm text-slate-700">
            已報名：{{ data.registered_teams_count || 0 }} / {{ data.team_limit || '?' }}
          </p>
        </SectionCard>
      </div>

      <SectionCard title="規則 / 說明">
        <p class="text-sm text-slate-700">
          {{ data.description || '待補充規則。' }}
        </p>
      </SectionCard>
    </div>

    <EmptyState v-else title="尚無資料" description="未取得賽事資訊。" />
  </section>
</template>
