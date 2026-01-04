<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { tournamentService } from '@/services/tournaments'

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

const mutation = useMutation({
  mutationFn: (values: any) => (isEdit ? tournamentService.update(id as string, values) : tournamentService.create(values)),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    const targetId = data?.id || id
    router.push(`/tournaments/${targetId}`)
  },
})
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6 px-6 py-10">
    <PageHeader
      :title="isEdit ? '編輯賽事' : '建立賽事'"
      subtitle="設定名稱、報名時間、BoX 賽制、隊伍上限並提交。"
      eyebrow="Tournaments"
    />

    <SectionCard
      :title="isEdit ? '更新賽事' : '建立賽事'"
      description="依是否存在 id 決定 POST 或 PUT api/tournaments。"
    >
      <LoadingState v-if="tournamentQuery.isLoading" message="載入賽事資料..." />
      <FormKit
        v-else
        type="form"
        :value="tournamentQuery.data || {}"
        :actions="false"
        @submit="mutation.mutate"
      >
        <div class="grid gap-6">
          <div class="grid gap-4 md:grid-cols-2">
            <FormKit type="text" name="name" label="名稱" validation="required|length:3,80" />
            <FormKit
              type="select"
              name="status"
              label="狀態"
              :options="[
                { label: '草稿', value: 'draft' },
                { label: '開放報名', value: 'open' },
                { label: '進行中', value: 'ongoing' },
                { label: '已結束', value: 'closed' },
              ]"
              validation="required"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FormKit type="textarea" name="description" label="簡介" />
            <FormKit type="textarea" name="rules" label="規則" />
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <FormKit type="date" name="registration_start" label="報名開始" validation="required" />
            <FormKit type="date" name="registration_end" label="報名截止" validation="required" />
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <FormKit type="text" name="box_format" label="BoX 賽制" placeholder="Bo3 / Bo5" validation="required" />
            <FormKit type="number" name="team_limit" label="隊伍上限" min="2" />
            <FormKit type="text" name="prize" label="獎金/獎品" placeholder="可選填" />
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <FormKit type="text" name="cover_url" label="封面圖片 URL" />
            <FormKit type="text" name="location" label="比賽地點 / 線上平台" />
          </div>

          <div class="rounded-lg border border-dashed border-slate-200 p-4">
            <p class="mb-2 text-sm font-semibold text-slate-800">報名設定</p>
            <div class="grid gap-3 md:grid-cols-2">
              <FormKit type="checkbox" name="allow_waitlist" label="允許候補" />
              <FormKit type="checkbox" name="auto_approve" label="自動審核通過" />
            </div>
          </div>

          <button
            type="submit"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="mutation.isPending"
          >
            {{ mutation.isPending ? '送出中...' : isEdit ? '更新賽事' : '建立賽事' }}
          </button>
          <p v-if="mutation.error" class="text-sm text-red-600">送出失敗，請檢查欄位。</p>
        </div>
      </FormKit>
    </SectionCard>
  </section>
</template>
