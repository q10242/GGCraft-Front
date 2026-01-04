<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
}>()
</script>

<template>
  <header class="space-y-2">
    <p v-if="props.eyebrow" class="text-xs uppercase tracking-[0.14em] text-slate-500">
      {{ props.eyebrow }}
    </p>
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">
          {{ props.title }}
        </h1>
        <p v-if="props.subtitle" class="mt-1 text-slate-600">
          {{ props.subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
