<!--
This example fetches latest Vue.js commits data from GitHub’s API and displays them as a list.
You can switch between the two branches.
-->

<script setup>
import { ref, watchEffect } from 'vue'

const API_URL = `https://api.naskban.ir/api/pdf`

const pdfs = ref(null)

watchEffect(async () => {
  // this effect will run immediately and then
  // re-run whenever currentBranch.value changes
  const url = `${API_URL}?PageNumber=20&PageSize=20`
  pdfs.value = await (await fetch(url)).json()
})

</script>

<template>
  <h3>تازه‌ترین کتاب‌های افزوده شده</h3>
  <div class="flex-container">
    <div class="pdf" v-for="pdf in pdfs" :key="pdf.id">
      <a :href="pdf.id"><img :src="pdf.extenalCoverImageUrl" :alt="pdf.title" /> </a>
      <a :href="pdf.id">{{ pdf.title }}</a>
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
}
h3{
  text-align: center;
}
.pdf{
  text-align: center;
  max-width: 300px;
}
</style>