<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { tournamentService } from '@/services/tournaments'

const route = useRoute()
const id = route.params.id as string

const scheduleQuery = useQuery({
  queryKey: ['tournament', id, 'schedule'],
  queryFn: () => tournamentService.updateSchedule(id, {}),
  enabled: false, // 暫不自動呼叫，待按鈕觸發
})

const triggerMutation = useMutation({
  mutationFn: (payload: any) => tournamentService.updateSchedule(id, payload),
})
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6 px-6 py-10">
    <PageHeader
      title="排程管理"
      subtitle="手動觸發或微調賽事排程，與 api/webhooks/scheduler 同步。"
      eyebrow="Scheduling"
    />

    <SectionCard
      title="手動觸發"
      description="API：PATCH api/tournaments/{id}/schedule 更新排程設定，並顯示最近一次 scheduler 執行情況。"
    >
      <div class="flex flex-wrap items-center gap-3">
        <button
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          :disabled="triggerMutation.isPending"
          @click="triggerMutation.mutate({ manualTrigger: true })"
        >
          {{ triggerMutation.isPending ? '執行中...' : '手動重跑' }}
        </button>
        <button
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
          :disabled="triggerMutation.isPending"
          @click="triggerMutation.mutate({ adjustments: { paused: true } })"
        >
          暫停自動排程
        </button>
        <button
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
          :disabled="triggerMutation.isPending"
          @click="triggerMutation.mutate({ adjustments: { paused: false } })"
        >
          恢復
        </button>
        <p v-if="triggerMutation.error" class="text-sm text-red-600">操作失敗，請重試。</p>
      </div>
    </SectionCard>

    <SectionCard title="近期執行紀錄">
      <LoadingState v-if="scheduleQuery.isLoading" message="載入排程狀態..." />
      <p v-else class="text-sm text-slate-700">待串接 scheduler 回傳結果。</p>
    </SectionCard>
  </section>
</template>
