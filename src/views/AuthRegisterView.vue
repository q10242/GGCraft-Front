<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'

const authStore = useAuthStore()
const router = useRouter()

const handleSubmit = async (values: { name: string; email: string; password: string; password_confirmation: string }) => {
  await authStore.register(values)
  // 預期後端寄送驗證信，導向驗證提示頁
  router.push({ name: 'verify-email', query: { email: values.email } })
}
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="註冊"
      subtitle="透過 api/auth/register 建立新帳號並回傳 JWT。"
      eyebrow="Auth"
    />

    <SectionCard title="建立帳號" description="完成後直接登入並導向個人中心。">
      <FormKit type="form" submit-label="註冊" :actions="false" @submit="handleSubmit">
        <div class="grid gap-4">
          <FormKit
            type="text"
            name="name"
            label="暱稱 / 顯示名稱"
            validation="required|length:2,30"
            inner-class="mt-1"
          />
          <FormKit
            type="email"
            name="email"
            label="Email"
            validation="required|email"
            inner-class="mt-1"
          />
          <FormKit
            type="password"
            name="password"
            label="密碼"
            validation="required|length:6"
            inner-class="mt-1"
          />
          <FormKit
            type="password"
            name="password_confirmation"
            label="確認密碼"
            validation="required|confirm:password"
            inner-class="mt-1"
          />
          <div class="flex items-center justify-between text-xs text-slate-600">
            <p>送出後將寄送驗證信，請至信箱完成驗證。</p>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">已經有帳號？</span>
              <RouterLink to="/login" class="font-semibold text-blue-600 hover:underline">去登入</RouterLink>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              :disabled="authStore.loading"
            >
              {{ authStore.loading ? '處理中...' : '註冊並登入' }}
            </button>
          </div>
        </div>
      </FormKit>
      <div class="mt-4">
        <LoadingState v-if="authStore.loading" message="正在呼叫 api/auth/register ..." />
      </div>
    </SectionCard>
  </section>
</template>
