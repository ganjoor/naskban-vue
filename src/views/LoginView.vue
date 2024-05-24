<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { useRouter, useRoute } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()

onMounted(() => {
  document.title = 'نسکبان - ورود';
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
  var userInfo = await response.json()
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
  bus.emit('user-logged-in', userInfo)
  if(route.query.redirect != null){
    router.push({ path: route.query.redirect })
  }
  else{
    router.push({ path: '/' })
  }

}
function goToSignup() {
  if(route.query.redirect != null){
    window.location.href = '/signup?redirect=' + route.query.redirect;
  }
  else{
    window.location.href = '/signup';
  }
  
}
function goToResetPassword(){
  if(route.query.redirect != null){
    window.location.href = '/password?redirect=' + route.query.redirect;
  }
  else{
    window.location.href = '/password';
  }
  
}
</script>
<template>
  <div class="flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">ورود</div>
      <q-card-section>
        <q-input dense outlined v-model="email" label="پست الکترونیکی" autocomplete="username"></q-input>
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
          <a @click="goToSignup" class="cursor-pointer text-dark text-weight-bold">نام‌نویسی</a>
        </div>
      </q-card-section>
      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
          <a @click="goToResetPassword" class="cursor-pointer text-dark text-weight-bold">فراموشی گذرواژه</a>
        </div>
      </q-card-section>
      <q-card-section>
        <p>نسکبان یک کتابخانه از فایل‌های PDF کتاب‌های فارسی است که امکان جستجو در متن آنها وجود دارد. برای آشنایی بیشتر با آن <a href="/about">اینجا</a> را ببینید.</p>
      </q-card-section>
      <q-card-section>
        <p>برای استفاده از امکانات نسکبان باید وارد آن شوید. اگر حساب کاربری ندارید <a href="/signup">نام‌نویسی</a> کنید.</p>
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
