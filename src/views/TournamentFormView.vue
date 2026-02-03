<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { tournamentService } from '@/services/tournaments'
import { fetchGames, type Game } from '@/services/games'
import { ref as vueRef } from 'vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const id = route.params.id as string | undefined
const isEdit = Boolean(id)

const tournamentQuery = useQuery({
  queryKey: ['tournament', id],
  queryFn: () => (id ? tournamentService.detail(id) : null),
  enabled: isEdit,
})

const defaultForm = {
  type: 'single_elimination',
  default_best_of: 1,
  is_public: false,
  total_prize: 0,
  entry_fee: 0,
  min_teams: 2,
} as Record<string, any>

const initialValue = computed<Record<string, any>>(() =>
  JSON.parse(JSON.stringify(isEdit && tournamentQuery.data?.value ? tournamentQuery.data.value : defaultForm)),
)

const uiSnapshot = ref<Record<string, any>>({})
const formValues = ref<Record<string, any>>({})
const gameId = ref<number | null>(null)
const formKey = ref(0)
const games = ref<Game[]>([])
const gameSearch = ref('')
const gamesLoading = ref(false)
const gamesError = ref<string | null>(null)
const gameSelectionError = ref<string | null>(null)
const formError = ref<string | null>(null)

watch(
  () => initialValue.value,
  (val) => {
    formValues.value = { ...(val || {}) }
    uiSnapshot.value = {
      registration_start_date: val?.registration_start_date,
      registration_deadline: val?.registration_deadline,
      check_in_start_at: val?.check_in_start_at,
      check_in_end_at: val?.check_in_end_at,
      start_date: val?.start_date,
      end_date: val?.end_date,
    }
    gameId.value = val?.game_id ?? null
  },
  { immediate: true },
)

const timelineError = ref('')

const dateLabels: Record<string, string> = {
  registration_start_date: '報名開始',
  registration_deadline: '報名截止',
  check_in_start_at: '檢錄開始',
  check_in_end_at: '檢錄截止',
  start_date: '賽事開始',
  end_date: '賽事結束',
}

const validateTimeline = (values: Record<string, any>) => {
  timelineError.value = ''
  const order = [
    'registration_start_date',
    'registration_deadline',
    'check_in_start_at',
    'check_in_end_at',
    'start_date',
    'end_date',
  ]
  const requiredBefore: Record<string, string> = {
    registration_deadline: 'registration_start_date',
    check_in_start_at: 'registration_deadline',
    check_in_end_at: 'check_in_start_at',
    start_date: 'check_in_end_at',
    end_date: 'start_date',
  }

  let prevDate: Date | null = null
  let prevKey: string | null = null

  for (const key of order) {
    const val = values[key]
    if (val && requiredBefore[key] && !values[requiredBefore[key]]) {
      timelineError.value = `請先填寫${dateLabels[requiredBefore[key]]}`
      return false
    }

    if (!val) continue

    const current = new Date(val)
    if (prevDate && current <= prevDate) {
      timelineError.value = `${dateLabels[prevKey as string]} 必須早於 ${dateLabels[key]}`
      return false
    }

    prevDate = current
    prevKey = key
  }

  return true
}

const mutation = useMutation({
  mutationFn: (values: any) => {
    if (!validateTimeline(values)) {
      return Promise.reject(new Error('時間順序不正確'))
    }
    const payload = {
      ...values,
      game_id: values.game_id ? Number(values.game_id) : undefined,
      max_teams: values.max_teams ? Number(values.max_teams) : undefined,
      min_teams: values.min_teams ? Number(values.min_teams) : 2,
      max_waitlist: values.max_waitlist === '' ? null : values.max_waitlist ? Number(values.max_waitlist) : null,
      default_best_of: values.default_best_of ? Number(values.default_best_of) : undefined,
      total_prize: values.total_prize === '' ? null : values.total_prize ? Number(values.total_prize) : 0,
      entry_fee: values.entry_fee === '' ? 0 : values.entry_fee ? Number(values.entry_fee) : 0,
    }
    return isEdit ? tournamentService.update(id as string, payload) : tournamentService.create(payload as any)
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    const targetId = (data as any)?.id || (data as any)?.data?.id || id
    router.push(`/tournaments/${targetId}`)
  },
  onError: () => {
    // timelineError 已在 validate 中設定；其他錯誤顯示在表單下方
  },
})
mutation.reset()

