<!--
This example fetches latest Vue.js commits data from GitHub’s API and displays them as a list.
You can switch between the two branches.
-->

<script setup>
import { ref, watchEffect } from 'vue'

const API_URL = `https://api.naskban.ir/api/pdf`

const loading = ref(false)
const pageNumber = ref(20)
const pdfs = ref(null)

watchEffect(async () => {
  // this effect will run immediately and then
  // re-run whenever pageNumber.value changes
  const url = `${API_URL}?PageNumber=${pageNumber.value}&PageSize=20`
  loading.value = true;
  pdfs.value = await (await fetch(url)).json()
  loading.value = false;
})

</script>

<template>
  <h3>تازه‌ترین کتاب‌های افزوده شده</h3>
  
  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass
        v-if="loading"
        color="green"
        size="4em"
      />
    <q-pagination
      v-model="pageNumber"
      v-if="!loading"
      :max="100"
      :max-pages="7"
      direction-links
      boundary-links
      color="green"
      icon-last="skip_previous"
      icon-first="skip_next"
      icon-next="fast_rewind"
      icon-prev="fast_forward"
    />
  </div>

  <div class="flex-container">
    <div class="pdf" v-for="pdf in pdfs" :key="pdf.id">
      <a :href="pdf.externalPDFFileUrl"><img :src="pdf.extenalCoverImageUrl" :alt="pdf.title" width="200" loading="lazy" /> </a>
      <a :href="pdf.externalPDFFileUrl">{{ pdf.title }} <small v-if="pdf.authorsLine.length > 1">({{ pdf.authorsLine }})</small></a>
    </div>
  </div>
</template>

<style>
a {
  text-decoration: none;
  color: #42b883;
}
.flex-container {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
}
h3{
  text-align: center;
}
.pdf{
  text-align: center;
  max-width: 200px;
}
</style>