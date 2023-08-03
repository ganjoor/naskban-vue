<script setup>
import { ref } from 'vue'
const email = ref('')
const password = ref('')
const loading = ref(false)

async function signIn() {
  loading.value = true
  const API_LOGIN = `https://api.naskban.ir/api/users/login`
  const response = await fetch(API_LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: email.value,
      password: password.value,
      clientAppName: 'Naskban Vue Client',
      language: 'fa-IR'
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  localStorage.setItem('userInfo', JSON.stringify(await response.json()))
}
function notImplementedAlert() {
  alert('هنوز پیاده‌سازی نشده!')
}
</script>
<template>
  <div class="flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">ورود</div>
      <q-card-section>
        <q-input dense outlined v-model="email" label="پست الکترونیکی"></q-input>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="password"
          type="password"
          label="گذرواژه"
        ></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="ورود"
          no-caps
          class="full-width"
          @click="signIn"
        ></q-btn>
      </q-card-section>
      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
          <a @click="notImplementedAlert" class="text-dark text-weight-bold">نام‌نویسی</a>
        </div>
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
