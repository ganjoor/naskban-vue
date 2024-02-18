<script setup>
import { useRoute } from 'vue-router'
import { ref, watchEffect, onMounted } from 'vue'
import { en2fa } from '../en2fa'
import { bus } from '../event-bus'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()

const loading = ref(false)

const pdf = ref(null)

const searchTerm = ref('')
const pageNumber = ref(null)
const pageCount = ref(0)
const pages = ref(null)
const userInfo = ref(null)
const editMode = ref(false)

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

async function setUrlAndTitle() {
  let pageUrl = '/' + route.params.id.toString()
  let docTitle = 'نسک‌بان - ' + pdf.value.title
  if (searchTerm.value != '') {
    pageUrl = '/' + route.params.id.toString() + '?s=' + encodeURI(searchTerm.value)
    docTitle += ' - جستجوی ' + searchTerm.value
  }
  if (pageNumber.value > 1) {
    docTitle += ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
  }
  if (pageNumber.value != 1) {
    if (pageUrl != '') {
      pageUrl += '&'
    } else {
      pageUrl = '/' + route.params.id.toString() + '?'
    }
    pageUrl += 'page=' + pageNumber.value.toString()
  }
  window.history.pushState({}, '', pageUrl)
  document.title = docTitle
}

watchEffect(async () => {
  if (route.query.s != null) {
    searchTerm.value = route.query.s
  }
  if (pageNumber.value == null) {
    if (route.query.page != null) {
      pageNumber.value = route.query.page
    } else {
      pageNumber.value = 1
    }
  }
  const url = `${API_URL}/${route.params.id}`
  loading.value = true
  pdf.value = await (await fetch(url)).json()
  loading.value = false
  if (searchTerm.value != '') {
    await performSearch()
  } else {
    await setUrlAndTitle()
  }
})

async function initSearch() {
  searchTerm.value = document.getElementById('s').value
  route.query.s = searchTerm.value
  pageNumber.value = 1
  await performSearch()
}

async function performSearch() {
  const url = `${API_URL}/search/pdfbook/${pdf.value.id}/text?term=${searchTerm.value}&PageNumber=${pageNumber.value}&PageSize=20`
  loading.value = true
  const res = await await fetch(url)
  loading.value = false
  for (var pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      const paging_headers = JSON.parse(pair[1])
      pageCount.value = paging_headers.totalPages
    }
  }

  let httpPages = await res.json()
  for (var i = 0; i < httpPages.length; i++) {
    searchTerm.value
      .replace('"', '')
      .replace('"', '')
      .split(' ')
      .forEach((key) => {
        httpPages[i].pageText = highlight(httpPages[i].pageText, key)
      })
  }
  pages.value = httpPages
  await setUrlAndTitle()
}

function highlight(text, keyword) {
  var index = text.indexOf(keyword)
  if (index >= 0) {
    text =
      text.substring(0, index) +
      "<span class='highlight'>" +
      text.substring(index, index + keyword.length) +
      '</span>' +
      text.substring(index + keyword.length)
  }
  return text
}

