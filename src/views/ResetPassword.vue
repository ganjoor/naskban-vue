<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const email = ref('')
const captchaImageId = ref('')
const captchaValue = ref('')
const verificationCode = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const phase = ref('signup')

onMounted(async () => {
  document.title = 'نسکبان - فراموشی گذرواژه'
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/captchaimage`)
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  captchaImageId.value = await response.json()
  if(route.query.secret != null){
    verificationCode.value = route.query.secret;
    phase.value = 'verify';
  }
})

async function signUp() {
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/forgotpassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.value,
      captchaImageId: captchaImageId.value,
      captchaValue: captchaValue.value,
      callbackUrl: route.query.redirect != null ?  'https://naskban.ir/password?redirect=' + route.query.redirect : 'https://naskban.ir/password',
      clientAppName: 'Naskban Vue Client',
      language: 'fa-IR'
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    loading.value = true
    const responseNewCaptcha = await fetch(`https://api.naskban.ir/api/users/captchaimage`)
    loading.value = false
    if (!responseNewCaptcha.ok) {
      alert(await responseNewCaptcha.json())
      return
    }
    captchaImageId.value = await responseNewCaptcha.json()
    return
  }

  phase.value = 'verify';
}
function goToSignup() {
  phase.value = 'signup';
}
async function verify() {
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/users/verify?type=1&secret=${verificationCode.value}`, {
    method: 'GET',
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }

  email.value = await response.json();
  phase.value = 'final';
}
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
async function finalizeSetup(){
  if(password.value != confirmPassword.value){
    alert('لطفاً در کادر تکرار گذرواژه، گذرواژه را به درستی و مطابق گذرواژه وارد کنید.');
    return;
  }
  const response = await fetch(`https://api.naskban.ir/api/users/resetpassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.value,
      secret: verificationCode.value,
      password: password.value,
    })
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }

  await signIn();

}
</script>
<template>
  <div class="q-pa-lg flex flex-center" v-if="loading">
    <q-spinner-hourglass color="green" size="4em" />
  </div>

  <div class="flex flex-center" v-if="phase == 'signup'">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">فراموشی گذرواژه</div>
      <q-card-section>
        <q-input dense outlined v-model="email" label=" (ایمیل) پست الکترونیکی" autocomplete="off"></q-input>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <img :src="`https://api.naskban.ir/api/rimages/${captchaImageId}.jpg`" />
      </q-card-section>
      <q-card-section>
        <q-input dense outlined v-model="captchaValue" label="عدد تصویر امنیتی" autocomplete="off"></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="ادامه"
          no-caps
          class="full-width"
          @click="signUp"
        ></q-btn>
      </q-card-section>
    </q-card>
  </div>
  <div class="flex flex-center" v-if="phase == 'verify'">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">تأیید نام‌نویسی</div>
      <q-card-section>
        <p>لطفاً ایمیل خود را بررسی بفرمایید. می‌بایست ایمیلی از نشانی noreply@naskban.ir حاوی یک کد عددی دریافت کرده باشید. ‌آن کد را در کادر زیر وارد کنید:</p>
      </q-card-section>
      <q-card-section>
        <q-input dense outlined v-model="verificationCode" label="کد ۶ رقمی تأیید" autocomplete="off"></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="بررسی"
          no-caps
          class="full-width"
          @click="verify"
        ></q-btn>
        <q-card-section class="text-center q-pa-md">
        <div class="text-grey-8">
          <a @click="goToSignup" class="text-dark text-weight-bold">مرحلهٔ قبل</a>
        </div>
      </q-card-section>
      </q-card-section>
    </q-card>
  </div>
  <div class="flex flex-center" v-if="phase == 'final'">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">تعیین گذرواژهٔ جدید</div>
      <q-card-section>
        <p>گذرواژه باید دست کم شامل ۶ حرف باشد و از ترکیبی از اعداد و حروف انگلیسی تشکیل شده باشد. </p>
        <p>حروف و اعداد نباید تکراری باشند و وجود حداقل یک عدد و یک حرف کوچک انگلیسی در گذرواژه الزامی است.</p>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="password"
          type="password"
          label="گذرواژه"
          autocomplete="off"
        ></q-input>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="confirmPassword"
          type="password"
          label="تکرار گذرواژه"
          autocomplete="off"
        ></q-input>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="green"
          rounded
          size="md"
          label="پایان"
          no-caps
          class="full-width"
          @click="finalizeSetup"
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
