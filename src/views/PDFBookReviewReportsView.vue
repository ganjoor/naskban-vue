<script setup>
import { ref, onMounted, watch } from 'vue'
import PermissionChecker from '../utilities/PermissionChecker'
import * as PDFBookReviewReportService from '../utilities/PDFBookReviewReportService'
import { formatWithTime } from '../utilities/JalaliDate'

// Still-open reports against book reviews, for reviewers - gated
// server-side by the pdfbookreviewreport:moderate permission. Mirrors
// PDFBookReportsView.vue's overall list/permission-check structure
// (q-list/q-item, not q-card-per-item like the review hubs - matching
// the established Vue convention for a moderation queue specifically),
// but resolving here is two distinct actions (approve = delete the
// review, reject = leave it) rather than one "respond and close" -
// same reasoning as the Flutter client's own
// resolve_review_report_dialog.dart, since there is no Vue comment- or
// review-report precedent to mirror instead (comment reporting was
// never built in Vue at all - see this file's own sibling gap that
// prompted this one).
const loading = ref(true)
const userInfo = ref(null)
const canReviewReports = ref(false)
const reports = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)

const resolveDialogOpen = ref(false)
const resolvingReport = ref(null)
const resolveResponse = ref('')
const resolveSubmitting = ref(false)
const resolveError = ref('')

const reviewReportCategories = {
  Spam: 'هرزنامه',
  Offensive: 'توهین‌آمیز',
  Harassment: 'آزار و اذیت',
  Other: 'سایر'
}
function categoryLabel(category) {
  return reviewReportCategories[category] || category
}

function checkPermission(secShortName, opShortName) {
  return PermissionChecker.check(userInfo.value, secShortName, opShortName)
}

async function loadReports() {
  loading.value = true
  const res = await PDFBookReviewReportService.getOpenReports(userInfo.value, pageNumber.value)
  if (res) {
    reports.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function openBook(bookId) {
  window.location.href = '/' + bookId
}

function openUserReviews(report) {
  window.location.href = `/userreviews/${report.reviewAuthorId}?name=${encodeURIComponent(report.reviewAuthorName || '')}`
}

function openResolveDialog(report) {
  resolvingReport.value = report
  resolveResponse.value = ''
  resolveError.value = ''
  resolveDialogOpen.value = true
}

async function resolve(approved) {
  resolveSubmitting.value = true
  resolveError.value = ''
  try {
    const response = resolveResponse.value.trim() || null
    await PDFBookReviewReportService.resolveReport(userInfo.value, resolvingReport.value.id, approved, response)
    reports.value = reports.value.filter((r) => r.id !== resolvingReport.value.id)
    resolveDialogOpen.value = false
  } catch (e) {
    resolveError.value = e.message
  }
  resolveSubmitting.value = false
}

watch(pageNumber, () => loadReports())

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  canReviewReports.value = checkPermission('pdfbookreviewreport', 'moderate')
  document.title = 'نسکبان - گزارش‌های نقدها'
  if (canReviewReports.value) {
    loadReports()
  } else {
    loading.value = false
  }
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

  <h3>گزارش‌های نقدها</h3>

  <div v-if="!loading && !canReviewReports" class="text-center q-pa-lg">
    شما دسترسی لازم برای مشاهدهٔ این صفحه را ندارید.
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <q-list
    v-if="!loading && canReviewReports"
    bordered
    class="rounded-borders q-mx-auto"
    style="max-width: 700px"
  >
    <template v-for="(report, index) in reports" :key="report.id">
      <q-item>
        <q-item-section>
          <q-item-label v-if="report.reviewStillExists">
            <q-rating
              v-if="report.reviewRating != null"
              :model-value="report.reviewRating"
              max="5"
              readonly
              color="amber"
              size="16px"
            />
            {{ report.reviewText }}
          </q-item-label>
          <q-item-label v-else caption class="text-italic">
            این نقد دیگر در دسترس نیست
          </q-item-label>
          <q-item-label caption>دلیل: {{ categoryLabel(report.category) }}</q-item-label>
          <q-item-label caption lines="2">{{ report.description }}</q-item-label>
          <q-item-label caption>{{ report.reporterName }} · {{ formatWithTime(report.createdAt) }}</q-item-label>
          <q-item-label caption>
            <a href="#" @click.prevent="openUserReviews(report)">نقدهای این کاربر</a>
            <template v-if="report.bookTitle">
              ·
              <a href="#" @click.prevent="openBook(report.pdfBookId)">{{ report.bookTitle }}</a>
            </template>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn dense flat round icon="gavel" @click="openResolveDialog(report)">
            <q-tooltip class="bg-green text-white">بررسی گزارش</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-separator v-if="index < reports.length - 1" />
    </template>
    <div v-if="reports.length === 0" class="text-center q-pa-lg">
      گزارش بازِ بررسی‌نشده‌ای نیست.
    </div>
  </q-list>

  <div class="q-pa-lg flex flex-center">
    <q-pagination
      v-model="pageNumber"
      v-if="!loading && canReviewReports && pageCount > 1"
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

  <q-dialog v-model="resolveDialogOpen">
    <q-card style="min-width: 320px" v-if="resolvingReport">
      <q-card-section class="text-h6">بررسی گزارش نقد</q-card-section>
      <q-card-section>
        <template v-if="resolvingReport.reviewStillExists">
          <q-rating
            v-if="resolvingReport.reviewRating != null"
            :model-value="resolvingReport.reviewRating"
            max="5"
            readonly
            color="amber"
            size="16px"
          />
          <div>{{ resolvingReport.reviewText }}</div>
          <div class="text-caption text-grey-7">نویسنده: {{ resolvingReport.reviewAuthorName }}</div>
        </template>
        <div v-else class="text-italic text-grey-7">
          این نقد دیگر در دسترس نیست (پیش از این حذف شده است).
        </div>
        <div v-if="resolvingReport.bookTitle" class="q-mt-sm">
          <b>کتاب:</b> {{ resolvingReport.bookTitle }}
        </div>
        <div class="q-mt-sm"><b>دلیل گزارش:</b> {{ categoryLabel(resolvingReport.category) }}</div>
        <div class="q-mt-xs"><b>توضیحات گزارش‌دهنده:</b></div>
        <div class="text-grey-8">{{ resolvingReport.description }}</div>
        <q-input v-model="resolveResponse" label="یادداشت شما (اختیاری)" type="textarea" class="q-mt-md" />
        <div v-if="resolveError" class="text-red q-mt-sm">{{ resolveError }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="انصراف" :disable="resolveSubmitting" @click="resolveDialogOpen = false" />
        <q-btn label="رد گزارش" :disable="resolveSubmitting" @click="resolve(false)" />
        <q-btn
          :label="resolvingReport.reviewStillExists ? 'تأیید و حذف نقد' : 'تأیید گزارش'"
          color="red"
          :loading="resolveSubmitting"
          @click="resolve(true)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
