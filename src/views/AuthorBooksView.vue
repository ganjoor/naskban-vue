<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as PinnedAuthorService from '../utilities/PinnedAuthorService'

const route = useRoute()
const loading = ref(true)
const userInfo = ref(null)
const authorName = ref('')
const pdfs = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const pinned = ref(false)

async function loadBooks() {
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/pdfbook/by/contributer/${route.params.id}?PageNumber=${pageNumber.value}&PageSize=20`,
    { headers: { 'content-type': 'application/json' } }
  )
  if (res.ok) {
    pdfs.value = await res.json()
    for (const pair of res.headers.entries()) {
      if (pair[0] == 'paging-headers') {
        pageCount.value = JSON.parse(pair[1]).totalPages
      }
    }
  }
  loading.value = false
}

async function loadAuthorName() {
  const res = await fetch(`https://api.naskban.ir/api/pdf/author/${route.params.id}`, {
    headers: { 'content-type': 'application/json' }
  })
  if (res.ok) {
    const author = await res.json()
    authorName.value = author.name
    document.title = 'نسکبان - ' + author.name
  }
}

async function loadPinned() {
  if (userInfo.value == null) return
  pinned.value = await PinnedAuthorService.isPinned(userInfo.value, route.params.id)
}

async function togglePin() {
  if (userInfo.value == null) return
  if (pinned.value) {
    await PinnedAuthorService.unpinAuthor(userInfo.value, route.params.id)
  } else {
    await PinnedAuthorService.pinAuthor(userInfo.value, route.params.id)
  }
  pinned.value = !pinned.value
}

watch(pageNumber, () => loadBooks())

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  loadAuthorName()
  loadBooks()
  loadPinned()
})

function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="bg-white text-white flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/authors')">
        <q-tooltip class="bg-green text-white">بازگشت به نویسندگان</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced v-if="userInfo != null" />
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        :icon="pinned ? 'push_pin' : 'push_pin_outlined'"
        class="green"
        @click="togglePin"
      >
        <q-tooltip class="bg-green text-white">
          {{ pinned ? 'حذف پین این نویسنده' : 'پین کردن این نویسنده' }}
        </q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <h3 v-if="authorName">{{ authorName }}</h3>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div class="row justify-center" v-if="!loading">
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
      <q-card class="cursor-pointer fit">
        <a :href="'/' + pdf.id">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
        </a>
        <q-card-section class="text-h6 book-info">
          <a :href="'/' + pdf.id" class="book-title">{{ pdf.title }} </a>
        </q-card-section>
      </q-card>
    </div>
    <div v-if="pdfs.length === 0" class="text-center full-width q-pa-lg">
      کتابی از این نویسنده یافت نشد.
    </div>
  </div>

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

<style>
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
