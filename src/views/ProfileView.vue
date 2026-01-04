<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AvatarUploader from '@/components/upload/AvatarUploader.vue'
import { RouterLink } from 'vue-router'
import { userService } from '@/services/user'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const authStore = useAuthStore()
const queryClient = useQueryClient()

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['me'],
  queryFn: () => authStore.fetchMe(),
  enabled: authStore.isAuthenticated,
})

const user = computed(() => data?.value)

const updateAvatarMutation = useMutation({
  mutationFn: async (payload: { url: string }) => {
    // 假設後端支援 PATCH /user 更新頭像欄位 avatar_url
    return userService.updateProfile({ avatar_url: payload.url })
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
})

const handleAvatarUploaded = (payload: { url: string }) => {
  updateAvatarMutation.mutate({ url: payload.url })
}
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      title="個人中心"
      subtitle="檢視當前登入者資訊與所屬隊伍列表。"
      eyebrow="Account"
    >
      <template #actions>
        <button
          v-if="authStore.isAuthenticated"
          class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          @click="authStore.logout().then(() => refetch())"
        >
          登出
        </button>
      </template>
    </PageHeader>

    <div v-if="!authStore.isAuthenticated" class="space-y-4">
      <EmptyState title="尚未登入" description="請先登入以讀取個人資料。">
        <RouterLink to="/login" class="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:underline">
          前往登入
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2">
      <SectionCard title="基本資訊" description="使用 api/auth/me 取得使用者資料。">
        <LoadingState v-if="isLoading" message="載入個人資料..." />
        <p v-else-if="error" class="text-sm text-red-600">讀取失敗，請重試。</p>
        <div v-else-if="user" class="space-y-2 text-sm text-slate-700">
          <div class="flex items-center gap-4">
            <div class="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              <img v-if="user.avatar_url" :src="user.avatar_url" alt="avatar" class="h-full w-full object-cover" />
            </div>
            <AvatarUploader
              scope="user"
              :reference-id="user.id"
              :initial-url="user.avatar_url"
              label="個人頭像"
              @uploaded="handleAvatarUploaded"
            />
          </div>
          <p><span class="font-semibold">名稱：</span>{{ user.name }}</p>
          <p><span class="font-semibold">Email：</span>{{ user.email }}</p>
          <button
            class="mt-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
            @click="refetch()"
          >
            重新整理
          </button>
        </div>
      </SectionCard>

      <SectionCard title="我的隊伍" description="透過 api/user (或相應端點) 取得所屬隊伍列表。">
        <LoadingState v-if="isLoading" message="載入隊伍..." />
        <EmptyState
          v-else-if="user && (!user.teams || user.teams.length === 0)"
          title="目前沒有隊伍"
          description="建立或加入一個隊伍開始參賽。"
        >
          <RouterLink to="/" class="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline">
            查看賽事
          </RouterLink>
        </EmptyState>
        <ul v-else class="space-y-3 text-sm text-slate-800">
          <li v-for="team in user?.teams" :key="team.id" class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <div>
              <p class="font-semibold">{{ team.name }}</p>
              <p class="text-xs text-slate-600">角色：{{ team.role || '成員' }}</p>
            </div>
            <RouterLink
              :to="`/teams/${team.id}`"
              class="text-xs font-semibold text-blue-600 hover:underline"
            >
              檢視
            </RouterLink>
          </li>
        </ul>
      </SectionCard>
    </div>
  </section>
</template>
