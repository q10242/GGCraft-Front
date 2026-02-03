<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import TeamSearchSelect from '@/components/teams/TeamSearchSelect.vue'
import { tournamentService, type TournamentInvitation } from '@/services/tournaments'
import type { TeamSearchItem } from '@/services/teams'
import { userService } from '@/services/user'

const props = defineProps<{
  id?: string
}>()

const route = useRoute()
const queryClient = useQueryClient()
const tournamentId = computed(() => props.id ?? (route.params.id as string))
const authStore = useAuthStore()

const teamsQuery = useQuery({
  queryKey: ['my-teams'],
  queryFn: () => userService.currentTeams(),
  enabled: authStore.isAuthenticated,
  placeholderData: { data: [] },
})

const tournament = ref<any | null>(null)
const tournamentLoading = ref(true)
const tournamentError = ref<string | null>(null)

const currentTournament = computed(() => {
  if (!tournament.value) return null
  if ((tournament.value as any)?.data?.id) return (tournament.value as any).data
  return tournament.value
})

const teamOptions = computed(() => {
  const raw = teamsQuery.data?.value || teamsQuery.data
  const list = Array.isArray((raw as any)?.data) ? (raw as any).data : Array.isArray(raw) ? (raw as any) : []
  return list.map((team: any) => ({ label: team.name, value: team.id }))
})

const invitationToken = computed(() => route.query.token as string | undefined)
const invitationTeamId = computed(() =>
  route.query.team_id ? Number(route.query.team_id as string) : undefined,
)
const isPublic = computed(() => currentTournament.value?.is_public ?? false)
const creatorId = computed(
  () => (currentTournament.value as any)?.creator_id ?? (currentTournament.value as any)?.creator?.id,
)
const isHost = computed(() => {
  if (!creatorId.value || !authStore.user?.id) return false
  return Number(authStore.user.id) === Number(creatorId.value)
})

const confirmMutation = useMutation({
  mutationFn: (payload: { team_id: number; token: string }) =>
    tournamentService.confirmRegistration(tournamentId.value as string, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId.value] }),
})

const withdrawMutation = useMutation({
  mutationFn: (payload: { team_id: number }) => tournamentService.withdraw(tournamentId.value as string, payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId.value] }),
})

const updatePublicMutation = useMutation({
  mutationFn: (payload: { is_public: boolean }) =>
    tournamentService.update(tournamentId.value as string, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId.value] })
    fetchTournament()
  },
})
const toggleDisabled = computed(
  () => updatePublicMutation.isPending.value || !currentTournament.value || !isHost.value,
)
const updateFeedback = ref<'success' | 'error' | null>(null)
const selectedTeam = ref<TeamSearchItem | null>(null)
const inviteFeedback = ref<'success' | 'error' | null>(null)
const inviteErrorMessage = ref<string | null>(null)
const invitePending = computed(() => inviteMutation.isPending.value)
const inviteDisabled = computed(() => invitePending.value || !selectedTeam.value)

const invitationsQueryKey = computed(() => ['tournament-invitations', tournamentId.value])
const invitationsQuery = useQuery({
  queryKey: invitationsQueryKey,
  queryFn: () => tournamentService.invitations(tournamentId.value as string),
  enabled: computed(() => Boolean(tournamentId.value) && isHost.value),
})

const invitedTeams = computed<TournamentInvitation[]>(() => {
  const raw = invitationsQuery.data?.value || invitationsQuery.data
  if (Array.isArray(raw)) return raw
  return Array.isArray((raw as any)?.data) ? (raw as any).data : []
})

const invitedIds = computed(() => invitedTeams.value.map((team: any) => team.id))

const inviteMutation = useMutation({
  mutationFn: (payload: { team_id: number }) => tournamentService.invite(tournamentId.value as string, payload),
  onSuccess: () => {
    inviteFeedback.value = 'success'
    inviteErrorMessage.value = null
    selectedTeam.value = null
    queryClient.invalidateQueries({ queryKey: invitationsQueryKey.value })
  },
  onError: (error: any) => {
    inviteFeedback.value = 'error'
    inviteErrorMessage.value = error?.response?.data?.message || '邀請失敗，請稍後再試。'
  },
})

watch(
  () => selectedTeam.value,
  () => {
    inviteFeedback.value = null
    inviteErrorMessage.value = null
  },
)

const handleConfirm = (values: { team_id: number; token: string }) => confirmMutation.mutate(values)
const handleWithdraw = (values: { team_id: number }) => withdrawMutation.mutate(values)
const handleTogglePublic = (value: boolean) => {
  if (toggleDisabled.value) return
  updatePublicMutation.reset()
  updateFeedback.value = null
  updatePublicMutation.mutate(
    { is_public: value },
    {
      onSuccess: () => {
        updateFeedback.value = 'success'
      },
      onError: () => {
        updateFeedback.value = 'error'
      },
    },
  )
}

