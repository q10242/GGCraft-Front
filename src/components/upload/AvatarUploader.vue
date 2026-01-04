<script setup lang="ts">
import { ref, watch } from 'vue'
import { uploadService } from '@/services/upload'

const props = defineProps<{
  scope: 'user' | 'team'
  referenceId?: number | string
  label?: string
  initialUrl?: string
}>()

const emit = defineEmits<{
  (e: 'uploaded', payload: { url: string; path: string }): void
}>()

const uploading = ref(false)
const previewUrl = ref<string | undefined>(props.initialUrl)
const errorMsg = ref<string | null>(null)

watch(
  () => props.initialUrl,
  (val) => {
    previewUrl.value = val
  }
)

const handleFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  errorMsg.value = null
  uploading.value = true
  try {
    const res = await uploadService.uploadAvatar({
      file,
      scope: props.scope,
      referenceId: props.referenceId,
    })
    previewUrl.value = res.url
    emit('uploaded', { url: res.url, path: res.path })
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message || '上傳失敗，請稍後再試'
  } finally {
    uploading.value = false
    target.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-semibold text-slate-800">{{ label || '頭像 / Logo' }}</p>
    <div class="flex items-center gap-3">
      <div class="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <img v-if="previewUrl" :src="previewUrl" alt="avatar preview" class="h-full w-full object-cover" />
      </div>
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-300">
        <input type="file" accept="image/*" class="hidden" @change="handleFile" />
        {{ uploading ? '上傳中...' : '選擇圖片' }}
      </label>
    </div>
    <p v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</p>
    <p class="text-xs text-slate-500">支援 png/jpg，最大約 4MB，會上傳到 GCS。</p>
  </div>
</template>
