<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
    <div v-if="props.title || props.description" class="mb-3 space-y-1">
      <h2 v-if="props.title" class="text-lg font-semibold text-slate-900">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-sm text-slate-600">
        {{ props.description }}
      </p>
    </div>
    <slot />
  </section>
</template>
