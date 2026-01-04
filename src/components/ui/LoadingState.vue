<script setup lang="ts">
const props = defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-700 shadow-sm">
    <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    <p class="text-sm">{{ props.message || '載入中...' }}</p>
  </div>
</template>
