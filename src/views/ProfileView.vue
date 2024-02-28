<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { routes } from './../routes'
import { useRoute } from 'vue-router'
const userInfo = ref(null)
const email = ref('aaa')
const password = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const route = useRoute()

onMounted(() => {
  document.title = 'نسک‌بان - نمایهٔ کاربر';
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  email.value = userInfo.value.user.email;
})

async function changePassword() {
  if(newPassword.value != confirmPassword.value){
    alert('لطفاً در کادر تکرار گذرواژه، گذرواژه را به درستی و مطابق گذرواژهٔ جدید وارد کنید.');
    return;
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
</script>
<template>
  <div class="flex flex-center">
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
  <div class="flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">نمایهٔ کاربر</div>
      <q-card-section>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="email"
          readonly
          label="پست الکترونیکی"
        ></q-input>
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
          v-model="password"
          type="password"
          label="گذرواژهٔ جدید"
        ></q-input>
        <q-input
          dense
          outlined
          class="q-mt-md"
          v-model="password"
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
