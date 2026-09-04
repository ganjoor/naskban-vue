<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as PDFBookReviewService from '../utilities/PDFBookReviewService'
import { formatWithTime } from '../utilities/JalaliDate'

// "my reviews" (route name 'myreviews') vs a specific user's reviews
// (route name 'userreviews', :id in the route) - both point at this
// same component, matching UserCommentsView.vue's own reasoning
// (computed, not a plain const, since Vue Router reuses this same
// component instance rather than remounting it when navigating
// between two different /userreviews/:id URLs).
const route = useRoute()
const isOwnReviews = computed(() => route.name === 'myreviews')
const targetUserId = computed(() => (isOwnReviews.value ? null : route.params.id))
const targetUserName = computed(() => (isOwnReviews.value ? null : route.query.name))

const userInfo = ref(null)
const loading = ref(true)
const reviews = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const votingReviewId = ref(null)
const savingReviewId = ref(null)

const writeDialogOpen = ref(false)
const editingReview = ref(null)
const draftRating = ref(0)
const draftText = ref('')
const writeSubmitting = ref(false)
const writeError = ref('')

async function loadReviews() {
  loading.value = true
  const res = isOwnReviews.value
    ? await PDFBookReviewService.getMyReviews(userInfo.value, pageNumber.value)
    : await PDFBookReviewService.getReviewsByUser(userInfo.value, targetUserId.value, pageNumber.value)
  if (res) {
    reviews.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function openBook(review) {
  window.location.href = `/${review.pdfBookId}`
}

function openWriteDialog(review) {
  editingReview.value = review
  draftRating.value = review.rating || 0
  draftText.value = review.text
  writeError.value = ''
  writeDialogOpen.value = true
}

async function submitWrite() {
  if (draftText.value.trim() === '') {
    writeError.value = 'متن نقد را وارد کنید.'
    return
  }
  writeSubmitting.value = true
  writeError.value = ''
  try {
    const rating = draftRating.value > 0 ? draftRating.value : null
    await PDFBookReviewService.editReview(userInfo.value, editingReview.value.id, draftText.value.trim(), rating)
    writeDialogOpen.value = false
    await loadReviews()
  } catch (e) {
    writeError.value = e.message
  }
  writeSubmitting.value = false
}

async function removeReview(review) {
  if (!confirm('این نقد حذف شود؟')) return
  savingReviewId.value = review.id
  try {
    await PDFBookReviewService.deleteReview(userInfo.value, review.id)
    await loadReviews()
  } catch (e) {
    alert(e.message)
  }
  savingReviewId.value = null
}

// same reasoning as PDFBookReviewsView.vue's own vote() - see that
// file's own comment
async function vote(review, isLike) {
  if (votingReviewId.value) return
  votingReviewId.value = review.id
  try {
    if (review.myVote === isLike) {
      await PDFBookReviewService.removeVote(userInfo.value, review.id)
      if (isLike) review.likeCount--
      else review.dislikeCount--
      review.myVote = null
    } else {
      await PDFBookReviewService.castVote(userInfo.value, review.id, isLike)
      if (review.myVote === true) review.likeCount--
      if (review.myVote === false) review.dislikeCount--
      if (isLike) review.likeCount++
      else review.dislikeCount++
      review.myVote = isLike
    }
  } catch (e) {
    alert(e.message)
  }
  votingReviewId.value = null
}

watch(pageNumber, () => loadReviews())

// handles navigating directly between two different /userreviews/:id
// URLs, where Vue Router reuses this component instance rather than
// remounting it - onMounted alone wouldn't fire again for that
watch(targetUserId, () => {
  pageNumber.value = 1
  loadReviews()
})

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  document.title = isOwnReviews.value ? 'نسکبان - نقدهای من' : 'نسکبان - نقدهای کاربر'
  if (isOwnReviews.value && userInfo.value == null) {
    loading.value = false
    return
  }
  loadReviews()
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
      {{ isOwnReviews ? 'نقدهای من' : `نقدهای ${targetUserName || 'کاربر'}` }}
    </h3>
  </div>

  <div v-if="isOwnReviews && !loading && userInfo == null" class="text-center q-pa-lg">
    برای مشاهدهٔ نقدهای خود باید وارد حساب کاربری‌تان شوید.
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div v-if="!loading && (!isOwnReviews || userInfo != null)" class="q-mx-auto" style="max-width: 700px">
    <div v-if="reviews.length === 0" class="text-center text-grey-7 q-pa-lg">
      هنوز نقدی ثبت نشده است.
    </div>
    <q-card v-for="review in reviews" :key="review.id" flat bordered class="q-ma-sm">
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="text-bold">{{ review.userName }}</div>
          <q-space />
          <div class="text-caption text-grey-7">
            {{ formatWithTime(review.createdAt) }}<span v-if="review.editedAt"> (ویرایش‌شده)</span>
          </div>
        </div>
        <div v-if="review.bookTitle" class="text-caption text-grey-7" style="font-style: italic">
          {{ review.bookTitle }}
        </div>
        <q-rating
          v-if="review.rating != null"
          :model-value="review.rating"
          max="5"
          readonly
          color="amber"
          size="18px"
        />
      </q-card-section>
      <q-card-section class="q-pt-sm">{{ review.text }}</q-card-section>
      <q-card-actions>
        <q-btn
          flat
          dense
          round
          :icon="review.myVote === true ? 'thumb_up' : 'thumb_up_off_alt'"
          :color="review.myVote === true ? 'primary' : ''"
          :disable="review.myReview || votingReviewId === review.id"
          @click="vote(review, true)"
        />
        <span class="q-mx-xs">{{ review.likeCount - review.dislikeCount }}</span>
        <q-btn
          flat
          dense
          round
          :icon="review.myVote === false ? 'thumb_down' : 'thumb_down_off_alt'"
          :color="review.myVote === false ? 'primary' : ''"
          :disable="review.myReview || votingReviewId === review.id"
          @click="vote(review, false)"
        />
        <q-btn flat dense icon="menu_book" label="باز کردن کتاب" @click="openBook(review)" />
        <template v-if="review.myReview">
          <q-btn
            flat
            dense
            label="ویرایش"
            :loading="savingReviewId === review.id"
            @click="openWriteDialog(review)"
          />
          <q-btn
            flat
            dense
            color="red"
            label="حذف"
            :loading="savingReviewId === review.id"
            @click="removeReview(review)"
          />
        </template>
      </q-card-actions>
    </q-card>
  </div>

  <div class="q-pa-lg flex flex-center items-center" v-if="!loading && pageCount > 1">
    <q-btn dense flat round icon="skip_next" :disable="pageNumber <= 1" @click="pageNumber = 1">
      <q-tooltip>اولین صفحه</q-tooltip>
    </q-btn>
    <q-btn dense flat round icon="fast_forward" :disable="pageNumber <= 1" @click="pageNumber--">
      <q-tooltip>صفحهٔ قبل</q-tooltip>
    </q-btn>
    <div class="q-px-md">{{ pageNumber }} / {{ pageCount }}</div>
    <q-btn dense flat round icon="fast_rewind" :disable="pageNumber >= pageCount" @click="pageNumber++">
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

  <q-dialog v-model="writeDialogOpen">
    <q-card style="min-width: 320px">
      <q-card-section class="text-h6">ویرایش نقد</q-card-section>
      <q-card-section>
        <div class="text-caption q-mb-xs">امتیاز (اختیاری)</div>
        <q-rating v-model="draftRating" max="5" size="2em" color="amber" icon="star_border" icon-selected="star" />
        <q-input v-model="draftText" label="متن نقد" type="textarea" class="q-mt-md" />
        <div v-if="writeError" class="text-red q-mt-sm">{{ writeError }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="انصراف" :disable="writeSubmitting" @click="writeDialogOpen = false" />
        <q-btn label="ذخیره" color="primary" :loading="writeSubmitting" @click="submitWrite" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
