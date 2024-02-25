<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'
import { bus } from './event-bus'

const userInfo = ref(null)

bus.on('user-logged-in', (u) => {
  userInfo.value = u
})

bus.on('user-logged-out', () => {
  userInfo.value = null
})

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
})
</script>

<template>
  <header v-if="$route.name != 'ganjoor' && $route.name != 'pdfframe'">
    <a href="/"
      ><img alt="نسک‌بان" class="logo" src="@/assets/logo.svg" width="125" height="125"
    /></a>
    <div class="wrapper">
      <a href="/"><h1 class="green">نسک‌بان</h1></a>
    </div>
    <div v-if="userInfo != null">
      {{ userInfo.user.username }}
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  margin: auto;
  text-align: center;
}
h1 {
  font-size: 3em;
}
.wrapper {
  margin: auto;
}

.logo {
  display: block;
  margin: auto;
}
</style>
