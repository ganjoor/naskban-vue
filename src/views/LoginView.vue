<script setup>
function notImplementedAlert(){
    alert('هنوز پیاده‌سازی نشده!')
}
</script>
<template>
  <div class="flex flex-center">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
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
