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
})
</script>

<template>
    <div class="view">
      <h1 v-if="pdf != null">{{pdf.title}}</h1>
    </div>
  </template>
  
  <style>
  @media (min-width: 1024px) {
    .about {
      min-height: 100vh;
      display: flex;
      align-items: center;
    }
  }
  </style>