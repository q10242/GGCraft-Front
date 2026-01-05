<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import { tournamentService } from '@/services/tournaments'

const status = ref<string | undefined>(undefined)
const page = ref(1)

const { data, isLoading, error, refetch, isFetching } = useQuery({
  queryKey: ['tournaments', page, status],
  queryFn: () => tournamentService.list({ page: page.value, status: status.value }),
  placeholderData: {
    data: [
      {
        id: 0,
        name: '示例賽事',
        status: 'draft',
        registration_deadline: '2025-01-01',
        max_teams: 16,
      },
    ],
    meta: { current_page: 1, per_page: 10, total: 1 },
  },
})

const tournaments = computed(() => data?.value?.data || [])
const meta = computed(() => data?.value?.meta)

const setStatus = (next?: string) => {
  status.value = next
  page.value = 1
  refetch()
}
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="賽事列表"
      subtitle="顯示開放中、進行中、已結束的賽事列表，資料來源 api/tournaments。"
      eyebrow="Tournaments"
    >
      <template #actions>
        <RouterLink
          to="/tournaments/new"
          class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          新增賽事
        </RouterLink>
      </template>
    </PageHeader>

    <SectionCard>
      <div class="flex flex-wrap items-center gap-3 pb-4">
        <button
          class="rounded-full border px-3 py-1 text-xs font-semibold transition"
          :class="status === undefined ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
          @click="setStatus(undefined)"
        >
          全部
        </button>
        <button
          v-for="option in ['registration', 'registration_closed', 'ongoing', 'completed']"
          :key="option"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition"
          :class="status === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
          @click="setStatus(option)"
        >
          {{ option }}
        </button>
        <p v-if="isFetching" class="text-xs text-slate-500">重新整理中...</p>
      </div>

      <LoadingState v-if="isLoading" message="載入賽事列表..." />
      <p v-else-if="error" class="text-sm text-red-600">無法取得列表，請稍後重試。</p>
      <EmptyState
        v-else-if="!tournaments.length"
        title="目前沒有賽事"
        description="建立一場新賽事或稍後再來查看。"
      />

      <div v-else class="space-y-3">
        <article
          v-for="item in tournaments"
          :key="item.id"
          class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="space-y-1">
              <RouterLink :to="`/tournaments/${item.id}`" class="text-lg font-semibold text-slate-900 hover:underline">
                {{ item.name }}
              </RouterLink>
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500">{{ item.status || '未知狀態' }}</p>
            </div>
            <RouterLink
              :to="`/tournaments/${item.id}/join`"
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300"
            >
              前往報名
            </RouterLink>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-700">
            <span>報名截止：{{ item.registration_deadline || '未設定' }}</span>
            <span>隊伍上限：{{ item.max_teams || '?' }}</span>
          </div>
        </article>

        <PaginationControls
          v-if="meta"
          :page="meta.current_page"
          :per-page="meta.per_page"
          :total="meta.total"
          @update:page="(value) => { page = value; refetch() }"
        />
      </div>
    </SectionCard>
  </section>
</template>
