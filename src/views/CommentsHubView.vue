<script setup>
import { ref, onMounted, watch } from 'vue'
import * as PDFPageCommentService from '../utilities/PDFPageCommentService'
import { formatWithTime } from '../utilities/JalaliDate'

const loading = ref(true)
const comments = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)

async function loadComments() {
  loading.value = true
  const res = await PDFPageCommentService.getRecentComments(pageNumber.value)
  if (res) {
    comments.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function viewHighlightImage(comment) {
  window.open(`https://api.naskban.ir/${comment.imageUrl}`, '_blank')
}

function openBookAtPage(comment) {
  window.location.href = `/${comment.pdfBookId}/${comment.pageNumber}`
}

watch(pageNumber, () => loadComments())

onMounted(() => {
  document.title = 'نسکبان - دیدگاه‌های کاربران'
  loadComments()
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

  <div class="row justify-center items-center q-pa-sm">
    <h3 class="q-my-none">دیدگاه‌های کاربران</h3>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div v-if="!loading" class="q-mx-auto" style="max-width: 700px">
    <div v-if="comments.length === 0" class="text-center text-grey-7 q-pa-lg">
      هنوز دیدگاهی ثبت نشده است.
    </div>
    <q-card v-for="comment in comments" :key="comment.id" flat bordered class="q-ma-sm">
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="text-bold">{{ comment.userName }}</div>
          <q-space />
          <div class="text-caption text-grey-7">{{ formatWithTime(comment.createdAt) }}</div>
        </div>
        <div v-if="comment.bookTitle" class="text-caption text-grey-7" style="font-style: italic">
          {{ comment.bookTitle }}
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
