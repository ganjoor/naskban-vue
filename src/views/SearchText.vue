<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()

const loading = ref(false)
const pageNumber = ref(null)
const pdfs = ref(null)
const pageCount = ref(1)
const searchTerm = ref('')

function en2fa(num) {
  let arr = []
  const persian = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
  num.split('').map((number, index) => {
    arr[index] = persian[number]
  })
  return arr.join('')
}

watchEffect(async () => {
  if (pageNumber.value == null) {
    if (route.query.page != null) {
      pageNumber.value = route.query.page
    } else {
      pageNumber.value = 1
    }
  }

  if (route.query.s != null) {
    searchTerm.value = route.query.s
  }
  let pageUrl = '/text'
  let docTitle = 'نسک‌بان - جستجو در متن'
  if (searchTerm.value != '') {
    let url = `${API_URL}/search/pages/text?term=${searchTerm.value}&PageNumber=${pageNumber.value}&PageSize=20`
    loading.value = true
    const res = await fetch(url)
    pdfs.value = await res.json()
    for (var pair of res.headers.entries()) {
      if (pair[0] == 'paging-headers') {
        const paging_headers = JSON.parse(pair[1])
        pageCount.value = paging_headers.totalPages
      }
    }
    loading.value = false

    if (searchTerm.value != '') {
      pageUrl = '/text?s=' + encodeURI(searchTerm.value)
      docTitle += ' - جستجوی ' + searchTerm.value
    }
    if (pageNumber.value > 1) {
      docTitle += ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
    }
    if (pageNumber.value != 1) {
      if (pageUrl != '') {
        pageUrl += '&'
      } else {
        pageUrl = '/text?'
      }
      pageUrl += 'page=' + pageNumber.value.toString()
    }
  }
  window.history.pushState({}, '', pageUrl)
  document.title = docTitle
})

function doSearch() {
  searchTerm.value = document.getElementById('s').value
  pageNumber.value = 1
}
</script>

<template>
  <div class="q-pa-lg flex flex-center">
    <input
      outlined
      :value="searchTerm"
      input-class="text-right"
      class="q-ml-md"
      id="s"
      name="s"
      type="text"
      placeholder="جستجو"
      @keydown.enter.prevent="doSearch"
    />
    <q-icon name="search" class="cursor-pointer" @click="doSearch"></q-icon>
  </div>
  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
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
  </div>

  <div class="row justify-center">
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
      <a :href="'/' + pdf.id+ '?s=' + encodeURI(searchTerm)">
        <q-card class="fit">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="width: 200px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + pdf.id + '?s=' + encodeURI(searchTerm)">{{ pdf.title }} </a>
          </q-card-section>
          <q-card-section
            class="text-subtitle2"
            v-if="pdf.authorsLine != null && pdf.authorsLine.length > 1"
          >
            {{ pdf.authorsLine }}
          </q-card-section>
        </q-card>
      </a>
    </div>
  </div>
</template>

<style>
a {
  text-decoration: none;
  color: #42b883;
}
.flex-container {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
}
h3 {
  text-align: center;
}
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
