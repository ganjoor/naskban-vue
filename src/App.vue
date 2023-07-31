<script setup>
import {  RouterView } from 'vue-router'
</script>

<template>
  <header>
    <a href="/"><img alt="نسک‌بان" class="logo" src="@/assets/logo.svg" width="125" height="125" /></a>
    <div class="wrapper">
      <a href="/"><h1 class="green">نسک‌بان</h1></a>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>

header {
  margin: auto;
  text-align: center;
}
h1{
  font-size: 3em;
}
 .wrapper{
  margin: auto;
}

.logo {
  display: block;
  margin: auto;
}

</style>
