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
    registration_start_date: '2025-01-01',
    registration_deadline: '2025-01-10',
    type: 'single_elimination',
    max_teams: 16,
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
          <p><span class="font-semibold">狀態：</span>{{ data.status || '未設定' }}</p>
          <p><span class="font-semibold">賽制：</span>{{ data.type || '未設定' }}</p>
          <p><span class="font-semibold">報名開始：</span>{{ data.registration_start_date || '未設定' }}</p>
          <p><span class="font-semibold">報名截止：</span>{{ data.registration_deadline || '未設定' }}</p>
          <p><span class="font-semibold">檢錄開始：</span>{{ data.check_in_start_at || '未設定' }}</p>
          <p><span class="font-semibold">檢錄截止：</span>{{ data.check_in_end_at || '未設定' }}</p>
          <p><span class="font-semibold">開始時間：</span>{{ data.start_date || '未設定' }}</p>
          <p><span class="font-semibold">結束時間：</span>{{ data.end_date || '未設定' }}</p>
          <p><span class="font-semibold">隊伍上限：</span>{{ data.max_teams ?? '未設定' }}</p>
          <p><span class="font-semibold">隊伍下限：</span>{{ data.min_teams ?? '未設定' }}</p>
          <p><span class="font-semibold">獎金/獎品：</span>{{ data.total_prize ?? 0 }}</p>
          <p><span class="font-semibold">報名費：</span>{{ data.entry_fee ?? 0 }}</p>
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
            隊伍上限：{{ data.max_teams || '?' }}（詳情以後端報名紀錄為準）
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
