<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { teamService } from '@/services/teams'

const route = useRoute()
const queryClient = useQueryClient()
const id = route.params.id as string

const teamQuery = useQuery({
  queryKey: ['team', id],
  queryFn: () => teamService.detail(id),
})

const membersQuery = useQuery({
  queryKey: ['team', id, 'members'],
  queryFn: () => teamService.members(id),
})

const updateMutation = useMutation({
  mutationFn: (values: any) => teamService.update(id, values),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['team', id] })
  },
})

const addMemberMutation = useMutation({
  mutationFn: (values: { user_id: number; role?: string }) => teamService.addMember(id, values),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', id, 'members'] }),
})
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="我的隊伍管理"
      subtitle="編輯隊伍、邀請或移除隊員。"
      eyebrow="Teams"
    />

    <div class="grid gap-6 md:grid-cols-2">
      <SectionCard
        title="基本資料"
        description="使用 api/teams (PUT) 編輯名稱、Logo、簡介。"
      >
        <LoadingState v-if="teamQuery.isLoading" message="載入隊伍..." />
        <p v-else-if="teamQuery.error" class="text-sm text-red-600">無法取得隊伍資料。</p>
        <FormKit
          v-else
          type="form"
          :actions="false"
          :value="teamQuery.data"
          @submit="updateMutation.mutate"
        >
          <div class="grid gap-4">
            <FormKit type="text" name="name" label="隊伍名稱" validation="required" />
            <FormKit type="text" name="logo_url" label="Logo URL" />
            <FormKit type="textarea" name="description" label="簡介" />
            <button
              type="submit"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="updateMutation.isPending"
            >
              {{ updateMutation.isPending ? '儲存中...' : '儲存' }}
            </button>
            <p v-if="updateMutation.error" class="text-sm text-red-600">更新失敗，請重試。</p>
          </div>
        </FormKit>
      </SectionCard>

      <SectionCard title="成員管理" description="使用 api/teams/{id}/members 執行 addMember / removeMember。">
        <LoadingState v-if="membersQuery.isLoading" message="載入成員..." />
        <p v-else-if="membersQuery.error" class="text-sm text-red-600">無法取得成員。</p>
        <div v-else class="space-y-3">
          <EmptyState
            v-if="!membersQuery.data?.data?.length"
            title="目前沒有成員"
            description="邀請成員加入以便報名賽事。"
          />
          <ul v-else class="space-y-2 text-sm text-slate-800">
            <li
              v-for="member in membersQuery.data.data"
              :key="member.id"
              class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <div>
                <p class="font-semibold">{{ member.name || member.email }}</p>
                <p class="text-xs text-slate-500">角色：{{ member.role || '成員' }}</p>
              </div>
            </li>
          </ul>

          <div class="rounded-lg border border-dashed border-slate-200 p-3">
            <p class="mb-2 text-sm font-semibold text-slate-800">邀請新成員</p>
            <FormKit
              type="form"
              :actions="false"
              @submit="addMemberMutation.mutate"
            >
              <div class="grid gap-2">
                <FormKit type="number" name="user_id" label="User ID" validation="required" />
                <FormKit type="text" name="role" label="角色" />
                <button
                  type="submit"
                  class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  :disabled="addMemberMutation.isPending"
                >
                  {{ addMemberMutation.isPending ? '邀請中...' : '送出邀請' }}
                </button>
                <p v-if="addMemberMutation.error" class="text-xs text-red-600">邀請失敗。</p>
              </div>
            </FormKit>
          </div>
        </div>
      </SectionCard>
    </div>
  </section>
</template>
