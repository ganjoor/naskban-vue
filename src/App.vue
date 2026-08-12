<script setup>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { getStoredDarkMode, setStoredDarkMode } from './utilities/DarkMode'

const $q = useQuasar()

onMounted(() => {
  $q.dark.set(getStoredDarkMode())
})

function toggleDarkMode() {
  const next = !$q.dark.isActive
  $q.dark.set(next)
  setStoredDarkMode(next)
}
</script>

<template>
  <header v-if="$route.name != 'ganjoor' && $route.name != 'pdfframe'">
    <q-btn
      dense
      flat
      round
      :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
      class="green dark-mode-toggle"
      @click="toggleDarkMode"
    >
      <q-tooltip class="bg-green text-white">
        {{ $q.dark.isActive ? 'حالت روشن' : 'حالت تیره' }}
      </q-tooltip>
    </q-btn>
    <a href="/">
      <img
        alt="نسکبان"
        class="logo"
        src="@/assets/logo.svg"
        width="125"
        height="125"
      />
    </a>

    <div class="wrapper">
      <a href="/">
        <h1 class="green">نسکبان</h1>
      </a>
    </div>
  </header>

  <RouterView />

  <a href="https://myket.ir/app/ir.naskban.app">
    <img
      alt="نسکبان برای اندروید"
      class="android-logo"
      src="@/assets/app.png"
    />
  </a>
</template>

<style scoped>
header {
  margin: auto;
  text-align: center;
  position: relative;
}

.dark-mode-toggle {
  position: absolute;
  top: 8px;
  left: 8px;
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

.android-logo {
  display: block;
  width: 75%;
  max-width: 1280px;
  height: auto;
  margin: 0 auto;
}
</style>