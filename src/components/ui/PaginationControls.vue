<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  perPage?: number
  total?: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const totalPages = computed(() => {
  if (!props.total || !props.perPage) return undefined
  return Math.max(1, Math.ceil(props.total / props.perPage))
})

const canPrev = computed(() => props.page > 1)
const canNext = computed(() => {
  if (!totalPages.value) return true
  return props.page < totalPages.value
})

const handlePrev = () => {
  if (canPrev.value) emit('update:page', props.page - 1)
}
const handleNext = () => {
  if (canNext.value) emit('update:page', props.page + 1)
}
</script>

<template>
  <div class="flex items-center justify-end gap-3 text-sm text-slate-700">
    <p v-if="totalPages" class="text-slate-600">
      第 {{ props.page }} / {{ totalPages }} 頁
    </p>
    <div class="flex items-center gap-2">
      <button
        class="rounded-md border border-slate-200 px-3 py-1.5 text-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canPrev"
        @click="handlePrev"
      >
        上一頁
      </button>
      <button
        class="rounded-md border border-slate-200 px-3 py-1.5 text-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canNext"
        @click="handleNext"
      >
        下一頁
      </button>
    </div>
  </div>
</template>
