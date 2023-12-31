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
  await loadOCRText(pageNumber.value);
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
  await loadOCRText(value);
}
async function loadOCRText(pageNumber){
  if(pdf.value.ocRed){
    const url = `${API_URL}/${route.params.id}/page/${pageNumber}`
    let pageInfo = await (await fetch(url)).json();
    if(pageInfo == null || pageInfo.pageText == null){
      ocrText.value = null;
    }else{
      ocrText.value = pageInfo.pageText.replace('\n', '<br />');
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
  loading.value = true
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
</script>

<template class="full-width">
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
    <q-card class="full-width q-pa-lg flex flex-center">
      <a v-if="pdf != null" :href="pdf.externalPDFFileUrl + '#page=' + pageNumber" target="_blank"
        >مشاهده در فایل</a
      >
    </q-card>
    <q-card v-if="ocrText != null" class="full-width q-pa-lg flex flex-center">
      <q-card-section>
        متن بازشناسی شده
      </q-card-section>
      <q-card-section>
        <div v-html="ocrText" ></div>
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

          <q-btn label="پیشنهاد" color="green" @click="saveGanjoorLinkSuggestion" />

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
              :src="`/${route.params.id}/${pageNumber}`"
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
