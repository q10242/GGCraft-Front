<script setup lang="ts">
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleSubmit = async (values: { email: string; password: string }) => {
  await authStore.login(values)
  const redirect = (route.query.redirect as string) || '/'
  router.push(redirect)
}
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <PageHeader
      title="登入"
      subtitle="透過 api/auth/login 取得 JWT，後續請求附帶 Authorization Bearer token。"
      eyebrow="Auth"
    />

    <SectionCard title="登入帳號" description="提交後會自動儲存 token 並刷新使用者資料。">
      <FormKit type="form" submit-label="登入" :actions="false" @submit="handleSubmit">
        <div class="grid gap-4">
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
          <div class="flex items-center justify-between">
            <RouterLink to="/register" class="text-sm text-blue-600 hover:underline">去註冊</RouterLink>
            <button
              type="submit"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              :disabled="authStore.loading"
            >
              {{ authStore.loading ? '登入中...' : '登入' }}
            </button>
          </div>
        </div>
      </FormKit>
      <div class="mt-4">
        <LoadingState v-if="authStore.loading" message="正在與 api/auth/login 通訊..." />
      </div>
    </SectionCard>
  </section>
</template>