const showCheckIn = computed(
  () => !!uiSnapshot.value.registration_start_date && !!uiSnapshot.value.registration_deadline,
)
const showTournamentDates = computed(
  () => showCheckIn.value && !!uiSnapshot.value.check_in_start_at && !!uiSnapshot.value.check_in_end_at,
)
const minRegistrationStart = computed(() => formValues.value.registration_start_date || undefined)
const maxRegistrationStart = computed(() => formValues.value.registration_deadline || undefined)
const minRegistrationDeadline = computed(() => formValues.value.registration_start_date || undefined)
const minCheckInStart = computed(() => formValues.value.registration_deadline || undefined)
const minCheckInEnd = computed(() => formValues.value.check_in_start_at || undefined)
const minTournamentStart = computed(() => formValues.value.check_in_end_at || undefined)
const minTournamentEnd = computed(() => formValues.value.start_date || undefined)

const handleInput = (val: any) => {
  const data = { ...(val || {}) } as Record<string, any>

  // 依序校正時間，若晚於前一個則沿用前一個，強制單調遞增
  const chain = [
    'registration_start_date',
    'registration_deadline',
    'check_in_start_at',
    'check_in_end_at',
    'start_date',
    'end_date',
  ]
  let prev: string | undefined
  let corrected = false
  for (const key of chain) {
    const current = data[key]
    if (prev && current && current < prev) {
      data[key] = prev
      corrected = true
    } else if (current) {
      prev = current
    }
  }

  formValues.value = data
  uiSnapshot.value = {
    registration_start_date: data.registration_start_date,
    registration_deadline: data.registration_deadline,
    check_in_start_at: data.check_in_start_at,
    check_in_end_at: data.check_in_end_at,
    start_date: data.start_date,
    end_date: data.end_date,
  }
  if (data.game_id !== undefined) {
    gameId.value = data.game_id ? Number(data.game_id) : null
  }

  if (corrected) {
    formKey.value += 1
  }
}

const handleSubmit = (values: any) => {
  if (!gameId.value) {
    syncGameByName()
  }
  const merged = { ...values, game_id: gameId.value }
  const missing = computeMissingFields(merged)
  if (missing.length) {
    formError.value = `請填寫：${missing.join('、')}`
    return
  }
  values.game_id = gameId.value

  if (!validateTimeline(values)) {
    formError.value = timelineError.value
    return
  }
  formError.value = null
  mutation.mutate(values)
}

const filteredGames = computed(() => {
  const keyword = gameSearch.value.toLowerCase()
  return games.value.filter((g) => (keyword ? g.name.toLowerCase().includes(keyword) : true))
})

const setGame = (game: Game) => {
  gameId.value = game.id
  gameSearch.value = game.name
  formValues.value.game_id = game.id
  gameSelectionError.value = null
}

const syncGameByName = () => {
  const keyword = gameSearch.value.trim().toLowerCase()
  const match = games.value.find((g) => g.name.toLowerCase() === keyword)
  if (match) {
    setGame(match)
  } else {
    gameSelectionError.value = '請從建議清單選擇或輸入完整名稱'
    formValues.value.game_id = ''
    gameId.value = null
  }
}

const loadGames = async () => {
  gamesLoading.value = true
  gamesError.value = null
  try {
    games.value = await fetchGames()
    if (gameId.value && !games.value.find((g) => g.id === gameId.value)) {
      gameId.value = null
    }
  } catch (err: any) {
    gamesError.value = err?.message || '遊戲清單載入失敗'
  } finally {
    gamesLoading.value = false
  }
}

