<script setup>
import { useRoute } from 'vue-router'
import { ref, watchEffect, onMounted } from 'vue'
import { VuePDF, usePDF } from '@tato30/vue-pdf'
import { bus } from '../event-bus'
import { en2fa } from '../en2fa'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()
const loading = ref(false)
const pdf = ref(null)
const pdfFile = ref(null)
const pageNumber = ref(null)
const userInfo = ref(null)
const ganjoorLink = ref(false)
const suggestionResult = ref('')
const pageInfo = ref(null)
const ocrText = ref(null)
bus.on('user-logged-in', (u) => {
  userInfo.value = u
})

bus.on('user-logged-out', () => {
  userInfo.value = null
})

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
})

watchEffect(async () => {
  const url = `${API_URL}/${route.params.id}`

  loading.value = true
  pdf.value = await (await fetch(url)).json()
  pdfFile.value = usePDF({
    url: pdf.value.externalPDFFileUrl
  })
  if (pageNumber.value == null) {
    if (route.params.page != null) {
      pageNumber.value = parseInt(route.params.page)
    } else {
      pageNumber.value = 1
    }
  }

  if (pageNumber.value == 1) {
    document.title = 'نسک‌بان - ' + pdf.value.title
    window.history.pushState({}, '', '/' + pdf.value.id.toString() + '/1')
  } else {
    document.title =
      'نسک‌بان - ' + pdf.value.title + ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
    window.history.pushState(
      {},
      '',
      '/' + pdf.value.id.toString() + '/' + pageNumber.value.toString()
    )
  }
  await loadOCRText(pageNumber.value)
})

