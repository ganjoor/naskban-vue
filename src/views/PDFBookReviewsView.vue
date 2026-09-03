<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as PDFBookReviewService from '../utilities/PDFBookReviewService'
import { formatWithTime } from '../utilities/JalaliDate'

// One specific book's own reviews - rating summary, sortable list,
// write/edit (a proper q-dialog with a q-rating input, not a plain
// prompt() like UserCommentsView's editComment - a review needs a
// star rating alongside its text, which a single-field native prompt
// can't express), and vote buttons. Mirrors
// PDFBookCommentsHubView.vue's overall shape, with the edit/delete
// capability UserCommentsView.vue has for comments layered in, since
// unlike a book-wide comment hub this view's own viewer may well have
// their own review right there in the list.
const route = useRoute()
const bookId = route.params.id

const userInfo = ref(null)
const loading = ref(true)
const bookTitle = ref('')
const averageRating = ref(null)
const ratingCount = ref(0)
const reviews = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const sort = ref('Newest')
const sortOptions = {
  Newest: 'جدیدترین',
  HighestRated: 'بیشترین امتیاز',
  MostLiked: 'بیشترین پسند'
}
const votingReviewId = ref(null)
const savingReviewId = ref(null)

const writeDialogOpen = ref(false)
const editingReview = ref(null) // null = submitting new, set = editing that review
const draftRating = ref(0) // 0 here means "no rating" for q-rating's own sake - converted to/from null when talking to the server
const draftText = ref('')
const writeSubmitting = ref(false)
const writeError = ref('')

async function loadBookTitle() {
  try {
    const res = await fetch(`https://api.naskban.ir/api/pdf/${bookId}`, {
      headers: { 'content-type': 'application/json' }
    })
    if (res.ok) {
      const book = await res.json()
      bookTitle.value = book.title
      averageRating.value = book.averageRating
      ratingCount.value = book.ratingCount
    }
  } catch {
    // title/rating are just for the header - a plain fallback (see the
    // template) is fine if this fails, not worth its own error UI
  }
}

async function loadReviews() {
  loading.value = true
  const res = await PDFBookReviewService.getReviewsForBook(
    userInfo.value,
    bookId,
    sort.value,
    pageNumber.value
  )
  if (res) {
    reviews.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function openUserReviews(review) {
  window.location.href = `/userreviews/${review.userId}?name=${encodeURIComponent(review.userName)}`
}

function openWriteDialog(review) {
  editingReview.value = review || null
  draftRating.value = review?.rating || 0
  draftText.value = review?.text || ''
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
    if (editingReview.value) {
      await PDFBookReviewService.editReview(userInfo.value, editingReview.value.id, draftText.value.trim(), rating)
    } else {
      await PDFBookReviewService.submitReview(userInfo.value, bookId, draftText.value.trim(), rating)
    }
    writeDialogOpen.value = false
    await loadReviews()
    await loadBookTitle() // the aggregate rating may have changed
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
    await loadBookTitle() // the aggregate rating may have changed
  } catch (e) {
    alert(e.message)
  }
  savingReviewId.value = null
}

// a vote changes likeCount/dislikeCount/myVote on this one review - a
// full reload just to reflect that would also reset pagination and
// re-fetch every other review, so it's simpler and cheaper to just
// update this one item locally to match what the server just did (see
// the Flutter client's own PDFBookReview.withVoteToggled for the exact
// same reasoning and arithmetic, mirrored here since Vue has no
// equivalent shared-model method to call into)
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
watch(sort, () => {
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
  document.title = 'نسکبان - نقدهای کتاب'
  loadBookTitle()
  loadReviews()
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
    <h3 class="q-my-none">نقدهای {{ bookTitle || 'این کتاب' }}</h3>
  </div>

  <div class="row justify-center q-pb-sm">
    <div v-if="averageRating != null" class="row items-center">
      <span class="text-h5 q-ml-sm">{{ averageRating.toFixed(1) }}</span>
      <q-rating :model-value="averageRating" max="5" readonly icon-half="star_half" color="amber" />
      <span class="text-caption text-grey-7 q-mr-sm">از {{ ratingCount }} امتیاز</span>
    </div>
    <div v-else class="text-caption text-grey-7">هنوز امتیازی برای این کتاب ثبت نشده است.</div>
  </div>

  <div class="row justify-center items-center q-pb-md" style="max-width: 700px; margin: auto">
    <q-btn v-if="userInfo != null" dense flat icon="rate_review" label="نوشتن نقد" @click="openWriteDialog(null)" />
    <q-space />
    <q-select
      v-model="sort"
      dense
      :options="Object.keys(sortOptions)"
      :option-label="(key) => sortOptions[key]"
      emit-value
      map-options
      style="min-width: 160px"
    />
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div v-if="!loading" class="q-mx-auto" style="max-width: 700px">
    <div v-if="reviews.length === 0" class="text-center text-grey-7 q-pa-lg">
      هنوز نقدی ثبت نشده است.
    </div>
    <q-card v-for="review in reviews" :key="review.id" flat bordered class="q-ma-sm">
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="text-bold" style="cursor: pointer" @click="openUserReviews(review)">
            {{ review.userName }}
          </div>
          <q-space />
          <div class="text-caption text-grey-7">
            {{ formatWithTime(review.createdAt) }}<span v-if="review.editedAt"> (ویرایش‌شده)</span>
          </div>
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
      <q-card-section class="text-h6">{{ editingReview ? 'ویرایش نقد' : 'نوشتن نقد' }}</q-card-section>
      <q-card-section>
        <div class="text-caption q-mb-xs">امتیاز (اختیاری)</div>
        <q-rating v-model="draftRating" max="5" size="2em" color="amber" icon="star_border" icon-selected="star" />
        <q-input
          v-model="draftText"
          label="متن نقد"
          type="textarea"
          class="q-mt-md"
        />
        <div v-if="writeError" class="text-red q-mt-sm">{{ writeError }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="انصراف" :disable="writeSubmitting" @click="writeDialogOpen = false" />
        <q-btn
          :label="editingReview ? 'ذخیره' : 'ثبت نقد'"
          color="primary"
          :loading="writeSubmitting"
          @click="submitWrite"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
