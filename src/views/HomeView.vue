<script setup>
import { ref, watchEffect, onMounted } from 'vue'
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
  if (userInfo.value == null) {
    goToLogin()
  }
})

async function renewSession(){
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
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  if(res.status == 401){
    if(err401){
      goToLogin();
    }else{
      await renewSession();
      await loadList(true);
      return;
    }
  }
  if(res.status != 200){
    alert('فراخوانی سرویس نسکبان موفق نبود. لطفاً در صورت نیاز از نسکبان خارج و مجدداً به آن وارد شوید.');
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
  if (userInfo.value == null &&localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) {
    goToLogin()
  }
  

  canDelete.value = checkPermission('pdf', 'delete')

  await loadList(false);

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
function goTo(url){
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
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="history"
        class="green"
        @click="goToHistory"
      >
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
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="help"
        class="green"
        @click="goTo('/about')"
      >
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
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
        <q-card class="cursor-pointer fit">
          <a :href="'/'+ pdf.id">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
        </a>
          <q-card-section class="text-h6 book-info">
            <a :href="'/'+ pdf.id" class="book-title">{{ pdf.title }} </a>
          </q-card-section>
          <q-card-section
            class="text-subtitle2"
            v-if="pdf.authorsLine != null && pdf.authorsLine.length > 1"
          >
            {{ pdf.authorsLine }}
          </q-card-section>
        </q-card>
      <q-card v-if="canDelete" class="full-width q-pa-lg flex flex-center">
        <q-btn label="حذف کتاب" @click="deletePDFBook(pdf.id, pdf.title)" />
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

</style>
