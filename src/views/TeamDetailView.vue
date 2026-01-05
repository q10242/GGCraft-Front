<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { teamService } from '@/services/teams'

const route = useRoute()
const id = route.params.id as string

const teamQuery = useQuery({
  queryKey: ['team', id],
  queryFn: () => teamService.detail(id),
})

const membersQuery = useQuery({
  queryKey: ['team', id, 'members'],
  queryFn: () => teamService.members(id),
})

const matchesQuery = useQuery({
  queryKey: ['team', id, 'matches'],
  queryFn: () => teamService.matches(id),
})

const tournamentsQuery = useQuery({
  queryKey: ['team', id, 'tournaments'],
  queryFn: () => teamService.tournaments(id),
})

const team = computed(() => teamQuery.data?.value)
const members = computed(() => team?.value?.members ?? membersQuery.data?.value?.data ?? membersQuery.data?.value ?? [])
const matches = computed(() => team?.value?.home_matches ?? matchesQuery.data?.value?.data ?? matchesQuery.data?.value ?? [])
const tournaments = computed(() => team?.value?.tournaments ?? tournamentsQuery.data?.value?.data ?? tournamentsQuery.data?.value ?? [])
const logoUrl = computed(() => team?.value?.logo_url || team?.value?.creator?.avatar_url)
const memberRole = (member: any) => member.role || member.pivot?.role || '成員'

const teamLoading = computed(() => teamQuery.isPending.value)
const membersLoading = computed(() => membersQuery.isPending.value)
const matchesLoading = computed(() => matchesQuery.isPending.value)
const tournamentsLoading = computed(() => tournamentsQuery.isPending.value)

const teamError = computed(() => !teamLoading.value && Boolean(teamQuery.error?.value))
const membersError = computed(
  () => !membersLoading.value && Boolean(membersQuery.error?.value) && (!members.value || members.value.length === 0)
)
const matchesError = computed(
  () => !matchesLoading.value && Boolean(matchesQuery.error?.value) && (!matches.value || matches.value.length === 0)
)
const tournamentsError = computed(
  () => !tournamentsLoading.value && Boolean(tournamentsQuery.error?.value) && (!tournaments.value || tournaments.value.length === 0)
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="隊伍詳情"
      subtitle="查看隊伍資訊、成員列表與歷史賽績。"
      eyebrow="Teams"
    >
      <template #actions>
        <RouterLink
          :to="`/teams/${id}/manage`"
          class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300"
        >
          管理
        </RouterLink>
      </template>
    </PageHeader>

    <SectionCard title="基本資訊">
      <LoadingState v-if="teamLoading" message="載入隊伍..." />
      <p v-else-if="teamError" class="text-sm text-red-600">無法取得隊伍資料。</p>
      <div v-else-if="team" class="space-y-3 text-sm text-slate-700">
        <div class="flex items-center gap-4">
          <div class="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <img v-if="logoUrl" :src="logoUrl" alt="logo" class="h-full w-full object-cover" />
          </div>
          <div>
            <p class="text-lg font-semibold text-slate-900">{{ team.name }}</p>
            <p class="text-xs text-slate-500">隊伍 ID：{{ team.id }}</p>
          </div>
        </div>
        <p><span class="font-semibold">簡介：</span>{{ team.description || '無' }}</p>
      </div>
      <EmptyState v-else title="尚無資料" />
    </SectionCard>

    <SectionCard title="成員">
      <LoadingState v-if="membersLoading" message="載入成員..." />
      <p v-else-if="membersError" class="text-sm text-red-600">無法取得成員。</p>
      <EmptyState
        v-else-if="!members?.length"
        title="尚無成員"
        description="可以邀請隊員加入。"
      />
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="member in members"
          :key="member.id"
          class="flex items-center justify-between py-2 text-sm text-slate-800"
        >
          <div>
            <p class="font-semibold">{{ member.name || member.email }}</p>
            <p class="text-xs text-slate-500">角色：{{ memberRole(member) }}</p>
          </div>
        </li>
      </ul>
    </SectionCard>

    <SectionCard title="歷史賽績" description="api/teams/{id}/matches。">
      <LoadingState v-if="matchesLoading" message="載入賽績..." />
      <p v-else-if="matchesError" class="text-sm text-red-600">無法取得賽績。</p>
      <EmptyState v-else-if="!matches?.length" title="還沒有賽績" />
      <div v-else class="space-y-2 text-sm text-slate-800">
        <div
          v-for="match in matches"
          :key="match.id"
          class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
        >
          <div>
            <p class="font-semibold">{{ match.tournament_name || '未命名賽事' }}</p>
            <p class="text-xs text-slate-500">{{ match.date || '' }}</p>
          </div>
          <span class="text-xs font-semibold text-slate-700">
            {{ match.result || 'N/A' }}
          </span>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="參加賽事">
      <LoadingState v-if="tournamentsLoading" message="載入賽事..." />
      <p v-else-if="tournamentsError" class="text-sm text-red-600">無法取得賽事列表。</p>
      <EmptyState v-else-if="!tournaments?.length" title="尚未參加賽事" />
      <div v-else class="space-y-2 text-sm text-slate-800">
        <div
          v-for="tour in tournaments"
          :key="tour.id"
          class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
        >
          <RouterLink :to="`/tournaments/${tour.id}`" class="font-semibold text-slate-900 hover:underline">
            {{ tour.name }}
          </RouterLink>
          <span class="text-xs uppercase tracking-[0.1em] text-slate-500">{{ tour.status || '' }}</span>
        </div>
      </div>
    </SectionCard>
  </section>
</template>