onMounted(() => {
  loadGames()
  mutation.reset()
})

const handleInvalid = () => {
  const missing = computeMissingFields({ ...formValues.value, game_id: gameId.value })
  formError.value = missing.length ? `請填寫：${missing.join('、')}` : null
}

function computeMissingFields(values: Record<string, any>): string[] {
  const missing: string[] = []
  const requiredMap: Record<string, string> = {
    name: '名稱',
    type: '賽事類型',
    game_id: '遊戲',
    max_teams: '隊伍上限',
    registration_start_date: '報名開始',
    registration_deadline: '報名截止',
  }

  if (!gameId.value) {
    missing.push('遊戲')
  }

  for (const [key, label] of Object.entries(requiredMap)) {
    const val = key === 'game_id' ? gameId.value : values[key]
    if (val === undefined || val === null || val === '') {
      missing.push(label)
    }
  }

  return Array.from(new Set(missing))
}

watch(
  () => router.currentRoute.value.fullPath,
  () => mutation.reset(),
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <PageHeader
      :title="isEdit ? '編輯賽事' : '建立賽事'"
      subtitle="填寫賽事基礎資訊、報名/檢錄時間與隊伍上限。"
      eyebrow="Tournaments"
    >
      <template #actions>
        <div class="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          Draft → Registration → Live
        </div>
      </template>
    </PageHeader>

    <SectionCard
      :title="isEdit ? '更新賽事' : '建立賽事'"
      description="依是否存在 id 決定 POST 或 PUT api/tournaments。"
    >
      <LoadingState v-if="isEdit && tournamentQuery.isLoading.value" message="載入賽事資料..." />
      <FormKit
        v-else
        type="form"
        :key="formKey"
        :value="formValues"
        :actions="false"
        @input="handleInput"
        @submit="handleSubmit"
        @submit-invalid="handleInvalid"
      >
        <div class="grid gap-6">
          <div class="grid gap-4">
            <FormKit type="text" name="name" label="名稱" validation="required|length:3,80" validation-visibility="blur" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FormKit type="textarea" name="description" label="簡介" />
            <FormKit type="textarea" name="rules" label="規則" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FormKit
              type="select"
              name="type"
              label="賽事類型"
              :options="[
                { label: '單淘汰', value: 'single_elimination' },
                { label: '雙淘汰', value: 'double_elimination' },
                { label: '天梯 / 挑戰', value: 'gauntlet' },
                { label: '循環賽', value: 'round_robin' },
                { label: '分組賽', value: 'group_stage' },
                { label: '排位賽', value: 'placement' },
              ]"
              validation="required"
              validation-visibility="blur"
            />
            <div class="space-y-1 rounded-lg border border-slate-200 bg-white/70 p-3">
              <label class="text-sm font-semibold text-slate-900">遊戲</label>
              <div class="relative">
                <input
                  v-model="gameSearch"
                  type="text"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 pl-8 text-sm text-slate-800 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="輸入或選擇遊戲名稱"
                  @blur="syncGameByName"
                />
                <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <div
                  v-if="gameSearch && filteredGames.length"
                  class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
                >
                  <button
                    v-for="game in filteredGames"
                    :key="game.id"
                    type="button"
                    class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    @mousedown.prevent="setGame(game)"
                  >
                    <span class="font-semibold text-slate-900">{{ game.name }}</span>
                    <span class="text-xs text-slate-500">#{{ game.id }}</span>
                  </button>
                </div>
              </div>
              <p class="text-xs text-slate-500">可輸入名稱或從建議選單點選，會自動帶入遊戲 ID。</p>
              <p v-if="gamesLoading" class="mt-1 text-xs text-slate-500">載入遊戲清單中...</p>
              <p v-else-if="gamesError" class="mt-1 text-xs text-red-600">{{ gamesError }}</p>
              <p v-else-if="!filteredGames.length" class="mt-1 text-xs text-slate-500">無符合遊戲，請更改搜尋。</p>
              <p v-else-if="gameSelectionError" class="mt-1 text-xs text-red-600">{{ gameSelectionError }}</p>
              <FormKit type="hidden" name="game_id" :value="gameId !== null ? String(gameId) : ''" />
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <FormKit
              type="number"
              name="max_teams"
              label="隊伍上限"
              min="2"
              validation="required|number"
              validation-visibility="blur"
            />
            <FormKit type="number" name="min_teams" label="隊伍下限" min="2" value="2" />
            <FormKit type="number" name="max_waitlist" label="候補上限 (可留空)" min="0" />
            <FormKit
              type="select"
              name="default_best_of"
              label="預設 BoX"
              :options="[
                { label: 'Bo1', value: 1 },
                { label: 'Bo3', value: 3 },
                { label: 'Bo5', value: 5 },
                { label: 'Bo7', value: 7 },
              ]"
            />
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <FormKit
              type="datetime-local"
              name="registration_start_date"
              label="報名開始"
              :disabled="!!uiSnapshot.registration_deadline && !!uiSnapshot.registration_start_date"
              :max="maxRegistrationStart"
              validation="required"
              validation-visibility="blur"
            />
            <FormKit
              type="datetime-local"
              name="registration_deadline"
              label="報名截止"
              :disabled="!uiSnapshot.registration_start_date"
              :min="minRegistrationDeadline"
              validation="required"
              validation-visibility="blur"
            />
          </div>
          <p v-if="!showCheckIn" class="text-xs text-slate-500">填完報名時間後會開啟檢錄時間設定。</p>

          <div v-if="showCheckIn" class="grid gap-3 md:grid-cols-2">
            <FormKit
              type="datetime-local"
              name="check_in_start_at"
              label="檢錄開始"
              :disabled="!uiSnapshot.registration_deadline"
              :min="minCheckInStart"
            />
            <FormKit
              type="datetime-local"
              name="check_in_end_at"
              label="檢錄截止"
              :disabled="!uiSnapshot.check_in_start_at"
              :min="minCheckInEnd"
            />
          </div>
          <p v-if="showCheckIn && !showTournamentDates" class="text-xs text-slate-500">填完檢錄時間後會開啟賽事時間設定。</p>

          <div v-if="showTournamentDates" class="grid gap-3 md:grid-cols-2">
            <FormKit
              type="datetime-local"
              name="start_date"
              label="賽事開始"
              :disabled="!uiSnapshot.check_in_end_at"
              :min="minTournamentStart"
            />
            <FormKit
              type="datetime-local"
              name="end_date"
              label="賽事結束"
              :disabled="!uiSnapshot.start_date"
              :min="minTournamentEnd"
            />
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <FormKit type="number" name="total_prize" label="獎金 / 獎品價值" min="0" step="0.01" />
            <FormKit type="number" name="entry_fee" label="報名費" min="0" step="0.01" />
          </div>

          <FormKit type="checkbox" name="is_public" label="公開賽事（預設關閉）" />

          <p v-if="timelineError" class="text-sm text-red-600">{{ timelineError }}</p>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

          <button
            type="submit"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-[1px] hover:bg-slate-800 disabled:opacity-60"
            :disabled="mutation.status.value === 'pending'"
          >
            {{ mutation.status.value === 'pending' ? '送出中...' : isEdit ? '更新賽事' : '建立賽事' }}
          </button>
          <p v-if="mutation.status.value === 'error'" class="text-sm text-red-600">送出失敗，請檢查欄位。</p>
          <p v-else-if="mutation.status.value === 'success'" class="text-sm text-emerald-600">已送出，將跳轉至賽事頁。</p>
        </div>
      </FormKit>
    </SectionCard>
  </section>
</template>
