<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import { teamService } from '@/services/teams'

const router = useRouter()

const createMutation = useMutation({
  mutationFn: (values: any) => teamService.create(values),
  onSuccess: (data) => {
    router.push(`/teams/${data.id || ''}`)
  },
})
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6 px-6 py-10">
    <PageHeader
      title="創建隊伍"
      subtitle="提交隊伍名稱、Logo、簡介，建立後可邀請成員與報名賽事。"
      eyebrow="Teams"
    />

    <SectionCard title="隊伍資料">
      <FormKit
        type="form"
        :actions="false"
        @submit="createMutation.mutate"
      >
        <div class="grid gap-4">
          <FormKit type="text" name="name" label="隊伍名稱" validation="required" />
          <FormKit type="text" name="logo_url" label="Logo URL" />
          <FormKit type="textarea" name="description" label="隊伍簡介" />
          <button
            type="submit"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="createMutation.isPending"
          >
            {{ createMutation.isPending ? '建立中...' : '建立隊伍' }}
          </button>
          <p v-if="createMutation.error" class="text-sm text-red-600">建立失敗，請重試。</p>
        </div>
      </FormKit>
    </SectionCard>
  </section>
</template>
