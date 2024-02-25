<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { routes } from './../routes'
const email = ref('')
const captchaImageId = ref('')
const captchaValue = ref('')
const loading = ref(false)

onMounted(async () => {
  document.title = 'نسک‌بان - نام‌نویسی';
  loading.value = true;
  const response = await fetch(`https://api.naskban.ir/api/users/captchaimage`);
  loading.value = false;
  if (!response.ok) {
    alert(await response.json())
    return
  }
  captchaImageId.value = await response.json();
})


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
      password: '',
      clientAppName: 'Naskban Vue Client',
      language: 'fa-IR'
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  var userInfo = await response.json()
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
  bus.emit('user-logged-in', userInfo)
  routes.push({ path: '/' })
}

</script>
<template>
    <div class="q-pa-lg flex flex-center"  v-if="loading" >
        <q-spinner-hourglass color="green" size="4em" />
    </div>
     
  <div class="flex flex-center">
   
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">ورود</div>
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
          @click="signIn"
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
