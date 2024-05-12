<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { en2fa } from '../en2fa'
import { bus } from '../event-bus'

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
  if (userInfo.value == null && localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) {
    goToLogin()
  }
  if (pageNumber.value == null) {
    if (route.query.page != null) {
      pageNumber.value = route.query.page
    } else {
      pageNumber.value = 1
    }
  }
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/bookmark/null/null?PageNumber=${pageNumber.value}&PageSize=${pageSize}`,
    {
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  bookmarks.value = await res.json()
  for (var pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      const paging_headers = JSON.parse(pair[1])
      pageCount.value = paging_headers.totalPages
    }
  }
  loading.value = false
  let pageUrl = ''
  let docTitle = 'نسکبان - نشان‌شده‌ها'

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

function doSearch() {
  window.location.href = '/?s=' + document.getElementById('s').value
}
function fullTextSearch() {
  window.location.href = '/text?s=' + encodeURI(document.getElementById('s').value)
}
function goToLogin() {
  window.location.href = '/login'
}
function goToProfile() {
  window.location.href = '/profile'
}
function goTo(url) {
  window.location.href = url
}
function goToBookmarks() {
  window.location.href = '/bookmarks'
}
function goToHistory() {
  window.location.href = '/visits'
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
  window.location.href = '/login'
}
</script>

<template>
  <q-bar class="bg-white text-white flex-center">
    <div class="q-pa-lg flex flex-center">
      <input
        outlined
        :value="searchTerm"
        input-class="text-right"
        class="q-ml-md"
        id="s"
        name="s"
        type="search"
        placeholder="جستجو"
        @keydown.enter.prevent="doSearch"
      />
      <q-btn dense flat icon="search" class="green" @click="doSearch">
        <q-tooltip class="bg-green text-white">جستجو در ابرداده‌ها</q-tooltip>
      </q-btn>
      <q-btn dense flat icon="manage_search" class="green" @click="fullTextSearch">
        <q-tooltip class="bg-green text-white">جستجو در متن</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced v-if="userInfo != null" />
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="bookmarks"
        class="green"
        @click="goToBookmarks"
      >
        <q-tooltip class="bg-green text-white">نشان‌شده‌ها</q-tooltip>
      </q-btn>
      <q-btn v-if="userInfo != null" dense flat icon="history" class="green" @click="goToHistory">
        <q-tooltip class="bg-green text-white">بازدیدهای اخیر من</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="account_circle"
        class="green"
        @click="goToProfile"
      >
        <q-tooltip class="bg-green text-white">نمایهٔ کاربر</q-tooltip>
      </q-btn>
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="directions_run"
        class="green flip-horizontal"
        @click="logout"
      >
        <q-tooltip class="bg-green text-white">خروج</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn v-if="userInfo != null" dense flat icon="help" class="green" @click="goTo('/about')">
        <q-tooltip class="bg-green text-white">معرفی</q-tooltip>
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
      <a :href="'/' + bookmark.bookId" v-if="bookmark.pageNumber == 0">
        <q-card class="fit">
          <q-img
            :src="bookmark.extenalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + bookmark.bookId">{{ bookmark.bookTitle }} </a>
          </q-card-section>
        </q-card>
      </a>
      <a :href="'/' + bookmark.bookId + '/' + bookmark.pageNumber" v-if="bookmark.pageNumber != 0">
        <q-card class="fit">
          <q-img
            :src="bookmark.extenalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + bookmark.bookId + '/' + bookmark.pageNumber"
              >{{ bookmark.bookTitle }} - تصویر {{ en2fa(bookmark.pageNumber.toString()) }}
            </a>
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
