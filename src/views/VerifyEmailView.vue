<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const status = ref<'idle' | 'verifying' | 'verified' | 'error'>('idle')
const message = ref('')

const statusParam = route.query.status as string | undefined
const id = route.query.id as string | undefined
const hash = route.query.hash as string | undefined
const expires = route.query.expires as string | undefined
const signature = route.query.signature as string | undefined
const backendUrl = route.query.url as string | undefined

const verifyNow = async () => {
  if (statusParam) {
    if (statusParam === 'verified' || statusParam === 'already_verified') {
      status.value = 'verified'
      message.value = 'Email 已驗證，您現在可以登入並使用完整功能。'
      await authStore.fetchMe().catch(() => undefined)
    } else if (statusParam === 'expired') {
      status.value = 'error'
      message.value = '驗證連結已過期，請重新寄送驗證信。'
    } else {
      status.value = 'error'
      message.value = '驗證狀態未知，請重新驗證或重寄郵件。'
    }
    return
  }

  if (backendUrl) {
    status.value = 'verifying'
    try {
      await api.get(backendUrl)
      status.value = 'verified'
      message.value = 'Email 驗證成功，您現在可以開始使用完整功能。'
      await authStore.fetchMe().catch(() => undefined)
      setTimeout(() => router.push('/'), 800)
      return
    } catch (error: any) {
      status.value = 'error'
      message.value = error?.response?.data?.message || '驗證失敗，請稍後再試或重新寄送驗證信。'
      return
    }
  }

  if (!id || !hash || !expires || !signature) {
    status.value = 'error'
    message.value = '缺少驗證資訊，請從郵件連結開啟。'
    return
  }
  status.value = 'verifying'
  try {
    await authStore.verifyEmail({ id, hash, expires, signature })
    status.value = 'verified'
    message.value = 'Email 驗證成功，您現在可以開始使用完整功能。'
    await authStore.fetchMe().catch(() => undefined)
    setTimeout(() => router.push('/'), 1200)
  } catch (error: any) {
    status.value = 'error'
    message.value = error?.response?.data?.message || '驗證失敗，請稍後再試或重新寄送驗證信。'
  }
}

const resend = async () => {
  try {
    await authStore.resendVerificationEmail()
    message.value = '已重新寄送驗證信，請查收信箱。'
  } catch (error: any) {
    message.value = error?.response?.data?.message || '重新寄送失敗，請稍後再試。'
  }
}

onMounted(() => {
  verifyNow()
})
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="Email 驗證"
      subtitle="請透過信箱中的連結完成帳號啟用。"
      eyebrow="Auth"
    />

    <SectionCard>
      <LoadingState v-if="status === 'verifying'" message="驗證中，請稍候..." />
      <div v-else class="space-y-3 text-sm text-slate-800">
        <p>{{ message || '等待驗證中...' }}</p>
        <div class="flex flex-wrap gap-3">
          <button
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            @click="verifyNow"
          >
            重新驗證
          </button>
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300"
            @click="resend"
          >
            重寄驗證信
          </button>
        </div>
      </div>
    </SectionCard>
  </section>
</template>
