<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import UserSearchSelect from '@/components/users/UserSearchSelect.vue'
import { teamService } from '@/services/teams'

const route = useRoute()
const id = route.params.id as string
const selectedUser = ref<{ id: number; name: string; email: string } | null>(null)
const role = ref<string>('')

const teamQuery = useQuery({
  queryKey: ['team', id],
  queryFn: () => teamService.detail(id),
})

const addMutation = useMutation({
  mutationFn: () =>
    teamService.addMember(id, {
      user_id: selectedUser.value!.id,
      role: role.value || undefined,
    }),
})
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="加入隊員"
      subtitle="透過 user_id 邀請成員，並設定角色。"
      eyebrow="Teams"
    />

    <SectionCard>
      <LoadingState v-if="teamQuery.isLoading" message="載入隊伍..." />
      <p v-else-if="teamQuery.error" class="text-sm text-red-600">無法讀取隊伍。</p>
      <div v-else class="space-y-2 text-sm text-slate-700">
        <p class="font-semibold text-slate-900">{{ teamQuery.data.name }}</p>
        <p class="text-xs text-slate-500">ID: {{ id }}</p>
      </div>
    </SectionCard>

    <SectionCard title="邀請成員" description="使用 api/teams/{id}/members，帶上 user_id 與角色。">
      <div class="space-y-4">
        <UserSearchSelect
          v-model="selectedUser"
          placeholder="搜尋帳號或暱稱"
          :exclude-ids="teamQuery.data?.members?.map((m: any) => m.id) || []"
        />
        <FormKit
          type="text"
          v-model="role"
          label="角色"
          placeholder="captain / member / sub"
        />
        <div class="flex items-center gap-2">
          <button
            class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="addMutation.isPending || !selectedUser"
            @click="addMutation.mutate()"
          >
            {{ addMutation.isPending ? '邀請中...' : '送出邀請' }}
          </button>
          <RouterLink :to="`/teams/${id}/manage`" class="text-sm text-blue-600 hover:underline">返回管理</RouterLink>
        </div>
        <p v-if="addMutation.error" class="text-sm text-red-600">邀請失敗，請檢查選擇的用戶或權限。</p>
        <p v-else-if="addMutation.isSuccess" class="text-sm text-green-700">邀請已送出。</p>
      </div>
    </SectionCard>
  </section>
</template>
