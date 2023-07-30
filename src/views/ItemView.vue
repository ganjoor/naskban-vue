<script setup>
import { useRoute } from 'vue-router'
import { ref, watchEffect } from 'vue'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()

const loading = ref(false)

const pdf = ref(null)



watchEffect(async () => {
  const url = `${API_URL}/${route.params.id}`
  loading.value = true
  pdf.value = await (await fetch(url)).json()
  loading.value = false
  document.title = 'نسک‌بان - ' + pdf.value.title;
})
</script>

<template>
  <div class="q-pa-lg flex flex-center justify-center centers">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-card v-if="pdf != null">
      <q-card-section class="q-pa-lg flex flex-center justify-center centers" >
        <a :href="pdf.externalPDFFileUrl" target="_blank">
        <q-img
          :src="pdf.extenalCoverImageUrl"
          spinner-color="white"
          class="width-300px"
        >
        </q-img>
        </a>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="pdf.externalPDFFileUrl" target="_blank">{{ pdf.title }}</a>
      </q-card-section>
      <q-card-section v-if="pdf.subTitle != null" class="q-pa-lg flex flex-center">
        {{ pdf.subTitle }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        {{ pdf.authorsLine }}
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="'/' + pdf.id + '/1'">مشاهده</a>
      </q-card-section>
      <q-card-section class="q-pa-lg flex flex-center">
        <a :href="pdf.externalPDFFileUrl" target="_blank">دریافت</a>
      </q-card-section>
    </q-card>
  </div>
</template>

<style>
.width-300px{
  width: 300px;
}
</style>
