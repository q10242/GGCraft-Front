<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref, watch, computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AvatarUploader from '@/components/upload/AvatarUploader.vue'
import UserSearchSelect from '@/components/users/UserSearchSelect.vue'
import { teamService } from '@/services/teams'
import { invitationService } from '@/services/invitations'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const queryClient = useQueryClient()
const id = route.params.id as string
const authStore = useAuthStore()

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
  mutationFn: (values: { user_id: number; role?: string }) => invitationService.create(id, values.user_id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['team', id, 'members'] })
    invitationsQuery.refetch()
  },
})

const formValue = ref<any>({})
const selectedUser = ref<{ id: number; name: string; email: string } | null>(null)
const newRole = ref<string>('')

const teamLoading = computed(() => teamQuery.isPending.value)
const membersLoading = computed(() => membersQuery.isPending.value)
const logoUrl = computed(() => teamQuery.data?.value?.logo_url || teamQuery.data?.value?.creator?.avatar_url)
const isSaving = computed(() => updateMutation.isPending.value)
const invitePending = computed(() => addMemberMutation.isPending.value)
const inviteError = computed(() => addMemberMutation.error?.value)
const inviteSuccess = computed(() => addMemberMutation.isSuccess.value)
const members = computed(
  () => teamQuery.data?.value?.members ?? membersQuery.data?.value?.data ?? membersQuery.data?.value ?? []
)
const memberIds = computed(() => members.value.map((m: any) => m.id))
const invitationsQuery = useQuery({
  queryKey: ['team', id, 'invitations'],
  queryFn: () => invitationService.list(id),
})
const invitations = computed(() => invitationsQuery.data?.value?.filter((i: any) => i.status === 'pending') || [])
const cancelInvitation = async (invitationId: number) => {
  await invitationService.cancel(id, invitationId)
  invitationsQuery.refetch()
}

watch(
  () => teamQuery.data?.value,
  (val) => {
    if (val) formValue.value = { ...val }
  },
  { immediate: true }
)

const handleUploaded = (payload: { url: string }) => {
  formValue.value = { ...formValue.value, logo_url: payload.url }
}

const roleLabel = (member: any) => member.role || member.pivot?.role || 'member'

const setCaptain = async (memberId: number) => {
  if (!window.confirm('確定將隊長移交給此隊員嗎？')) return
  await teamService.updateMemberRole(id, memberId, 'captain')
  await teamService.update(id, { creator_id: memberId }).catch(() => undefined)
  membersQuery.refetch()
  teamQuery.refetch()
}
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
        <LoadingState v-if="teamLoading" message="載入隊伍..." />
        <p v-else-if="teamQuery.error?.value" class="text-sm text-red-600">無法取得隊伍資料。</p>
        <FormKit
          v-else
          type="form"
          :actions="false"
          :value="formValue"
          @submit="updateMutation.mutate"
        >
          <div class="grid gap-4">
            <FormKit type="text" name="name" label="隊伍名稱" validation="required" />
            <FormKit type="hidden" name="logo_url" :value="formValue?.logo_url" />
            <AvatarUploader
              scope="team"
              :reference-id="id"
              label="隊伍 Logo"
              :initial-url="logoUrl"
              @uploaded="handleUploaded"
            />
            <FormKit type="textarea" name="description" label="簡介" />
            <button
              type="submit"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="isSaving"
            >
              {{ isSaving ? '儲存中...' : '儲存' }}
            </button>
            <p v-if="updateMutation.error?.value" class="text-sm text-red-600">更新失敗，請重試。</p>
          </div>
        </FormKit>
      </SectionCard>

      <SectionCard title="成員管理" description="成員列表；邀請請使用 /invitations API。">
        <LoadingState v-if="membersLoading" message="載入成員..." />
        <p v-else-if="membersQuery.error?.value" class="text-sm text-red-600">無法取得成員。</p>
        <div v-else class="space-y-3">
          <EmptyState
            v-if="!members.length"
            title="目前沒有成員"
            description="邀請成員加入以便報名賽事。"
          />
          <ul v-else class="space-y-2 text-sm text-slate-800">
            <li
              v-for="member in members"
              :key="member.id"
              class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <div>
                <p class="font-semibold">{{ member.name || member.email }}</p>
                <p class="text-xs text-slate-500">角色：{{ roleLabel(member) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="member.id !== authStore.user?.id && roleLabel(member) !== 'captain'"
                  class="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:border-red-300"
                  @click="() => {
                    const reason = window.prompt('移除理由（可留空）：') || undefined
                    teamService.removeMember(id, member.id, { reason }).then(() => {
                      membersQuery.refetch()
                      teamQuery.refetch()
                      invitationsQuery.refetch()
                    })
                  }"
                >
                  移除
                </button>
                <button
                  v-if="member.id !== authStore.user?.id && roleLabel(member) !== 'captain'"
                  class="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
                  @click="setCaptain(member.id)"
                >
                  設為隊長
                </button>
              </div>
            </li>
          </ul>

          <div class="rounded-lg border border-dashed border-slate-200 p-3 space-y-3">
            <p class="text-sm font-semibold text-slate-800">邀請新成員</p>
            <UserSearchSelect
              v-model="selectedUser"
              placeholder="搜尋帳號或暱稱"
              :exclude-ids="memberIds"
              label="邀請新成員"
            />
            <div class="flex items-center gap-2">
              <button
                class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                :disabled="invitePending || !selectedUser"
                @click="addMemberMutation.mutate({ user_id: selectedUser!.id, role: 'member' })"
              >
                {{ invitePending ? '邀請中...' : '送出邀請' }}
              </button>
              <p v-if="inviteError" class="text-xs text-red-600">邀請失敗。</p>
              <p v-else-if="inviteSuccess" class="text-xs text-green-700">邀請已送出。</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="邀請中" description="待接受的邀請，接受前無法設定角色或成為隊長。">
        <LoadingState v-if="invitationsQuery.isPending.value" message="載入邀請..." />
        <p v-else-if="invitationsQuery.error?.value" class="text-sm text-red-600">無法取得邀請列表。</p>
        <EmptyState v-else-if="!invitations.length" title="目前沒有邀請" />
        <ul v-else class="space-y-2 text-sm text-slate-800">
          <li
            v-for="invite in invitations"
            :key="invite.id"
            class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
          >
            <div>
              <p class="font-semibold">User #{{ invite.user_id }}</p>
              <p class="text-xs text-slate-500">狀態：{{ invite.status }}</p>
            </div>
            <button
              class="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:border-red-300"
              @click="cancelInvitation(invite.id)"
            >
              取消邀請
            </button>
          </li>
        </ul>
      </SectionCard>
    </div>
  </section>
</template>
