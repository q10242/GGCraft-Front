<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import AvatarUploader from '@/components/upload/AvatarUploader.vue'
import { teamService } from '@/services/teams'

const router = useRouter()
const formValue = ref<{ name?: string; description?: string; logo_url?: string }>({})
const serverError = ref<string | null>(null)
const isSubmitting = computed(() => createMutation.isPending === true)

const createMutation = useMutation({
  mutationFn: (values: { name: string; description?: string; logo_url?: string }) => teamService.create(values),
  onSuccess: (data) => {
    router.push(`/teams/${data.id || ''}`)
  },
})

const handleUploaded = (payload: { url: string }) => {
  formValue.value = { ...formValue.value, logo_url: payload.url }
}

const handleSubmit = (values: { name: string; description?: string; logo_url?: string }) => {
  serverError.value = null
  createMutation.mutate(values, {
    onError: () => {
      serverError.value = '建立失敗，請重試。'
    },
  })
}
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6 px-6 py-10">
    <PageHeader
      title="創建隊伍"
      subtitle="提交隊伍名稱、頭像、簡介，建立後可邀請成員與報名賽事。"
      eyebrow="Teams"
    />

    <SectionCard title="隊伍資料">
      <FormKit
        type="form"
        :actions="false"
        :value="formValue"
        @submit="handleSubmit"
      >
        <div class="grid gap-4">
          <FormKit type="text" name="name" label="隊伍名稱" validation="required" />
          <FormKit type="hidden" name="logo_url" :value="formValue.logo_url" />
          <AvatarUploader
            scope="team"
            label="隊伍頭像"
            @uploaded="handleUploaded"
          />
          <FormKit type="textarea" name="description" label="隊伍簡介" />
          <button
            type="submit"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '建立中...' : '建立隊伍' }}
          </button>
          <p v-if="serverError" class="text-sm text-red-600">{{ serverError }}</p>
        </div>
      </FormKit>
    </SectionCard>
  </section>
</template>
