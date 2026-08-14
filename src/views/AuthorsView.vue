<script setup>
import { ref, onMounted, watch } from 'vue'
import { bus } from '../event-bus'
import * as PinnedAuthorService from '../utilities/PinnedAuthorService'

const loading = ref(false)
const userInfo = ref(null)
const authors = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const searchTerm = ref('')
const sortByBookCount = ref(true)
const pinnedAuthors = ref([])

bus.on('user-logged-in', (u) => {
  userInfo.value = u
  loadPinned()
})
bus.on('user-logged-out', () => {
  userInfo.value = null
  pinnedAuthors.value = []
})

async function loadPinned() {
  if (userInfo.value == null) {
    pinnedAuthors.value = []
    return
  }
  pinnedAuthors.value = await PinnedAuthorService.getAllPinnedAuthors(userInfo.value)
}

function isPinnedId(authorId) {
  return pinnedAuthors.value.some((a) => String(a.authorId) === String(authorId))
}

async function togglePin(authorId) {
  if (userInfo.value == null) return
  if (isPinnedId(authorId)) {
    await PinnedAuthorService.unpinAuthor(userInfo.value, authorId)
  } else {
    await PinnedAuthorService.pinAuthor(userInfo.value, authorId)
  }
  await loadPinned()
}

async function loadAuthors() {
  loading.value = true
  const nameQuery = searchTerm.value ? `&authorName=${encodeURIComponent(searchTerm.value)}` : ''
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/authors?PageNumber=${pageNumber.value}&PageSize=20&sortByBookCount=${sortByBookCount.value}${nameQuery}`,
    { headers: { 'content-type': 'application/json' } }
  )
  if (res.ok) {
    authors.value = await res.json()
    for (const pair of res.headers.entries()) {
      if (pair[0] == 'paging-headers') {
        pageCount.value = JSON.parse(pair[1]).totalPages
      }
    }
  }
  loading.value = false
}

function toggleSort() {
  sortByBookCount.value = !sortByBookCount.value
  pageNumber.value = 1
  loadAuthors()
}

function search() {
  pageNumber.value = 1
  loadAuthors()
}

function openAuthor(authorId) {
  window.location.href = '/authors/' + authorId
}

watch(pageNumber, () => loadAuthors())

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  document.title = 'نسکبان - نویسندگان'
  loadAuthors()
  loadPinned()
})

function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/')">
        <q-tooltip class="bg-green text-white">بازگشت به خانه</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <h3>نویسندگان</h3>

  <div class="row justify-center q-pa-sm">
    <q-input
      v-model="searchTerm"
      label="جستجوی نام نویسنده"
      style="width: 300px"
      @keydown.enter.prevent="search"
    >
      <template v-slot:append>
        <q-icon name="search" class="cursor-pointer" @click="search" />
      </template>
    </q-input>
    <q-btn
      dense
      flat
      :icon="sortByBookCount ? 'sort' : 'sort_by_alpha'"
      class="green q-ml-sm"
      @click="toggleSort"
    >
      <q-tooltip class="bg-green text-white">
        {{ sortByBookCount ? 'مرتب‌سازی بر اساس تعداد کتاب' : 'مرتب‌سازی بر اساس نام' }}
      </q-tooltip>
    </q-btn>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <q-list v-if="!loading" bordered class="rounded-borders q-mx-auto" style="max-width: 500px">
    <template v-for="pinned in pinnedAuthors" :key="'pinned-' + pinned.authorId">
      <q-item clickable @click="openAuthor(pinned.authorId)">
        <q-item-section avatar>
          <q-icon name="person_outline" />
        </q-item-section>
        <q-item-section>{{ pinned.authorName }}</q-item-section>
        <q-item-section side>
          <q-btn
            dense
            flat
            size="sm"
            icon="push_pin"
            @click.stop="togglePin(pinned.authorId)"
          >
            <q-tooltip class="bg-green text-white">حذف پین</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-separator />
    </template>
    <q-separator v-if="pinnedAuthors.length > 0" size="2px" />

    <template v-for="(author, index) in authors" :key="author.id">
      <q-item clickable @click="openAuthor(author.id)">
        <q-item-section avatar>
          <q-icon name="person_outline" />
        </q-item-section>
        <q-item-section>{{ author.name }}</q-item-section>
        <q-item-section side>
          <span class="text-caption text-grey">{{ author.bookCount }} کتاب</span>
        </q-item-section>
        <q-item-section side v-if="userInfo != null">
          <q-btn
            dense
            flat
            size="sm"
            icon="push_pin"
            :color="isPinnedId(author.id) ? 'green' : 'grey-5'"
            @click.stop="togglePin(author.id)"
          >
            <q-tooltip class="bg-green text-white">
              {{ isPinnedId(author.id) ? 'حذف پین' : 'پین کردن' }}
            </q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-separator v-if="index < authors.length - 1" />
    </template>
    <div v-if="authors.length === 0 && pinnedAuthors.length === 0" class="text-center q-pa-lg">
      نویسنده‌ای یافت نشد.
    </div>
  </q-list>

  <div class="q-pa-lg flex flex-center">
    <q-pagination
      v-model="pageNumber"
      v-if="!loading && pageCount > 1"
      :max="pageCount"
      :max-pages="7"
      direction-links
      boundary-links
      color="green"
      icon-last="skip_previous"
      icon-first="skip_next"
      icon-next="fast_rewind"
      icon-prev="fast_forward"
    />
  </div>
</template>
