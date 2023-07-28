<script setup>
import {  RouterView } from 'vue-router'
</script>

<template>
  <header>
    <img alt="نسک‌بان" class="logo" src="@/assets/logo.svg" width="125" height="125" />
    <div class="wrapper">
      <h1 class="green">نسک‌بان</h1>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>

header {
  margin: auto;
  text-align: center;
}
 .wrapper{
  margin: auto;
}

.logo {
  display: block;
  margin: auto;
}

</style>
