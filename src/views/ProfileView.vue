<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { useRoute } from 'vue-router'
const route = useRoute()
const userInfo = ref(null)

const email = ref('')
const password = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const firstName = ref('')
const sureName = ref('')
const nickName = ref('')

const phase = ref('start')

const verificationCode = ref('')

const searchTerm = ref('')

const loading = ref(false)

onMounted(() => {
  document.title = 'نسکبان - نمایهٔ کاربر'
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  email.value = userInfo.value.user.email
  firstName.value = userInfo.value.user.firstName
  sureName.value = userInfo.value.user.sureName
  nickName.value = userInfo.value.user.nickName

  if(route.query.secret != null){
    verificationCode.value = route.query.secret;
    phase.value = 'verify';
  }
})


async function changePassword() {
  if (newPassword.value != confirmPassword.value) {
    alert('لطفاً در کادر تکرار گذرواژه، گذرواژه را به درستی و مطابق گذرواژهٔ جدید وارد کنید.')
    return
  }
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/setmypassword`, {
    method: 'POST',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      oldPassword: password.value,
      newPassword: newPassword.value
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  alert('گذرواژهٔ شما به درستی تغییر کرد.')
}

async function saveProfile() {
  loading.value = true
  userInfo.value.user.nickName = nickName.value
  userInfo.value.user.firstName = firstName.value
  userInfo.value.user.sureName = sureName.value
  const response = await fetch(`https://api.naskban.ir/api/users/${userInfo.value.user.id}`, {
    method: 'PUT',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    },
    body: JSON.stringify(userInfo.value.user)
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  alert('ذخیره شد.');
}

async function startDeleteUser() {
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/selfdelete/start`, {
    method: 'POST',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      password: password.value,
      callbackUrl: 'https://naskban.ir/profile'
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  phase.value = 'verify'
}
async function finalizeDelete() {
  if (!confirm('آیا از حذف حساب کاربری خود اطمینان دارید؟')) {
    return
  }
  loading.value = true
  const response = await fetch(
    `https://api.naskban.ir/api/users/selfdelete/finalize/${verificationCode.value}`,
    {
      method: 'DELETE',
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  localStorage.setItem('userInfo', null)
  bus.emit('user-logged-out')
  window.location.href = '/login'
}
function doSearch() {
  window.location.href = '/?s=' + document.getElementById('s').value
}
function fullTextSearch() {
  window.location.href = '/text?s=' + encodeURI(document.getElementById('s').value)
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
      <form>
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
      </form>
    
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

  <div class="flex flex-center q-pa-lg" v-if="phase == 'start'">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">تغییر گذرواژه</div>
      <q-card-section>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="password"
          type="password"
          label="گذرواژهٔ کنونی"
        ></q-input>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="newPassword"
          type="password"
          label="گذرواژهٔ جدید"
        ></q-input>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="confirmPassword"
          type="password"
          label="تکرار گذرواژهٔ کنونی"
        ></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="تغییر گذرواژه"
          no-caps
          class="full-width"
          @click="changePassword"
        ></q-btn>
      </q-card-section>
    </q-card>
  </div>
  <div class="flex flex-center" v-if="phase == 'start'">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">نمایهٔ کاربر</div>
      <q-card-section>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="email"
          autocomplete="username"
          readonly
          label="پست الکترونیکی"
        ></q-input>
        <q-input dense outlined class="q-mt-md" v-model="nickName" label="نام مستعار"></q-input>
        <q-input dense outlined class="q-mt-md" v-model="firstName" label="نام"></q-input>
        <q-input dense outlined class="q-mt-md" v-model="sureName" label="نام خانوادگی"></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="ذخیره"
          no-caps
          class="full-width"
          @click="saveProfile"
        ></q-btn>
      </q-card-section>
    </q-card>
  </div>
  <div class="flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">حذف حساب کاربری</div>
      <p>
        حذف حساب کاربری موجب حذف تمام سوابق کاربر در نسکبان به صورت غیر قابل برگشت می‌شود. در صورت
        نام‌نویسی دوباره موارد نشان‌شده و سایر اطلاعات برنخواهد گشت.
      </p>
      <p v-if="phase != 'verify'">برای شروع عملیات حذف حساب کاربری گذرواژهٔ خود را وارد کنید.</p>
      <q-card-section v-if="phase != 'verify'">
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="password"
          type="password"
          label="گذرواژه"
        ></q-input>
      </q-card-section>
      <q-card-section v-if="phase != 'verify'">
        <q-btn
          color="red"
          rounded
          size="md"
          label="حذف حساب کاربری"
          no-caps
          class="full-width"
          @click="startDeleteUser"
        ></q-btn>
      </q-card-section>
      <q-card-section v-if="phase == 'verify'">
        <p>
          لطفاً ایمیل خود را بررسی بفرمایید. می‌بایست ایمیلی از نشانی noreply@naskban.ir حاوی یک کد
          عددی دریافت کرده باشید. ‌آن کد را در کادر زیر وارد کنید:
        </p>
      </q-card-section>
      <q-card-section v-if="phase == 'verify'">
        <q-input
          dense
          outlined
          v-model="verificationCode"
          label="کد ۶ رقمی تأیید"
          autocomplete="off"
        ></q-input>
      </q-card-section>
      <q-card-section v-if="phase == 'verify'">
        <q-btn
          color="red"
          rounded
          size="md"
          label="حذف نهایی حساب کاربری"
          no-caps
          class="full-width"
          @click="finalizeDelete"
        ></q-btn>
      </q-card-section>
    </q-card>
  </div>
</template>
<style>
.login-card {
  width: 25rem;
  border-radius: 8px;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
}
</style>
