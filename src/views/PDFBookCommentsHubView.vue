<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as PDFPageCommentService from '../utilities/PDFPageCommentService'
import { formatWithTime } from '../utilities/JalaliDate'

const route = useRoute()
const bookId = route.params.id

const loading = ref(true)
const bookTitle = ref('')
const comments = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)

async function loadBookTitle() {
  try {
    const res = await fetch(`https://api.naskban.ir/api/pdf/${bookId}`, {
      headers: { 'content-type': 'application/json' }
    })
    if (res.ok) {
      const book = await res.json()
      bookTitle.value = book.title
    }
  } catch {
    // title is just for the header - a plain "دیدگاه‌های این کتاب" fallback
    // (see the template) is fine if this fails, not worth its own error UI
  }
}

async function loadComments() {
  loading.value = true
  const res = await PDFPageCommentService.getBookComments(bookId, pageNumber.value)
  if (res) {
    comments.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function viewHighlightImage(comment) {
  window.open(`https://api.naskban.ir/${comment.imageUrl}`, '_blank')
}

function openUserComments(comment) {
  window.location.href = `/usercomments/${comment.userId}?name=${encodeURIComponent(comment.userName)}`
}

function openBookAtPage(comment) {
  window.location.href = `/${bookId}/${comment.pageNumber}`
}

watch(pageNumber, () => loadComments())

onMounted(() => {
  document.title = 'نسکبان - دیدگاه‌های کتاب'
  loadBookTitle()
  loadComments()
})

function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo(`/${bookId}`)">
        <q-tooltip class="bg-green text-white">بازگشت به کتاب</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <div class="row justify-center items-center q-pa-sm">
    <h3 class="q-my-none">دیدگاه‌های {{ bookTitle || 'این کتاب' }}</h3>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div v-if="!loading" class="q-mx-auto" style="max-width: 700px">
    <div v-if="comments.length === 0" class="text-center text-grey-7 q-pa-lg">
      هنوز دیدگاهی برای این کتاب ثبت نشده است.
    </div>
    <q-card v-for="comment in comments" :key="comment.id" flat bordered class="q-ma-sm">
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="text-bold" style="cursor: pointer" @click="openUserComments(comment)">
            {{ comment.userName }}
          </div>
          <q-space />
          <div class="text-caption text-grey-7">{{ formatWithTime(comment.createdAt) }}</div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-sm">
        {{ comment.text }}
        <div v-if="comment.imageUrl" class="q-mt-sm" style="position: relative; display: inline-block">
          <img
            :src="`https://api.naskban.ir/${comment.imageUrl}`"
            style="max-height: 100px; border-radius: 4px; cursor: pointer"
            @click="viewHighlightImage(comment)"
          />
          <q-icon
            name="zoom_in"
            color="white"
            size="18px"
            style="position: absolute; left: 4px; bottom: 4px; cursor: pointer"
            @click="viewHighlightImage(comment)"
          />
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn flat dense icon="menu_book" :label="`صفحهٔ ${comment.pageNumber}`" @click="openBookAtPage(comment)" />
      </q-card-actions>
    </q-card>
  </div>

  <div class="q-pa-lg flex flex-center items-center" v-if="!loading && pageCount > 1">
    <q-btn
      dense
      flat
      round
      icon="skip_next"
      :disable="pageNumber <= 1"
      @click="pageNumber = 1"
    >
      <q-tooltip>اولین صفحه</q-tooltip>
    </q-btn>
    <q-btn
      dense
      flat
      round
      icon="fast_forward"
      :disable="pageNumber <= 1"
      @click="pageNumber--"
    >
      <q-tooltip>صفحهٔ قبل</q-tooltip>
    </q-btn>
    <div class="q-px-md">{{ pageNumber }} / {{ pageCount }}</div>
    <q-btn
      dense
      flat
      round
      icon="fast_rewind"
      :disable="pageNumber >= pageCount"
      @click="pageNumber++"
    >
      <q-tooltip>صفحهٔ بعد</q-tooltip>
    </q-btn>
    <q-btn
      dense
      flat
      round
      icon="skip_previous"
      :disable="pageNumber >= pageCount"
      @click="pageNumber = pageCount"
    >
      <q-tooltip>آخرین صفحه</q-tooltip>
    </q-btn>
  </div>
</template>
