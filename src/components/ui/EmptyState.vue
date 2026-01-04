<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-start gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-left">
    <p class="text-sm font-semibold text-slate-800">{{ props.title }}</p>
    <p v-if="props.description" class="text-sm text-slate-600">
      {{ props.description }}
    </p>
    <slot />
  </div>
</template>
