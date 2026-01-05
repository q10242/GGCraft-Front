<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { tournamentService } from '@/services/tournaments'

const route = useRoute()
const id = route.params.id as string

const tournamentQuery = useQuery({
  queryKey: ['tournament', id],
  queryFn: () => tournamentService.detail(id),
})

const triggerMutation = useMutation({
  mutationFn: (payload: any) => tournamentService.updateSchedule(id, payload),
})

const handleSubmit = (values: Record<string, any>) => {
  const payload = Object.fromEntries(
    Object.entries(values || {}).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  )
  triggerMutation.mutate(payload)
}
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6 px-6 py-10">
    <PageHeader
      title="排程管理"
      subtitle="更新報名/檢錄/比賽時間；對應 PATCH /api/tournaments/{id}/schedule。"
      eyebrow="Scheduling"
    />

    <SectionCard title="更新時間表" description="填入需要調整的欄位即可，不變動的欄位可留白。">
      <LoadingState v-if="tournamentQuery.isLoading" message="載入賽事..." />
      <p v-else-if="tournamentQuery.error" class="text-sm text-red-600">無法取得賽事資料。</p>

      <FormKit
        v-else
        type="form"
        :value="{
          registration_start_date: tournamentQuery.data?.registration_start_date,
          registration_deadline: tournamentQuery.data?.registration_deadline,
          check_in_start_at: tournamentQuery.data?.check_in_start_at,
          check_in_end_at: tournamentQuery.data?.check_in_end_at,
          start_date: tournamentQuery.data?.start_date,
          end_date: tournamentQuery.data?.end_date,
        }"
        :actions="false"
        @submit="handleSubmit"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <FormKit type="datetime-local" name="registration_start_date" label="報名開始" />
          <FormKit type="datetime-local" name="registration_deadline" label="報名截止" />
          <FormKit type="datetime-local" name="check_in_start_at" label="檢錄開始" />
          <FormKit type="datetime-local" name="check_in_end_at" label="檢錄截止" />
          <FormKit type="datetime-local" name="start_date" label="賽事開始" />
          <FormKit type="datetime-local" name="end_date" label="賽事結束" />
        </div>
        <button
          type="submit"
          class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          :disabled="triggerMutation.isPending"
        >
          {{ triggerMutation.isPending ? '更新中...' : '儲存排程' }}
        </button>
        <p v-if="triggerMutation.error" class="mt-2 text-sm text-red-600">更新失敗，請檢查輸入。</p>
        <p v-else-if="triggerMutation.data" class="mt-2 text-sm text-emerald-600">排程已更新。</p>
      </FormKit>
    </SectionCard>
  </section>
</template>
