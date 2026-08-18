<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  excludeAuthorId: { type: [Number, String], default: null },
  title: { type: String, default: 'انتخاب پدیدآورنده' }
})
const emit = defineEmits(['update:modelValue', 'picked'])

const searchTerm = ref('')
const loading = ref(false)
const results = ref([])
let debounceHandle = null

function onInput() {
  clearTimeout(debounceHandle)
  debounceHandle = setTimeout(search, 350)
}

async function search() {
  const term = searchTerm.value.trim()
  if (!term) {
    results.value = []
    return
  }
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/authors?PageNumber=1&PageSize=20&authorName=${encodeURIComponent(term)}`,
    { headers: { 'content-type': 'application/json' } }
  )
  loading.value = false
  if (!res.ok) {
    results.value = []
    return
  }
  const authors = await res.json()
  results.value = authors.filter((a) => String(a.id) !== String(props.excludeAuthorId))
}

function pick(author) {
  emit('picked', author)
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      searchTerm.value = ''
      results.value = []
    }
  }
)
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="searchTerm"
          autofocus
          label="جست‌وجوی نام پدیدآورنده"
          @update:model-value="onInput"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>
      <q-card-section style="max-height: 320px; overflow-y: auto">
        <div v-if="loading" class="flex flex-center q-pa-md">
          <q-spinner-hourglass color="green" size="2em" />
        </div>
        <div v-else-if="results.length === 0" class="text-center text-grey q-pa-md">
          {{ searchTerm.trim() === '' ? 'نام پدیدآورنده را جست‌وجو کنید' : 'پدیدآورنده‌ای یافت نشد.' }}
        </div>
        <q-list v-else>
          <q-item v-for="author in results" :key="author.id" clickable @click="pick(author)">
            <q-item-section avatar>
              <q-icon name="person_outline" />
            </q-item-section>
            <q-item-section>
              {{ author.name }}
              <q-item-label caption>{{ author.bookCount }} کتاب</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="انصراف" @click="emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
