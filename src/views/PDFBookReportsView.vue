<script setup>
import { ref, onMounted, watch } from 'vue'
import PermissionChecker from '../utilities/PermissionChecker'

const loading = ref(true)
const userInfo = ref(null)
const canReviewReports = ref(false)
const reports = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)

const respondDialogOpen = ref(false)
const respondingReport = ref(null)
const respondText = ref('')
const respondSubmitting = ref(false)
const respondError = ref('')

const bookReportCategories = {
  Copyright: 'نقض حق نشر',
  IncorrectMetadata: 'اطلاعات نادرست',
  Other: 'سایر'
}
function categoryLabel(category) {
  return bookReportCategories[category] || category
}

function checkPermission(secShortName, opShortName) {
  return PermissionChecker.check(userInfo.value, secShortName, opShortName)
}

async function loadReports() {
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/reports/open?PageNumber=${pageNumber.value}&PageSize=20`,
    {
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  if (res.ok) {
    reports.value = await res.json()
    for (const pair of res.headers.entries()) {
      if (pair[0] == 'paging-headers') {
        pageCount.value = JSON.parse(pair[1]).totalPages
      }
    }
  }
  loading.value = false
}

function openBook(bookId) {
  window.location.href = '/' + bookId
}

function openRespondDialog(report) {
  respondingReport.value = report
  respondText.value = ''
  respondError.value = ''
  respondDialogOpen.value = true
}

async function submitResponse() {
  if (!respondText.value.trim()) {
    respondError.value = 'پاسخ را وارد کنید.'
    return
  }
  respondSubmitting.value = true
  respondError.value = ''
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/report/${respondingReport.value.id}/close`,
    {
      method: 'PUT',
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ response: respondText.value.trim() })
    }
  )
  respondSubmitting.value = false
  if (!res.ok) {
    respondError.value = await res.json()
    return
  }
  reports.value = reports.value.filter((r) => r.id !== respondingReport.value.id)
  respondDialogOpen.value = false
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
  canReviewReports.value = checkPermission('pdfreport', 'moderate')
  document.title = 'نسکبان - گزارش‌های کاربران'
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

  <h3>گزارش‌های کاربران</h3>

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
          <q-item-label>
            <a href="#" @click.prevent="openBook(report.pdfBookId)">{{ report.pdfBookTitle }}</a>
          </q-item-label>
          <q-item-label caption>دلیل: {{ categoryLabel(report.category) }}</q-item-label>
          <q-item-label caption lines="2">{{ report.description }}</q-item-label>
          <q-item-label caption>{{ report.reporterName }} · {{ report.createdAt }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn dense flat round icon="reply" @click="openRespondDialog(report)">
            <q-tooltip class="bg-green text-white">پاسخ و بستن گزارش</q-tooltip>
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

  <q-dialog v-model="respondDialogOpen">
    <q-card style="min-width: 320px" v-if="respondingReport">
      <q-card-section class="text-h6">پاسخ به گزارش</q-card-section>
      <q-card-section>
        <div><b>کتاب:</b> {{ respondingReport.pdfBookTitle }}</div>
        <div><b>دلیل:</b> {{ categoryLabel(respondingReport.category) }}</div>
        <div class="q-mt-sm"><b>توضیحات گزارش‌دهنده:</b></div>
        <div class="text-grey-8">{{ respondingReport.description }}</div>
        <q-input v-model="respondText" label="پاسخ شما" type="textarea" class="q-mt-md" />
        <div v-if="respondError" class="text-red q-mt-sm">{{ respondError }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="انصراف" :disable="respondSubmitting" @click="respondDialogOpen = false" />
        <q-btn
          label="ارسال پاسخ و بستن گزارش"
          color="primary"
          :loading="respondSubmitting"
          @click="submitResponse"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
