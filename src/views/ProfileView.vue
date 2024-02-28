<script setup>
import { ref, onMounted } from 'vue'
import { bus } from './../event-bus'
import { routes } from './../routes'
import { useRoute } from 'vue-router'
const email = ref('aaa')
const password = ref('')
const loading = ref(false)
const route = useRoute()

onMounted(() => {
  document.title = 'نسک‌بان - نمایهٔ کاربر';
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
    routes.push({ path: route.query.redirect })
  }
  else{
    routes.push({ path: '/' })
  }

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
