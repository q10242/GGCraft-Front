<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { tournamentService } from '@/services/tournaments'

const route = useRoute()
const id = route.params.id as string

const { data, isLoading, error } = useQuery({
  queryKey: ['tournament', id, 'bracket'],
  queryFn: () => tournamentService.bracket(id),
  placeholderData: { rounds: [] },
})

const rounds = computed(() => data?.value?.rounds || [])
const summary = computed(() => data?.value?.summary)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="賽程對戰表 (Bracket)"
      subtitle="核心介面：繪製賽事樹狀圖與對戰結果。"
      eyebrow="Bracket"
    />

    <SectionCard>
      <LoadingState v-if="isLoading" message="載入 Bracket..." />
      <p v-else-if="error" class="text-sm text-red-600">無法取得 Bracket 資料。</p>
      <EmptyState v-else-if="!rounds.length" title="尚無對戰表" description="等待排程生成或手動建立。" />

      <div v-else class="space-y-4">
        <div v-if="summary" class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>總回合數：{{ summary.total_rounds }}，比賽數：{{ summary.total_matches }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="(round, idx) in rounds"
            :key="idx"
            class="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-4"
          >
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500">
              Round {{ round.round }} · {{ round.round_name || `第 ${idx + 1} 輪` }}
            </p>
            <div v-for="match in round.matches" :key="match.id" class="space-y-1 rounded-md border border-slate-100 p-3">
              <p class="text-sm font-semibold text-slate-900">Match #{{ match.match_number || match.id }}</p>
              <p class="text-xs text-slate-600">
                {{ match.team_a_score ?? match.score_a ?? 0 }} ·
                {{ match.teamA?.name || match.team_a || 'TBD' }}
              </p>
              <p class="text-xs text-slate-600">
                {{ match.team_b_score ?? match.score_b ?? 0 }} ·
                {{ match.teamB?.name || match.team_b || 'TBD' }}
              </p>
              <p class="text-xs text-slate-500">
                勝者：{{ match.winner?.name || '尚未決定' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  </section>
</template>
