<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { en2fa } from '../en2fa'
import { bus } from '../event-bus'
import PermissionChecker from './../utilities/PermissionChecker'

const route = useRoute()
const loading = ref(false)
const pageNumber = ref(null)
const pdfs = ref(null)
const pageCount = ref(1)
const searchTerm = ref('')
const pageSize = 20
const userInfo = ref(null)
const canDelete = ref(false)
const recentReads = ref([])
// filtered here, not in the template, so the v-for below never needs a
// v-if alongside it (mixing the two on one element is an eslint error -
// vue/no-use-v-if-with-v-for - since Vue evaluates v-if per-iteration
// there, which is both confusing and wasteful)
const validRecentReads = computed(() => recentReads.value.filter((v) => v.pageNumber != null))

bus.on('user-logged-out', () => {
  userInfo.value = null
  recentReads.value = []
})

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  loadRecentReads()
  /*if (userInfo.value == null) {
    goToLogin()
  }*/
})

async function loadRecentReads() {
  if (userInfo.value == null) return
  const res = await fetch(`https://api.naskban.ir/api/pdf/visits`, {
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  if (res.ok) {
    recentReads.value = await res.json()
  }
}

async function renewSession() {
  loading.value = true
  let response = await fetch(
    `https://api.naskban.ir/api/users/relogin/${userInfo.value.sessionid}`,
    {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      }
    }
  )
  loading.value = false
  if (response.ok) {
    userInfo.value = await response.json()
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }
}

async function loadList(err401) {
  if (pageNumber.value == null) {
    if (route.query.page != null) {
      pageNumber.value = route.query.page
    } else {
      pageNumber.value = 1
    }
  }
  let url = `https://api.naskban.ir/api/pdf?PageNumber=${pageNumber.value}&PageSize=${pageSize}`

  if (route.query.s != null) {
    searchTerm.value = route.query.s
  }
  if (searchTerm.value != '') {
    url = `https://api.naskban.ir/api/pdf/search?term=${searchTerm.value}&PageNumber=${pageNumber.value}&PageSize=${pageSize}`
  }
  loading.value = true
  const res = await fetch(url, {
    headers: {
      authorization: userInfo.value == null ? null : 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  if (res.status == 401) {
    if (err401) {
      goToLogin()
    } else {
      await renewSession()
      await loadList(true)
      return
    }
  }
  if (res.status != 200) {
    alert(
      'فراخوانی سرویس نسکبان موفق نبود. لطفاً در صورت نیاز از نسکبان خارج و مجدداً به آن وارد شوید.'
    )
  }
  pdfs.value = await res.json()
  for (var pair of res.headers.entries()) {
    if (pair[0] == 'paging-headers') {
      const paging_headers = JSON.parse(pair[1])
      pageCount.value = paging_headers.totalPages
    }
  }
  loading.value = false
}

watchEffect(async () => {
  /*if (userInfo.value == null &&localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) {
    goToLogin()
  }*/

  canDelete.value = checkPermission('pdf', 'delete')

  await loadList(false)

  let pageUrl = ''
  let docTitle = 'نسکبان'
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

function doSearch() {
  searchTerm.value = document.getElementById('s').value
  pageNumber.value = 1
}

function fullTextSearch() {
  window.location.href = '/text?s=' + encodeURI(document.getElementById('s').value)
}
function checkPermission(secShortName, opShortName) {
  return PermissionChecker.check(userInfo.value, secShortName, opShortName)
}
async function deletePDFBook(id, title) {
  if (!confirm(`آیا از حذف ${title} اطمینان دارید؟`)) {
    return
  }
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf/${id}`, {
    method: 'DELETE',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!response.ok) {
    alert(`${title} - ${await response.json()}`)
    return
  }
  alert(`${title} حذف شد!`)
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
function goToShelves() {
  window.location.href = '/shelves'
}
function goToHistory() {
  window.location.href = '/visits'
}
async function logout() {
  if (!confirm(`از حساب کاربری خود بیرون می‌روید؟`)) {
    return
  }
  localStorage.setItem('userInfo', null)
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
  bus.emit('user-logged-out')
  window.location.href = '/'
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
      <q-btn v-if="userInfo != null" dense flat icon="collections_bookmark" class="green" @click="goToShelves">
        <q-tooltip class="bg-green text-white">قفسه‌های من</q-tooltip>
      </q-btn>
      <q-btn v-if="userInfo != null" dense flat icon="history" class="green" @click="goToHistory">
        <q-tooltip class="bg-green text-white">بازدیدهای اخیر من</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced v-if="userInfo != null" />
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
      <q-separator vertical inset spaced v-if="userInfo != null" />
      <q-btn dense flat icon="help" class="green" @click="goTo('/about')">
        <q-tooltip class="bg-green text-white">معرفی</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced v-if="userInfo == null" />
      <q-btn
        v-if="userInfo == null"
        dense
        flat
        icon="login"
        class="green flip-horizontal"
        @click="goToLogin"
      >
        <q-tooltip class="bg-green text-white">ورود</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <div
    class="row justify-center recent-reads"
    v-if="userInfo != null && validRecentReads.length > 0 && searchTerm == '' && pageNumber == 1"
  >
    <div class="full-width q-pl-lg q-pr-lg q-pt-sm">
      <div class="text-subtitle1 text-weight-bold">آخرین خوانده‌ها</div>
    </div>
    <div class="recent-reads-scroller">
      <a
        v-for="visit in validRecentReads"
        :key="visit.pdfBookId"
        :href="'/' + visit.pdfBookId + '/' + visit.pageNumber"
        class="recent-read-item"
      >
        <q-img
          :src="visit.externalImageUrl"
          spinner-color="white"
          style="width: 110px; height: 150px"
          class="rounded-borders"
        />
        <div class="recent-read-title">{{ visit.bookTitle }}</div>
        <div class="recent-read-page">صفحهٔ {{ en2fa(visit.pageNumber.toString()) }}</div>
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

  <div class="row justify-center">
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
      <q-card class="cursor-pointer fit">
        <a :href="'/' + pdf.id">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
        </a>
        <q-card-section class="text-h6 book-info">
          <a :href="'/' + pdf.id" class="book-title">{{ pdf.title }} </a>
        </q-card-section>
        <q-card-section
          class="text-subtitle2"
          v-if="pdf.authorsLine != null && pdf.authorsLine.length > 1"
        >
          {{ pdf.authorsLine }}
        </q-card-section>
        <q-card-section v-if="canDelete" class="full-width q-pa-lg flex flex-center">
          <q-btn label="حذف کتاب" @click="deletePDFBook(pdf.id, pdf.title)" />
        </q-card-section>
      </q-card>
    </div>
  </div>

  <div class="q-pa-lg flex flex-center bottom-navbar">
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
.recent-reads {
  padding-top: 12px;
}
.recent-reads-scroller {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 8px 16px 16px 16px;
  max-width: 100%;
}
.recent-read-item {
  flex: 0 0 auto;
  width: 110px;
  text-align: center;
}
.recent-read-title {
  font-size: 0.85em;
  color: black;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-read-page {
  font-size: 0.75em;
  color: gray;
}
</style>
