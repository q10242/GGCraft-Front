<script setup lang="ts">
import { computed } from 'vue'
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

const invitationToken = computed(() => route.query.token as string | undefined)
const invitationTeamId = computed(() =>
  route.query.team_id ? Number(route.query.team_id as string) : undefined,
)

const registerMutation = useMutation({
  mutationFn: (payload: { team_id: number }) => tournamentService.register(tournamentId, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    router.push(`/tournaments/${tournamentId}`)
  },
})

const acceptMutation = useMutation({
  mutationFn: (payload: { team_id: number; token: string }) =>
    tournamentService.acceptInvitation(tournamentId, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }),
})

const rejectMutation = useMutation({
  mutationFn: (payload: { team_id: number; token: string }) =>
    tournamentService.rejectInvitation(tournamentId, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }),
})

const confirmMutation = useMutation({
  mutationFn: (payload: { team_id: number; token: string }) =>
    tournamentService.confirmRegistration(tournamentId, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }),
})

const withdrawMutation = useMutation({
  mutationFn: (payload: { team_id: number }) => tournamentService.withdraw(tournamentId, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }),
})

const handleRegister = (values: { team_id: number }) => registerMutation.mutate(values)
const handleInvitation = (values: { team_id: number; token: string }, action: 'accept' | 'reject') => {
  if (action === 'accept') {
    acceptMutation.mutate(values)
    return
  }
  rejectMutation.mutate(values)
}
const handleConfirm = (values: { team_id: number; token: string }) => confirmMutation.mutate(values)
const handleWithdraw = (values: { team_id: number }) => withdrawMutation.mutate(values)
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="報名 / 邀請確認"
      subtitle="公開報名、接受主辦方邀請、確認報名或退出賽事。"
      eyebrow="Registration"
    />

    <SectionCard title="賽事資訊">
      <LoadingState v-if="tournamentQuery.isLoading" message="載入賽事..." />
      <p v-else-if="tournamentQuery.error" class="text-sm text-red-600">無法取得賽事資料。</p>
      <div v-else-if="tournamentQuery.data" class="space-y-1 text-sm text-slate-700">
        <p class="font-semibold text-slate-900">{{ tournamentQuery.data.name }}</p>
        <p>狀態：{{ tournamentQuery.data.status }}</p>
        <p>報名截止：{{ tournamentQuery.data.registration_deadline || '未設定' }}</p>
      </div>
    </SectionCard>

    <SectionCard
      title="公開報名"
      description="隊長或管理者使用公開報名，送出後會收到確認信（可能包含候補資訊）。"
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
        @submit="handleRegister"
      >
        <div class="grid gap-4">
          <FormKit
            type="select"
            name="team_id"
            label="選擇隊伍"
            :options="teamsQuery.data?.data?.map((team: any) => ({ label: team.name, value: team.id }))"
            validation="required"
          />
          <button
            type="submit"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            :disabled="registerMutation.isPending"
          >
            {{ registerMutation.isPending ? '送出中...' : '提交報名' }}
          </button>
          <p v-if="registerMutation.error" class="text-sm text-red-600">提交失敗，請重試。</p>
          <p v-else-if="registerMutation.data" class="text-sm text-emerald-600">已送出報名，請留意確認信。</p>
        </div>
      </FormKit>
    </SectionCard>

    <SectionCard
      title="主辦方邀請"
      description="如果透過邀請信進入，可用 token+隊伍接受或拒絕。表單會自動帶入網址參數。"
    >
      <FormKit
        type="form"
        :value="{ team_id: invitationTeamId, token: invitationToken }"
        :actions="false"
        @submit="(values) => handleInvitation(values as any, 'accept')"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <FormKit type="number" name="team_id" label="隊伍 ID" validation="required" />
          <FormKit type="text" name="token" label="邀請 token" validation="required" />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            :disabled="acceptMutation.isPending"
          >
            {{ acceptMutation.isPending ? '接受中...' : '接受邀請' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
            :disabled="rejectMutation.isPending"
            @click="(e) => {
              e.preventDefault()
              const form = (e.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement | null
              const formData = form ? Object.fromEntries(new FormData(form)) : {}
              handleInvitation({ team_id: Number(formData.team_id), token: String(formData.token) }, 'reject')
            }"
          >
            {{ rejectMutation.isPending ? '處理中...' : '拒絕邀請' }}
          </button>
        </div>
        <p v-if="acceptMutation.error || rejectMutation.error" class="mt-2 text-sm text-red-600">處理邀請失敗，請確認 token。</p>
        <p v-else-if="acceptMutation.data" class="mt-2 text-sm text-emerald-600">邀請已接受。</p>
        <p v-else-if="rejectMutation.data" class="mt-2 text-sm text-emerald-600">邀請已拒絕。</p>
      </FormKit>
    </SectionCard>

    <SectionCard
      title="報名確認"
      description="公開報名後的確認信會附帶 token，填入後可正式確認資格。"
    >
      <FormKit
        type="form"
        :value="{ team_id: invitationTeamId, token: invitationToken }"
        :actions="false"
        @submit="handleConfirm"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <FormKit type="number" name="team_id" label="隊伍 ID" validation="required" />
          <FormKit type="text" name="token" label="確認 token" validation="required" />
        </div>
        <button
          type="submit"
          class="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          :disabled="confirmMutation.isPending"
        >
          {{ confirmMutation.isPending ? '確認中...' : '確認報名' }}
        </button>
        <p v-if="confirmMutation.error" class="mt-2 text-sm text-red-600">確認失敗，請檢查 token。</p>
        <p v-else-if="confirmMutation.data" class="mt-2 text-sm text-emerald-600">已確認報名。</p>
      </FormKit>
    </SectionCard>

    <SectionCard title="退出賽事" description="賽事開始前可由隊伍自行退出。">
      <FormKit
        type="form"
        :actions="false"
        @submit="handleWithdraw"
        :value="{ team_id: invitationTeamId }"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <FormKit
            type="select"
            name="team_id"
            label="選擇隊伍"
            :options="teamsQuery.data?.data?.map((team: any) => ({ label: team.name, value: team.id }))"
            validation="required"
          />
        </div>
        <button
          type="submit"
          class="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
          :disabled="withdrawMutation.isPending"
        >
          {{ withdrawMutation.isPending ? '處理中...' : '退出賽事' }}
        </button>
        <p v-if="withdrawMutation.error" class="mt-2 text-sm text-red-600">退出失敗，請稍後再試。</p>
        <p v-else-if="withdrawMutation.data" class="mt-2 text-sm text-emerald-600">已退出賽事。</p>
      </FormKit>
    </SectionCard>
  </section>
</template>
