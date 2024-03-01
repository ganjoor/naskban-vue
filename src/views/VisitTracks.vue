<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import { en2fa } from '../en2fa'
import { bus } from '../event-bus'


const loading = ref(false)
const visits = ref(null)
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
  
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/visits`,
    {
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  visits.value = await res.json()
  
  loading.value = false
  let pageUrl = ''
  let docTitle = 'نسک‌بان - بازدیدهای اخیر من'

  
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
    </div>
  </q-bar>


  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div class="row justify-center">
    <div class="pdf flex q-ma-sm" v-for="visit in visits" :key="visit.id">
      <a :href="'/' + visit.pdfBookId" v-if="visit.pageNumber == null">
        <q-card class="fit">
          <q-img
            :src="visit.externalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + visit.pdfBookId">{{ visit.bookTitle }} </a>
          </q-card-section>
        </q-card>
      </a>
      <a :href="'/' + visit.pdfBookId + '/' + visit.pageNumber" v-if="visit.pageNumber != null">
        <q-card class="fit">
          <q-img
            :src="visit.externalImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + visit.pdfBookId + '/' + visit.pageNumber"
              >{{ visit.bookTitle }} - صفحهٔ {{ en2fa(visit.pageNumber.toString()) }}
            </a>
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
