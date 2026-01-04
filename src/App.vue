<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="text-lg font-semibold text-slate-900">GGCraft</RouterLink>
        <nav class="flex items-center gap-4 text-sm font-medium text-slate-700">
          <RouterLink to="/" class="hover:text-slate-900">賽事列表</RouterLink>
          <RouterLink to="/tournaments/new" class="hover:text-slate-900">賽事建立</RouterLink>
          <RouterLink to="/teams/new" class="hover:text-slate-900">創建隊伍</RouterLink>
          <RouterLink to="/profile" class="hover:text-slate-900">個人中心</RouterLink>
          <template v-if="!isAuthenticated">
            <RouterLink to="/login" class="hover:text-slate-900">登入</RouterLink>
            <RouterLink to="/register" class="hover:text-slate-900">註冊</RouterLink>
          </template>
          <template v-else>
            <button
              class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-slate-300"
              @click="authStore.logout()"
            >
              登出
            </button>
          </template>
        </nav>
      </div>
    </header>

    <main class="bg-slate-50">
      <RouterView />
    </main>
  </div>
</template>
