<script setup lang="ts">
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
      <LoadingState v-if="teamQuery.isLoading" message="載入隊伍..." />
      <p v-else-if="teamQuery.error" class="text-sm text-red-600">無法取得隊伍資料。</p>
      <div v-else-if="teamQuery.data" class="space-y-2 text-sm text-slate-700">
        <p><span class="font-semibold">名稱：</span>{{ teamQuery.data.name }}</p>
        <p><span class="font-semibold">簡介：</span>{{ teamQuery.data.description || '無' }}</p>
      </div>
      <EmptyState v-else title="尚無資料" />
    </SectionCard>

    <SectionCard title="成員">
      <LoadingState v-if="membersQuery.isLoading" message="載入成員..." />
      <p v-else-if="membersQuery.error" class="text-sm text-red-600">無法取得成員。</p>
      <EmptyState
        v-else-if="!membersQuery.data?.data?.length"
        title="尚無成員"
        description="可以邀請隊員加入。"
      />
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="member in membersQuery.data.data"
          :key="member.id"
          class="flex items-center justify-between py-2 text-sm text-slate-800"
        >
          <div>
            <p class="font-semibold">{{ member.name || member.email }}</p>
            <p class="text-xs text-slate-500">角色：{{ member.role || '成員' }}</p>
          </div>
        </li>
      </ul>
    </SectionCard>

    <SectionCard title="歷史賽績" description="api/teams/{id}/matches。">
      <LoadingState v-if="matchesQuery.isLoading" message="載入賽績..." />
      <p v-else-if="matchesQuery.error" class="text-sm text-red-600">無法取得賽績。</p>
      <EmptyState v-else-if="!matchesQuery.data?.data?.length" title="還沒有賽績" />
      <div v-else class="space-y-2 text-sm text-slate-800">
        <div
          v-for="match in matchesQuery.data.data"
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
  </section>
</template>
