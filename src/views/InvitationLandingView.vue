<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { invitationService, type Invitation } from '@/services/invitations'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = computed(() => route.params.token as string)
const invitation = ref<Invitation | null>(null)
const loading = ref(false)
const processing = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const autoAction = ref((route.query.action as string) || null)

const goLogin = () => {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

const fetchInvitation = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await invitationService.getByToken(token.value)
    if (data.user_id !== auth.user?.id) {
      error.value = '這個邀請不屬於目前登入的帳號。'
      return
    }
    invitation.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || '無法載入邀請'
  } finally {
    loading.value = false
  }
}

const handleResponse = async (action: 'accept' | 'reject') => {
  if (!invitation.value || invitation.value.status !== 'pending') return
  processing.value = true
  error.value = null
  try {
    if (action === 'accept') {
      await invitationService.accept(token.value)
      success.value = '已接受邀請'
      invitation.value = { ...invitation.value, status: 'accepted' }
    } else {
      await invitationService.reject(token.value)
      success.value = '已拒絕邀請'
      invitation.value = { ...invitation.value, status: 'rejected' }
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || '處理失敗'
  } finally {
    processing.value = false
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    goLogin()
    return
  }
  await fetchInvitation()
  if (autoAction.value === 'accept' || autoAction.value === 'reject') {
    await handleResponse(autoAction.value)
  }
})

watch(
  () => auth.isAuthenticated,
  async (val) => {
    if (val && !invitation.value && !loading.value) {
      await fetchInvitation()
    }
  }
)
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="隊伍邀請"
      subtitle="透過 token 驗證邀請，登入後可直接接受或拒絕。"
      eyebrow="Invitations"
    />

    <SectionCard title="邀請確認" description="檢視隊伍資訊並決定是否加入。">
      <div v-if="!auth.isAuthenticated" class="space-y-3 text-sm text-slate-700">
        <p>請先登入才能查看邀請內容。</p>
        <button class="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800" @click="goLogin">
          去登入
        </button>
      </div>

      <div v-else>
        <LoadingState v-if="loading" message="載入邀請中..." />
        <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
        <div v-else-if="invitation" class="space-y-3">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p class="font-semibold text-slate-900">{{ invitation.team?.name || `隊伍 #${invitation.team_id}` }}</p>
            <p class="text-slate-600">邀請人：{{ invitation.inviter?.name || invitation.invited_by }}</p>
            <p class="text-xs text-slate-500">狀態：{{ invitation.status }}</p>
          </div>

          <div v-if="success" class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {{ success }}
            <div v-if="invitation.status === 'accepted'" class="mt-2">
              <RouterLink
                :to="`/teams/${invitation.team_id}`"
                class="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                前往隊伍頁
              </RouterLink>
            </div>
            <p v-else-if="invitation.status === 'rejected'" class="mt-1 text-xs text-slate-700">
              你已婉拒邀請，若需加入請請隊長重新邀請。
            </p>
          </div>

          <div class="flex flex-wrap gap-2 text-sm">
            <button
              class="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="processing || invitation.status !== 'pending'"
              @click="handleResponse('accept')"
            >
              接受邀請
            </button>
            <button
              class="rounded-md border border-slate-200 px-4 py-2 hover:border-slate-300 disabled:opacity-60"
              :disabled="processing || invitation.status !== 'pending'"
              @click="handleResponse('reject')"
            >
              拒絕邀請
            </button>
            <RouterLink
              v-if="invitation.team_id"
              :to="`/teams/${invitation.team_id}`"
              class="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-slate-700 hover:border-slate-300"
            >
              查看隊伍
            </RouterLink>
          </div>
        </div>
      </div>
    </SectionCard>
  </section>
</template>