async function deletePDFBook() {
  if (!confirm('آیا از حذف این کتاب اطمینان دارید؟')) {
    return
  }
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf/${pdf.value.id}`, {
    method: 'DELETE',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  alert('کتاب حذف شد!')
}

async function saveEdits() {
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf`, {
    method: 'PUT',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      id: pdf.value.id,
      bookId: pdf.value.bookId,
      multiVolumePDFCollectionId: pdf.value.multiVolumePDFCollectionId,
      pdfSourceId: pdf.value.pdfSourceId,
      status: pdf.value.status,
      title: pdf.value.title,
      subTitle: pdf.value.subTitle,
      titleInOriginalLanguage: pdf.value.titleInOriginalLanguage,
      authorsLine: pdf.value.authorsLine,
      publisherLine: pdf.value.publisherLine,
      isbn: pdf.value.isbn,
      description: pdf.value.Description,
      isTranslation: pdf.value.isTranslation,
      translatorsLine: pdf.value.translatorsLine,
      publishingDate:pdf.value.publishingDate,
      publishingLocation: pdf.value.publishingLocation,
      publishingNumber: pdf.value.publishingNumber,
      claimedPageCount: pdf.value.claimedPageCount,
      originalSourceName: pdf.value.originalSourceName,
      originalFileUrl: pdf.value.originalFileUrl,
      volumeOrder: pdf.value.volumeOrder,  
      bookScriptType: pdf.value.bookScriptType
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  alert('تغییرات ذخیره شد!')
}
</script>

<template>
  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>
  <div class="q-pa-lg flex flex-center justify-center centers">
    <q-card v-if="pdf != null">
      <q-card-section class="q-pa-lg flex flex-center justify-center centers">
        <a :href="'/' + pdf.id + '/1'">
          <q-img :src="pdf.extenalCoverImageUrl" spinner-color="white" class="width-300px"> </q-img>
        </a>
      </q-card-section>
      <q-card v-if="userInfo != null" class="full-width q-pa-lg flex flex-center">
        <q-btn label="ویرایش" @click="editMode = !editMode" />
      </q-card>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="'/' + pdf.id + '/1'">{{ pdf.title }}</a>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.title" label="عنوان" />
      </q-card-section>
      <q-card-section v-if="pdf.subTitle != null" class="q-pa-lg flex flex-center">
        {{ pdf.subTitle }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.subTitle" label="زیرعنوان" />
      </q-card-section>
      <q-card-section v-if="pdf.titleInOriginalLanguage != null" class="q-pa-lg flex flex-center">
        {{ pdf.titleInOriginalLanguage }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.titleInOriginalLanguage" label="عنوان به زبان اصلی" />
      </q-card-section>
      <q-card-section v-if="pdf.authorsLine != null" class="q-pa-lg flex flex-center">
        {{ pdf.authorsLine }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.authorsLine" label="پدیدآورندگان" />
      </q-card-section>
      <q-card-section v-if="pdf.translatorsLine != null" class="q-pa-lg flex flex-center">
        ترجمه: {{ pdf.translatorsLine }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.translatorsLine" label="مترجمان" />
      </q-card-section>
      <q-card-section v-if="pdf.publisherLine != null" class="q-pa-lg flex flex-center">
        ناشر: {{ pdf.publisherLine }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.publisherLine" label="ناشر" />
      </q-card-section>
      <q-card-section v-if="pdf.publishingDate != null" class="q-pa-lg flex flex-center">
        تاریخ چاپ: {{ pdf.publishingDate }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.publishingDate" label="تاریخ چاپ" />
      </q-card-section>
      <q-card-section v-if="pdf.publishingLocation != null" class="q-pa-lg flex flex-center">
        محل چاپ: {{ pdf.publishingLocation }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.publishingLocation" label="محل چاپ" />
      </q-card-section>
      <q-card-section v-if="pdf.publishingNumber != null" class="q-pa-lg flex flex-center">
        نوبت چاپ: {{ pdf.publishingNumber }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.publishingNumber" label="نوبت چاپ" />
      </q-card-section>
      <q-card-section v-if="pdf.claimedPageCount != null" class="q-pa-lg flex flex-center">
        تعداد صفحات (کاغذی): {{ pdf.claimedPageCount }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.claimedPageCount" label="تعداد صفحات (کاغذی)" />
      </q-card-section>
      <q-card-section v-if="pdf.description != null" class="q-pa-lg flex flex-center">
        {{ pdf.description }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.description" label="توضیحات" />
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        تعداد صفحات (تصویربرداری شده): {{ pdf.pageCount }}
      </q-card-section>
      <q-card-section v-if="pdf.isbn != null" class="q-pa-lg flex flex-center">
        شابک: {{ pdf.isbn }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-input v-model="pdf.isbn" label="شابک" />
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center" v-if="editMode">
        <q-btn label="ذخیرهٔ تغییرات" @click="saveEdits" />
      </q-card-section>
      <q-card-section
        v-if="pdf.multiVolumePDFCollectionId != null"
        class="q-pa-lg flex flex-center"
      >
        شماره جلد: {{ pdf.volumeOrder }}
      </q-card-section>
      <q-card-section v-if="pdf.pdfSource != null" class="q-pa-lg flex flex-center">
        منبع:&nbsp;<a :href="pdf.pdfSource.url">{{ pdf.pdfSource.description }}</a>
      </q-card-section>
      <q-card-section v-if="pdf.originalSourceUrl != null" class="q-pa-lg flex flex-center">
        <a :href="pdf.originalSourceUrl" target="_blank">صفحه در وبگاه منبع</a>
      </q-card-section>
      <q-card-section v-if="pdf.originalFileUrl != null" class="q-pa-lg flex flex-center">
        <a :href="pdf.originalFileUrl" target="_blank">دریافت فایل از منبع</a>
      </q-card-section>
      <q-card-section v-if="pdf.tags.length > 0" class="q-pa-lg flex flex-center">
        <table>
          <tr>
            <th>برچسب</th>
            <th>مقدار</th>
          </tr>
          <tr v-for="tag in pdf.tags" :key="tag.id">
            <td>{{ tag.rTag.name }}</td>
            <td>{{ tag.value }}</td>
          </tr>
        </table>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="'/' + pdf.id + '/1'">مشاهده</a>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="pdf.externalPDFFileUrl" target="_blank"
          >دریافت (اندازه
          {{ (pdf.pdfFile.fileSizeInBytes / 1024.0 / 1024.0).toFixed(2) }} مگابایت)</a
        >
      </q-card-section>
      <q-card-section
        v-if="pdf != null && pdf.ocRed == true"
        class="q-pa-lg flex flex-center justify-center centers"
      >
        <input
          outlined
          :value="searchTerm"
          input-class="text-right"
          class="q-ml-md"
          id="s"
          name="s"
          type="search"
          placeholder="جستجو در متن"
          @keydown.enter.prevent="initSearch"
        />
        <q-icon name="search" class="cursor-pointer" @click="initSearch"></q-icon>
        <q-spinner-hourglass v-if="loading" color="green" size="4em" />
      </q-card-section>
      <q-card-section
        v-if="!loading && searchTerm != '' && pageCount == 0"
        class="q-pa-lg flex flex-center justify-center centers"
      >
        نتیجه‌ای یافت نشد.
      </q-card-section>
      <q-card-section
        v-if="pages != null && pageCount > 0"
        class="q-pa-lg flex flex-center justify-center centers"
      >
        <q-pagination
          v-model="pageNumber"
          v-if="!loading"
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
      </q-card-section>
      <q-card-section v-if="pages != null">
        <div class="row justify-center">
          <div class="pdf flex q-ma-sm" v-for="page in pages" :key="page.id">
            <a :href="'/' + page.pdfBookId + '/' + page.pageNumber">
              <q-card class="fit">
                <q-img
                  :src="page.extenalThumbnailImageUrl"
                  spinner-color="white"
                  style="width: 200px"
                  class="rounded-borders"
                >
                </q-img>
                <q-card-section class="text-h6">
                  <a :href="'/' + page.pdfBookId + '/' + page.pageNumber">{{ page.pageNumber }} </a>
                </q-card-section>
                <q-card-section style="color: black">
                  <div v-html="page.pageText.replace('\n', '<br />')"></div>
                </q-card-section>
              </q-card>
            </a>
          </div>
        </div>
      </q-card-section>

      <div class="q-pa-lg flex flex-center">
        <q-spinner-hourglass v-if="loading" color="green" size="4em" />
        <q-pagination
          v-model="pageNumber"
          v-if="!loading && pageCount > 0"
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
    </q-card>
    <q-card v-if="userInfo != null" class="full-width q-pa-lg flex flex-center">
      <q-btn label="حذف کتاب" @click="deletePDFBook" />
    </q-card>
  </div>
</template>

<style>
.width-300px {
  width: 300px;
}
.highlight {
  background-color: yellow;
}
</style>
