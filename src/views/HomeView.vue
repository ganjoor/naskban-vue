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
const pageSize = 20

function en2fa(num) {
  let arr = []
  const persian = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
  num.split('').map((number, index) => {
    arr[index] = persian[number]
  })
  return arr.join('')
}

watchEffect(async () => {
  let url = `${API_URL}?PageNumber=${pageNumber.value}&PageSize=${pageSize}`
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
  if (searchTerm.value != '') {
    url = `${API_URL}/search?term=${searchTerm.value}&PageNumber=${pageNumber.value}&PageSize=${pageSize}`
  }

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
  let pageUrl = ''
  let docTitle = 'نسک‌بان'
  if (searchTerm.value != '') {
    pageUrl = '/?s=' + encodeURI(searchTerm.value)
    docTitle += ' - جستجوی ' + searchTerm.value
  }
  if (pageNumber.value > 1) {
    docTitle += ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
  }
  if (pageNumber.value != 1) {
    if (pageUrl != '') {
      pageUrl += '&'
    } else {
      pageUrl = '/?'
    }
    pageUrl += 'page=' + pageNumber.value.toString()
  }
  window.history.pushState({}, '', pageUrl)
  document.title = docTitle
})

function doSearch(){
  searchTerm.value = document.getElementById('s').value
  pageNumber.value = 1
}

function fullTextSearch(){
  window.location.href = '/text?s=' + encodeURI(document.getElementById('s').value)
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
    <q-icon name="manage_search" class="cursor-pointer" @click="fullTextSearch"></q-icon>
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
      <a :href="'/' + pdf.id">
        <q-card class="fit">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px;"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + pdf.id">{{ pdf.title }} </a>
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