const handleInviteTeam = () => {
  inviteFeedback.value = null
  inviteErrorMessage.value = null
  if (!selectedTeam.value) {
    inviteFeedback.value = 'error'
    inviteErrorMessage.value = '請先選擇隊伍'
    return
  }
  inviteMutation.mutate({ team_id: selectedTeam.value.id })
}

const fetchTournament = async () => {
  if (!tournamentId.value) {
    tournamentError.value = '缺少賽事編號'
    tournamentLoading.value = false
    return
  }

  tournamentLoading.value = true
  tournamentError.value = null
  try {
    const resp = await tournamentService.detail(tournamentId.value)
    tournament.value = (resp as any)?.data ?? resp
  } catch (err: any) {
    tournamentError.value = err?.message || '無法取得賽事資料'
    tournament.value = null
  } finally {
    tournamentLoading.value = false
  }
}

const formatInviteDate = (value?: string | null) => {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

onMounted(() => {
  fetchTournament()
  updatePublicMutation.reset()
  updateFeedback.value = null
  if (authStore.token && !authStore.user) {
    authStore.fetchMe().catch(() => undefined)
  }
})

watch(
  () => route.params.id,
  () => {
    updatePublicMutation.reset()
    updateFeedback.value = null
    fetchTournament()
  },
)
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="賽事報名管理"
      subtitle="主辦方設定公開報名開關，並可處理邀請/確認/退出。"
      eyebrow="Registration"
    />

    <SectionCard title="公開報名開關" description="設定賽事是否接受公開報名（寫入 tournaments.is_public）。">
      <LoadingState v-if="tournamentLoading" message="載入賽事..." />
      <p v-else-if="tournamentError" class="text-sm text-red-600">{{ tournamentError }}</p>
      <div v-else-if="currentTournament" class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-700">目前狀態：</span>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'"
          >
            {{ isPublic ? '公開報名中' : '未開放公開報名' }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border px-3 py-2 text-sm font-semibold transition"
            :class="isPublic ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-800'"

            @click="handleTogglePublic(true)"
          >
            開啟公開報名
          </button>
          <button
            type="button"
            class="rounded-lg border px-3 py-2 text-sm font-semibold transition"
            :class="!isPublic ? 'border-slate-900 text-white bg-slate-900' : 'border-slate-200 text-slate-800'"
            @click="handleTogglePublic(false)"
          >
            關閉公開報名
          </button>
          <p v-if="!authStore.user" class="text-xs text-slate-500">載入使用者資料中...</p>
          <p v-else-if="!isHost" class="text-xs text-slate-500">僅主辦方可操作此開關。</p>
          <p v-if="updateFeedback === 'error'" class="text-sm text-red-600">更新失敗，請再試一次。</p>
          <p v-else-if="updateFeedback === 'success'" class="text-sm text-emerald-600">已更新公開報名狀態。</p>
        </div>
      </div>
      <p v-else class="text-sm text-red-600">無法取得賽事資料。</p>
    </SectionCard>

    <SectionCard
      title="主辦方邀請"
      description="搜尋隊伍並發送邀請，系統會寄送邀請信給隊長。"
    >
      <div v-if="!isHost" class="text-sm text-slate-500">僅主辦方可操作此區塊。</div>
      <div v-else class="space-y-4">
        <TeamSearchSelect
          v-model="selectedTeam"
          label="搜尋隊伍"
          :exclude-ids="invitedIds"
          placeholder="輸入隊伍名稱或標籤"
        />
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="inviteDisabled"
            @click="handleInviteTeam"
          >
            {{ invitePending ? '邀請中...' : '發送邀請' }}
          </button>
          <p v-if="inviteFeedback === 'error'" class="text-sm text-red-600">
            {{ inviteErrorMessage || '邀請失敗，請稍後再試。' }}
          </p>
          <p v-else-if="inviteFeedback === 'success'" class="text-sm text-emerald-600">邀請已送出。</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">邀請中隊伍</p>
            <span class="text-xs text-slate-500">共 {{ invitedTeams.length }} 支</span>
          </div>
          <div v-if="invitationsQuery.isFetching" class="text-xs text-slate-500">載入邀請列表中...</div>
          <div v-else-if="invitationsQuery.error" class="text-xs text-red-600">邀請列表取得失敗。</div>
          <div v-else-if="!invitedTeams.length" class="text-xs text-slate-500">目前沒有邀請中隊伍。</div>
          <div v-else class="space-y-2">
            <div
              v-for="team in invitedTeams"
              :key="team.id"
              class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-slate-900">{{ team.name }}</p>
                  <p class="text-xs text-slate-600">
                    隊伍 ID: {{ team.id }} · 隊長：{{ team.creator?.name || '未知' }}
                  </p>
                </div>
                <span class="text-xs text-slate-500">到期：{{ formatInviteDate(team.invite_expires_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
            :options="teamOptions"
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
