<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { en2fa } from '../en2fa'
import { bus } from '../event-bus'

const API_URL = `https://api.naskban.ir/api/pdf/bookmark/null/null`
const route = useRoute()

const loading = ref(false)
const pageNumber = ref(null)
const bookmarks = ref(null)
const pageCount = ref(1)
const pageSize = 100
const userInfo = ref(null)

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
  if (pageNumber.value == null) {
    if (route.query.page != null) {
      pageNumber.value = route.query.page
    } else {
      pageNumber.value = 1
    }
  }
  let url = `${API_URL}?PageNumber=${pageNumber.value}&PageSize=${pageSize}`

  
  loading.value = true
  const res = await fetch(url, {
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  bookmarks.value = await res.json()
  for (var pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      const paging_headers = JSON.parse(pair[1])
      pageCount.value = paging_headers.totalPages
    }
  }
  loading.value = false
  let pageUrl = ''
  let docTitle = 'نسک‌بان - نشان‌شده‌ها'
  
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


function goToLogin() {
  window.location.href = '/login'
}
async function logout(){
  if (!confirm(`از حساب کاربری خود بیرون می‌روید؟`)) {
    return
  }
  loading.value = true
  await fetch(`https://api.naskban.ir/api/users/delsession?userId=${userInfo.value.user.id}&sessionId=${userInfo.value.sessionId}`, {
    method: 'DELETE',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  localStorage.setItem('userInfo',null)
  bus.emit('user-logged-out')
}
</script>

<template>
  <q-bar class="bg-white text-white flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-separator vertical inset spaced />
      <q-btn v-if="userInfo == null" dense flat icon="account_circle" class="gt-xs green" @click="goToLogin">
        <q-tooltip class="bg-green text-white">ورود یا نام‌نویسی</q-tooltip>
      </q-btn>
      <q-btn v-if="userInfo != null" dense flat icon="directions_run" class="gt-xs green flip-horizontal" @click="logout">
        <q-tooltip class="bg-green text-white">خروج</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

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
    <div class="pdf flex q-ma-sm" v-for="bookmark in bookmarks" :key="bookmark.id">
      <a :href="'/' + bookmark.id" v-if="bookmark.pageNumber == null">
        <q-card class="fit">
          <q-img
            :src="bookmark.extenalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + bookmark.id">{{ bookmark.bookTitle }} </a>
          </q-card-section>
         
        </q-card>
      </a>
      <a :href="'/' + bookmark.id + '/' + bookmark.pageNumber" v-if="bookmark.pageNumber != null">
        <q-card class="fit">
          <q-img
            :src="bookmark.extenalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + bookmark.id + '/' + bookmark.pageNumber">{{ bookmark.bookTitle }} </a>
          </q-card-section>
         
        </q-card>
      </a>
    </div>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass
      v-if="loading && pdfs != null && pdfs.length > 0"
      color="green"
      size="4em"
    />
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
