<script setup>
import { ref, onMounted } from 'vue'
import { routes } from './../routes'
const email = ref('')
const captchaImageId = ref('')
const captchaValue = ref('')
const loading = ref(false)

onMounted(async () => {
  document.title = 'نسک‌بان - نام‌نویسی'
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/captchaimage`)
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  captchaImageId.value = await response.json()
})

async function signUp() {
  loading.value = true
  const API_SIGNUP = `https://api.naskban.ir/api/users/signup`
  const response = await fetch(API_SIGNUP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.value,
      captchaImageId: captchaImageId.value,
      captchaValue: captchaValue.value,
      callbackUrl: '/',
      clientAppName: 'Naskban Vue Client',
      language: 'fa-IR'
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    loading.value = true
    const response2 = await fetch(`https://api.naskban.ir/api/users/captchaimage`)
    loading.value = false
    if (!response2.ok) {
      alert(await response2.json())
      return
    }
    captchaImageId.value = await response2.json()
    return
  }

  routes.push({ path: '/' })
}
</script>
<template>
  <div class="q-pa-lg flex flex-center" v-if="loading">
    <q-spinner-hourglass color="green" size="4em" />
  </div>

  <div class="flex flex-center">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">نام‌نویسی</div>
      <q-card-section>
        <q-input dense outlined v-model="email" label="پست الکترونیکی"></q-input>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <img :src="`https://api.naskban.ir/api/rimages/${captchaImageId}.jpg`" />
      </q-card-section>
      <q-card-section>
        <q-input dense outlined v-model="captchaValue" label="عدد تصویر امنیتی"></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="نام‌نویسی"
          no-caps
          class="full-width"
          @click="signUp"
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
