<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { userService, type UserProfile } from '@/services/user'

const props = defineProps<{
  modelValue?: Pick<UserProfile, 'id' | 'name' | 'email' | 'avatar_url'>
  placeholder?: string
  excludeIds?: Array<number>
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Pick<UserProfile, 'id' | 'name' | 'email' | 'avatar_url'> | null): void
}>()

const searchTerm = ref('')
const selected = ref(props.modelValue ?? null)

watch(
  () => props.modelValue,
  (val) => {
    selected.value = val ?? null
  }
)

const { data, isFetching } = useQuery({
  queryKey: ['user-search', searchTerm],
  queryFn: () => userService.search(searchTerm.value),
  enabled: computed(() => searchTerm.value.length >= 2),
})

const filtered = computed(() => {
  const list = data?.value || []
  if (props.excludeIds?.length) {
    return list.filter((u) => !props.excludeIds!.includes(u.id))
  }
  return list
})

const choose = (user: Pick<UserProfile, 'id' | 'name' | 'email' | 'avatar_url'>) => {
  selected.value = user
  emit('update:modelValue', user)
}
</script>

<template>
  <div class="space-y-2">
    <p v-if="label" class="text-xs font-semibold text-slate-700">{{ label }}</p>
    <input
      v-model="searchTerm"
      :placeholder="placeholder || '搜尋帳號或暱稱 (至少 2 字)'"
      class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
    />
    <div v-if="isFetching" class="text-xs text-slate-500">搜尋中...</div>
    <div v-else-if="searchTerm.length >= 2" class="rounded-md border border-slate-200">
      <template v-if="filtered?.length">
        <button
          v-for="user in filtered"
          :key="user.id"
          class="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
          @click="choose(user)"
        >
          <span class="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            <img v-if="user.avatar_url" :src="user.avatar_url" alt="avatar" class="h-full w-full object-cover" />
            <span v-else>{{ user.name?.[0] || '?' }}</span>
          </span>
          <div>
            <p class="font-semibold text-slate-900">{{ user.name }}</p>
            <p class="text-xs text-slate-600">{{ user.email }}</p>
          </div>
        </button>
      </template>
      <p v-else class="px-3 py-2 text-xs text-slate-500">無符合結果</p>
    </div>
    <div v-if="selected" class="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700">
      已選擇：{{ selected.name }} ({{ selected.email }})
    </div>
  </div>
</template>