function onLoaded() {
  loading.value = false
}
async function updatePageNumber(value) {
  localStorage.setItem('id', pdf.value.id)
  localStorage.setItem('page', value)
  if (value == 1) {
    document.title = 'نسک‌بان - ' + pdf.value.title
    window.history.pushState({}, '', '/' + pdf.value.id.toString() + '/1')
  } else {
    document.title = 'نسک‌بان - ' + pdf.value.title + ' - صفحهٔ ' + en2fa(value.toString())
    window.history.pushState({}, '', '/' + pdf.value.id.toString() + '/' + value.toString())
  }
  await loadOCRText(value)
}
async function loadOCRText(pageNumber) {
  if (pdf.value.ocRed) {
    const url = `${API_URL}/${route.params.id}/page/${pageNumber}`
    pageInfo.value = await (await fetch(url)).json()
    if (pageInfo.value == null || pageInfo.value.pageText == null) {
      ocrText.value = null
    } else {
      ocrText.value = pageInfo.value.pageText.replace('\n', '<br />')
    }
  }
}
async function handleSwipe(swipeInfo) {
  if (swipeInfo.direction == 'right' && pageNumber.value < pdfFile.value.pages) {
    pageNumber.value += 1
    await updatePageNumber(pageNumber.value)
  }
  if (swipeInfo.direction == 'left' && pageNumber.value > 1) {
    pageNumber.value -= 1
    await updatePageNumber(pageNumber.value)
  }
}
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace)
}
async function saveGanjoorLinkSuggestion() {
  loading.value = true
  var ganjoorUrl = replaceAll(
    replaceAll(
      document
        .getElementById('ganjoorFrame')
        .contentWindow.location.href.substring(
          document.getElementById('ganjoorFrame').contentWindow.location.href.indexOf('=') + 1
        ),
      '%3A',
      ':'
    ),
    '%2F',
    '/'
  )

  var ganjoorPostId = parseInt(localStorage.getItem('ganjoorPostId'))
  var ganjoorTitle = localStorage.getItem('ganjoorPostTitle')
  ganjoorTitle = replaceAll(ganjoorTitle, '\r\n', '')
  var pdfId = parseInt(localStorage.getItem('id'))
  var pdfPageNumber = parseInt(localStorage.getItem('page'))

  const response = await fetch('https://api.naskban.ir/api/pdf/ganjoor', {
    method: 'POST',
    body: JSON.stringify({
      ganjoorPostId,
      ganjoorUrl,
      ganjoorTitle,
      pdfBookId: pdfId,
      pageNumber: pdfPageNumber,
      isTextOriginalSource: true
    }),
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!response.ok) {
    suggestionResult.value = await response.json()
    return
  }
  suggestionResult.value = `${pdf.value.title} » صفحهٔ ${en2fa(
    pdfPageNumber.toString()
  )} => ${ganjoorTitle}`
}
function goToLogin() {
  window.location.href = '/login'
}
async function logout() {
  if (!confirm(`از حساب کاربری خود بیرون می‌روید؟`)) {
    return
  }
  loading.value = true
  await fetch(
    `https://api.naskban.ir/api/users/delsession?userId=${userInfo.value.user.id}&sessionId=${userInfo.value.sessionId}`,
    {
      method: 'DELETE',
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  loading.value = false
  localStorage.setItem('userInfo', null)
  bus.emit('user-logged-out')
}

function copyUrl(){
  navigator.clipboard.writeText(window.location.href);
}
</script>

<template class="full-width">
  <q-bar class="bg-white text-white flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="link" class="gt-xs green" @click="copyUrl">
        <q-tooltip class="bg-green text-white">کپی نشانی به حافظه</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        v-if="userInfo == null"
        dense
        flat
        icon="account_circle"
        class="gt-xs green"
        @click="goToLogin"
      >
        <q-tooltip class="bg-green text-white">ورود یا نام‌نویسی</q-tooltip>
      </q-btn>
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="directions_run"
        class="gt-xs green flip-horizontal"
        @click="logout"
      >
        <q-tooltip class="bg-green text-white">خروج</q-tooltip>
      </q-btn>
    </div>
  </q-bar>
  <q-card v-if="pdf != null && pdf.title != null" class="q-pa-lg flex flex-center">
    <q-card-section>
      <a :href="'/' + pdf.id">{{ pdf.title }}</a>
    </q-card-section>
    <q-card-section class="full-width q-pa-lg flex flex-center justify-center centers">
      <q-pagination
        v-if="pdfFile != null"
        v-model="pageNumber"
        :max="pdfFile.pages"
        input
        input-class="text-orange-10"
        icon-last="skip_previous"
        icon-first="skip_next"
        icon-next="fast_rewind"
        icon-prev="fast_forward"
        @update:model-value="updatePageNumber"
      />
    </q-card-section>
  </q-card>
  <div class="q-pa-lg flex flex-center full-width">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />

    <div class="q-pa-lg flex flex-center justify-center centers full-width">
      <VuePDF
        v-if="pdfFile != null"
        :pdf="pdfFile.pdf"
        :page="pageNumber"
        @loaded="onLoaded"
        v-touch-swipe.mouse="handleSwipe"
        fit-parent
      />
    </div>
    <q-card-section
      v-if="pageInfo != null && pageInfo.tags.length > 0"
      class="q-pa-lg flex flex-center"
    >
      <table>
        <tr>
          <th>برچسب</th>
          <th>مقدار</th>
        </tr>
        <tr v-for="tag in pageInfo.tags" :key="tag.id">
          <td>{{ tag.rTag.name }}</td>
          <td v-if="tag.valueSupplement == null">{{ tag.value }}</td>
          <td v-if="tag.valueSupplement != null">
            <a :href="tag.valueSupplement" target="_blank"> {{ tag.value }}</a>
          </td>
        </tr>
      </table>
    </q-card-section>
    <q-card class="full-width q-pa-lg flex flex-center">
      <a v-if="pdf != null" :href="pdf.externalPDFFileUrl + '#page=' + pageNumber" target="_blank"
        >مشاهده در فایل</a
      >
    </q-card>
    <q-card v-if="ocrText != null" class="full-width q-pa-lg flex flex-center">
      <q-card-section> متن بازشناسی شده </q-card-section>
      <q-card-section>
        <div v-html="ocrText"></div>
      </q-card-section>
    </q-card>
    <q-card v-if="userInfo != null" class="full-width q-pa-lg flex flex-center">
      <q-btn label="پیشنهاد شعر مرتبط در گنجور" @click="ganjoorLink = true" />
    </q-card>

    <q-dialog
      v-model="ganjoorLink"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card>
        <q-bar>
          <div class="text-h6">پیشنهاد شعر مرتبط در گنجور</div>
          <q-space> </q-space>

          <q-btn v-if="!loading" label="پیشنهاد" color="green" @click="saveGanjoorLinkSuggestion" />

          <q-btn
            dense
            flat
            icon="minimize"
            @click="maximizedToggle = false"
            :disable="!maximizedToggle"
          >
            <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">Minimize</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section v-if="suggestionResult != ''" class="row">
          {{ suggestionResult }}
        </q-card-section>

        <q-card-section class="row">
          <div class="col">
            <iframe
              :src="`/frame/${route.params.id}/${pageNumber}`"
              style="width: 50vw; height: 70vh"
            ></iframe>
          </div>
          <div class="col">
            <iframe
              src="/ganjoor?url=https://ganjoor.net"
              id="ganjoorFrame"
              style="width: 50vw; height: 70vh"
            ></iframe>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>
