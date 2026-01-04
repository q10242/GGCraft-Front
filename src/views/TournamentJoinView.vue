<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { tournamentService } from '@/services/tournaments'
import { userService } from '@/services/user'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const tournamentId = route.params.id as string
const authStore = useAuthStore()

const teamsQuery = useQuery({
  queryKey: ['my-teams'],
  queryFn: () => userService.currentTeams(),
  enabled: authStore.isAuthenticated,
  placeholderData: { data: [] },
})

const tournamentQuery = useQuery({
  queryKey: ['tournament', tournamentId],
  queryFn: () => tournamentService.detail(tournamentId),
})

const joinMutation = useMutation({
  mutationFn: (payload: { team_id: number; note?: string }) =>
    tournamentService.join(tournamentId, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    router.push(`/tournaments/${tournamentId}`)
  },
})

const handleSubmit = (values: { team_id: number; note?: string }) => {
  joinMutation.mutate(values)
}
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="報名 / 邀請確認"
      subtitle="公開報名或邀請信確認，提交至 api/tournaments/{id}/join 或 /register /confirm。"
      eyebrow="Registration"
    />

    <SectionCard title="賽事資訊">
      <LoadingState v-if="tournamentQuery.isLoading" message="載入賽事..." />
      <p v-else-if="tournamentQuery.error" class="text-sm text-red-600">無法取得賽事資料。</p>
      <div v-else-if="tournamentQuery.data" class="space-y-1 text-sm text-slate-700">
        <p class="font-semibold text-slate-900">{{ tournamentQuery.data.name }}</p>
        <p>狀態：{{ tournamentQuery.data.status }}</p>
        <p>報名截止：{{ tournamentQuery.data.registration_end || '未設定' }}</p>
      </div>
    </SectionCard>

    <SectionCard
      title="提交報名"
      description="表單：選擇隊伍、確認參賽條款，支援 tokenized 邀請連結顯示邀請內容與接受/拒絕按鈕。"
    >
      <LoadingState v-if="teamsQuery.isLoading" message="取得可報名隊伍..." />
      <EmptyState
        v-else-if="!teamsQuery.data?.data?.length"
        title="沒有可報名的隊伍"
        description="請先建立或加入隊伍。"
      />
      <FormKit
        v-else
        type="form"
        submit-label="送出報名"
        :actions="false"
        @submit="handleSubmit"
      >
        <div class="grid gap-4">
          <FormKit
            type="select"
            name="team_id"
            label="選擇隊伍"
            :options="teamsQuery.data?.data?.map((team: any) => ({ label: team.name, value: team.id }))"
            validation="required"
          />
          <FormKit type="textarea" name="note" label="備註" />
          <button
            type="submit"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            :disabled="joinMutation.isPending"
          >
            {{ joinMutation.isPending ? '送出中...' : '提交報名' }}
          </button>
          <p v-if="joinMutation.error" class="text-sm text-red-600">提交失敗，請重試。</p>
        </div>
      </FormKit>
    </SectionCard>
  </section>
</template>
