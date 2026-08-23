<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as PDFPageCommentService from '../utilities/PDFPageCommentService'
import { formatWithTime } from '../utilities/JalaliDate'

// "my comments" (route name 'mycomments') vs a specific user's comments
// (route name 'usercomments', :id in the route) - both point at this
// same component, matching the Flutter client's own UserCommentsView.
// Computed (not a plain const read once at setup) because Vue Router
// reuses this same component instance rather than remounting it when
// navigating between two different /usercomments/:id URLs (same route
// name, just a different param) - a setup-time-only read would go
// stale in that case, since onMounted wouldn't fire again.
const route = useRoute()
const isOwnComments = computed(() => route.name === 'mycomments')
const targetUserId = computed(() => (isOwnComments.value ? null : route.params.id))
const targetUserName = computed(() => (isOwnComments.value ? null : route.query.name))

const userInfo = ref(null)
const loading = ref(true)
const comments = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const savingCommentId = ref(null)

async function loadComments() {
  loading.value = true
  const res = isOwnComments.value
    ? await PDFPageCommentService.getMyComments(userInfo.value, pageNumber.value)
    : await PDFPageCommentService.getCommentsByUser(
        userInfo.value,
        targetUserId.value,
        pageNumber.value
      )
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

async function editComment(comment) {
  const newText = prompt('ویرایش دیدگاه', comment.text)
  if (newText == null || newText.trim() === '' || newText === comment.text) return
  savingCommentId.value = comment.id
  try {
    await PDFPageCommentService.editComment(userInfo.value, comment.id, newText.trim())
    await loadComments()
  } catch (e) {
    alert(e.message)
  }
  savingCommentId.value = null
}

async function removeComment(comment) {
  if (!confirm('این دیدگاه حذف شود؟')) return
  savingCommentId.value = comment.id
  try {
    await PDFPageCommentService.deleteComment(userInfo.value, comment.id)
    await loadComments()
  } catch (e) {
    alert(e.message)
  }
  savingCommentId.value = null
}

watch(pageNumber, () => loadComments())

// handles navigating directly between two different /usercomments/:id
// URLs, where Vue Router reuses this component instance rather than
// remounting it - onMounted alone wouldn't fire again for that
watch(targetUserId, () => {
  pageNumber.value = 1
  loadComments()
})

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  document.title = isOwnComments.value ? 'نسکبان - دیدگاه‌های من' : 'نسکبان - دیدگاه‌های کاربر'
  if (isOwnComments.value && userInfo.value == null) {
    loading.value = false
    return
  }
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
    <h3 class="q-my-none">
      {{ isOwnComments ? 'دیدگاه‌های من' : `دیدگاه‌های ${targetUserName || 'کاربر'}` }}
    </h3>
  </div>

  <div v-if="isOwnComments && !loading && userInfo == null" class="text-center q-pa-lg">
    برای مشاهدهٔ دیدگاه‌های خود باید وارد حساب کاربری‌تان شوید.
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div v-if="!loading && (!isOwnComments || userInfo != null)" class="q-mx-auto" style="max-width: 700px">
    <div v-if="comments.length === 0" class="text-center text-grey-7 q-pa-lg">
      هنوز دیدگاهی ثبت نشده است.
    </div>
    <q-card v-for="comment in comments" :key="comment.id" flat bordered class="q-ma-sm">
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="text-bold">{{ comment.userName }}</div>
          <q-space />
          <div class="text-caption text-grey-7">
            {{ formatWithTime(comment.createdAt) }}<span v-if="comment.editedAt"> (ویرایش‌شده)</span>
          </div>
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
        <template v-if="comment.myComment">
          <q-btn
            flat
            dense
            label="ویرایش"
            :loading="savingCommentId === comment.id"
            @click="editComment(comment)"
          />
          <q-btn
            flat
            dense
            color="red"
            label="حذف"
            :loading="savingCommentId === comment.id"
            @click="removeComment(comment)"
          />
        </template>
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
