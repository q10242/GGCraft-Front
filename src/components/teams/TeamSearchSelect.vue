<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { teamService, type TeamSearchItem } from '@/services/teams'

const props = defineProps<{
  modelValue?: TeamSearchItem | null
  placeholder?: string
  excludeIds?: Array<number>
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TeamSearchItem | null): void
}>()

const searchTerm = ref('')
const selected = ref<TeamSearchItem | null>(props.modelValue ?? null)

watch(
  () => props.modelValue,
  (val) => {
    selected.value = val ?? null
  },
)

const { data, isFetching } = useQuery({
  queryKey: ['team-search', searchTerm],
  queryFn: () => teamService.search(searchTerm.value),
  enabled: computed(() => searchTerm.value.length >= 2),
})

const filtered = computed(() => {
  const list = (data?.value || []) as TeamSearchItem[]
  if (props.excludeIds?.length) {
    return list.filter((team) => !props.excludeIds!.includes(team.id))
  }
  return list
})

const choose = (team: TeamSearchItem) => {
  selected.value = team
  emit('update:modelValue', team)
}
</script>

<template>
  <div class="space-y-2">
    <p v-if="label" class="text-xs font-semibold text-slate-700">{{ label }}</p>
    <input
      v-model="searchTerm"
      :placeholder="placeholder || '搜尋隊伍名稱或標籤 (至少 2 字)'"
      class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
    />
    <div v-if="isFetching" class="text-xs text-slate-500">搜尋中...</div>
    <div v-else-if="searchTerm.length >= 2" class="rounded-md border border-slate-200">
      <template v-if="filtered?.length">
        <button
          v-for="team in filtered"
          :key="team.id"
          class="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
          @click="choose(team)"
        >
          <div>
            <p class="font-semibold text-slate-900">{{ team.name }}</p>
            <p class="text-xs text-slate-600">隊伍 ID: {{ team.id }}</p>
          </div>
          <span class="text-xs text-slate-500">
            隊長：{{ team.creator?.name || '未知' }}
          </span>
        </button>
      </template>
      <p v-else class="px-3 py-2 text-xs text-slate-500">無符合結果</p>
    </div>
    <div v-if="selected" class="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700">
      已選擇：{{ selected.name }}（ID: {{ selected.id }}，隊長：{{ selected.creator?.name || '未知' }}）
    </div>
  </div>
</template>
